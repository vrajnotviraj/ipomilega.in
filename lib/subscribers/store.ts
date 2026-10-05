import 'server-only';
import { randomBytes } from 'node:crypto';
import { Collection, MongoServerError } from 'mongodb';
import { getDb } from '@/lib/db/mongo';
import {
  Channel,
  channelWrite,
  newSubscriber,
  SignupInput,
  signupTargets,
  StoredSubscriber,
  Subscriber,
  WELCOME_RESEND_MS,
} from '@/lib/subscribers/signup';

const COLLECTION = 'subscribers';
const CONSENT_KEEP = 20;

const globalWithIndexes = global as typeof globalThis & { _subscriberIndexes?: Promise<void> };

/** Creates the collection's indexes once per process. createIndexes is a no-op when they already exist. */
function ensureIndexes(subscribers: Collection<Subscriber>): Promise<void> {
  globalWithIndexes._subscriberIndexes ??= subscribers
    .createIndexes([
      { key: { email_key: 1 }, unique: true, partialFilterExpression: { email_key: { $type: 'string' } } },
      { key: { phone_key: 1 }, unique: true, partialFilterExpression: { phone_key: { $type: 'string' } } },
      { key: { unsubscribe_token: 1 }, unique: true },
      { key: { email_status: 1, _id: 1 } },
      { key: { whatsapp_status: 1, _id: 1 } },
    ])
    .then(() => undefined)
    .catch((error) => {
      globalWithIndexes._subscriberIndexes = undefined;
      throw error;
    });
  return globalWithIndexes._subscriberIndexes;
}

async function subscribersCollection() {
  const subscribers = (await getDb()).collection<Subscriber>(COLLECTION);
  await ensureIndexes(subscribers);
  return subscribers;
}

const isDuplicateKey = (error: unknown) => error instanceof MongoServerError && error.code === 11000;

/** Who gets a welcome mail after a signup: only someone whose email channel just turned on. */
export type Welcome = { email: string; name: string | null; unsubscribeToken: string };

/**
 * Records a signup and returns who to welcome, if anyone.
 * Each write is compare-and-set on the statuses it read, and an insert can hit the unique email or phone index,
 * so a submit racing another one re-reads and tries again rather than overwrite or duplicate.
 */
export async function recordSignup(input: SignupInput): Promise<Welcome | null> {
  const subscribers = await subscribersCollection();

  for (let attempt = 0; attempt < 3; attempt++) {
    const now = new Date();
    const [byEmail, byPhone] = (await Promise.all([
      input.email ? subscribers.findOne({ email_key: input.email.key }) : null,
      input.phone ? subscribers.findOne({ phone_key: input.phone.key }) : null,
    ])) as (StoredSubscriber | null)[];

    const targets = signupTargets(byEmail, byPhone);
    if (targets.length === 0) {
      try {
        const doc = newSubscriber(input, randomBytes(24).toString('base64url'), now);
        const { insertedId } = await subscribers.insertOne(doc);
        return input.email ? claimWelcome(subscribers, insertedId, now) : null;
      } catch (error) {
        if (isDuplicateKey(error)) continue;
        throw error;
      }
    }

    let raced = false;
    let welcomeId: unknown = null;
    for (const { doc, claim } of targets) {
      const write = channelWrite(doc, input, claim, now);
      try {
        const { matchedCount } = await subscribers.updateOne(write.filter, {
          $set: write.set,
          ...(write.consent.length ? { $push: { consent: { $each: write.consent, $slice: -CONSENT_KEEP } } } : {}),
        });
        if (matchedCount === 0) raced = true;
        else if (write.emailActivated) welcomeId = doc._id;
      } catch (error) {
        // Another submit took the email or phone between our read and this write.
        if (isDuplicateKey(error)) raced = true;
        else throw error;
      }
    }
    if (welcomeId) return claimWelcome(subscribers, welcomeId, now);
    if (!raced) return null;
  }
  throw new Error('Signup kept racing another write');
}

/** Marks the welcome mail as sent before it goes out, so two quick submits send it once; skips a mail sent in the last few minutes. */
async function claimWelcome(subscribers: Collection<Subscriber>, id: unknown, now: Date): Promise<Welcome | null> {
  const claimed = await subscribers.findOneAndUpdate(
    {
      _id: id as never,
      email_status: 'active',
      $or: [{ welcome_sent_at: null }, { welcome_sent_at: { $lt: new Date(now.getTime() - WELCOME_RESEND_MS) } }],
    },
    { $set: { welcome_sent_at: now } },
    { returnDocument: 'after' }
  );
  if (!claimed?.email) return null;
  return { email: claimed.email, name: claimed.name, unsubscribeToken: claimed.unsubscribe_token };
}

/** Lets the welcome mail be sent again on the next signup, after it failed to go out. */
export async function releaseWelcome(email: string) {
  const subscribers = await subscribersCollection();
  await subscribers.updateOne({ email_key: email.toLowerCase() }, { $set: { welcome_sent_at: null } });
}

/** Turns one channel off for the holder of an unsubscribe token. True when the token matched a subscriber. */
export async function unsubscribe(token: string, channel: Channel): Promise<boolean> {
  const subscribers = await subscribersCollection();
  const now = new Date();
  const event = { at: now, channel, action: 'unsubscribe' as const };
  const status = channel === 'email' ? 'email_status' : 'whatsapp_status';
  const set: Partial<Subscriber> =
    channel === 'email'
      ? { email_status: 'unsubscribed', unsubscribed_at: now }
      : { whatsapp_status: 'unsubscribed', whatsapp_stopped_at: now };

  const { matchedCount } = await subscribers.updateOne(
    { unsubscribe_token: token, [status]: 'active' },
    { $set: { ...set, updated_at: now }, $push: { consent: { $each: [event], $slice: -CONSENT_KEEP } } }
  );
  // Already unsubscribed counts as done, so a second click shows the same page.
  return matchedCount > 0 || (await subscribers.countDocuments({ unsubscribe_token: token }, { limit: 1 })) > 0;
}
