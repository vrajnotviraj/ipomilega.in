// Signup rules for IPO alerts, kept free of runtime imports so signup.check.mjs runs them under plain Node.
// Storage design: ipomilega-engine/docs/plans/2026-10-05-subscriber-email-storage.md

export type EmailStatus = 'active' | 'unsubscribed' | 'bounced' | 'complained';
export type WhatsappStatus = 'active' | 'unsubscribed' | 'invalid';
export type Channel = 'email' | 'whatsapp';

export interface ConsentEvent {
  at: Date;
  channel: Channel;
  action: 'subscribe' | 'unsubscribe';
  form?: string;
  page?: string;
  text_version?: string;
}

/** One person in the `subscribers` collection. Channel fields are null when that channel was never given. */
export interface Subscriber {
  name: string | null;
  email: string | null;
  email_key: string | null;
  email_status: EmailStatus | null;
  email_since: Date | null;
  unsubscribed_at: Date | null;
  welcome_sent_at: Date | null;
  phone: string | null;
  phone_key: string | null;
  whatsapp_status: WhatsappStatus | null;
  whatsapp_since: Date | null;
  whatsapp_stopped_at: Date | null;
  unsubscribe_token: string;
  source: { form: string; page: string | null; at: Date };
  consent: ConsentEvent[];
  created_at: Date;
  updated_at: Date;
}

export type StoredSubscriber = Subscriber & { _id: unknown };

/** The wording shown beside each field, versioned so a consent record says what the person agreed to. */
export const CONSENT_TEXT_VERSION = 'v1';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Indian mobiles: 10 digits starting 6-9, after an optional +91, 91 or 0 prefix.
const INDIAN_MOBILE_RE = /^(?:\+?91|0)?([6-9]\d{9})$/;

/** The email trimmed and its lowercase key, or null when it isn't a plausible address. */
export function normalizeEmail(raw: string): { email: string; key: string } | null {
  const email = raw.trim();
  if (email.length > 254 || !EMAIL_RE.test(email)) return null;
  return { email, key: email.toLowerCase() };
}

/** The number as typed and its E.164 key (+91 and 10 digits), or null when it isn't an Indian mobile. */
export function normalizePhone(raw: string): { phone: string; key: string } | null {
  const phone = raw.trim();
  const digits = phone.replace(/[\s().-]/g, '');
  const match = phone.length <= 20 ? digits.match(INDIAN_MOBILE_RE) : null;
  return match ? { phone, key: `+91${match[1]}` } : null;
}

export interface SignupInput {
  email: { email: string; key: string } | null;
  phone: { phone: string; key: string } | null;
  name: string | null;
  form: string;
  page: string | null;
}

/**
 * Checks a signup body. Every value must be a string, so a body like {"email": {"$ne": null}} can't reach a Mongo filter.
 * Needs at least one of email or phone; a field that is filled but invalid is an error, not ignored.
 */
export function parseSignup(body: unknown): { ok: true; input: SignupInput } | { ok: false; message: string } {
  const { email, phone, name, form, page } = (body ?? {}) as Record<string, unknown>;
  const text = (value: unknown, max: number) => (typeof value === 'string' && value.trim() && value.length <= max ? value.trim() : null);
  const filled = (value: unknown) => typeof value === 'string' && value.trim() !== '';

  if ([email, phone, name, form, page].some((value) => value != null && typeof value !== 'string')) {
    return { ok: false, message: 'Enter a valid email or WhatsApp number.' };
  }
  const emailValue = filled(email) ? normalizeEmail(email as string) : null;
  if (filled(email) && !emailValue) return { ok: false, message: 'Enter a valid email address.' };
  const phoneValue = filled(phone) ? normalizePhone(phone as string) : null;
  if (filled(phone) && !phoneValue) return { ok: false, message: 'Enter a 10-digit Indian mobile number.' };
  if (!emailValue && !phoneValue) return { ok: false, message: 'Enter your email or WhatsApp number.' };

  const pagePath = text(page, 200);
  return {
    ok: true,
    input: {
      email: emailValue,
      phone: phoneValue,
      name: text(name, 100),
      form: text(form, 40) ?? 'unknown',
      page: pagePath?.startsWith('/') ? pagePath : null,
    },
  };
}

/** A new subscriber document with the given channels active. */
export function newSubscriber(input: SignupInput, token: string, now: Date): Subscriber {
  return {
    name: input.name,
    email: input.email?.email ?? null,
    email_key: input.email?.key ?? null,
    email_status: input.email ? 'active' : null,
    email_since: input.email ? now : null,
    unsubscribed_at: null,
    welcome_sent_at: null,
    phone: input.phone?.phone ?? null,
    phone_key: input.phone?.key ?? null,
    whatsapp_status: input.phone ? 'active' : null,
    whatsapp_since: input.phone ? now : null,
    whatsapp_stopped_at: null,
    unsubscribe_token: token,
    source: { form: input.form, page: input.page, at: now },
    consent: consentEvents(input, now),
    created_at: now,
    updated_at: now,
  };
}

/** One subscribe event per channel the person filled in. */
export function consentEvents(input: SignupInput, now: Date, channels: Channel[] = ['email', 'whatsapp']): ConsentEvent[] {
  const given = channels.filter((channel) => (channel === 'email' ? input.email : input.phone));
  return given.map((channel) => ({ at: now, channel, action: 'subscribe', form: input.form, page: input.page ?? undefined, text_version: CONSENT_TEXT_VERSION }));
}

export interface ChannelWrite {
  /** Matches the doc only while it is still in the state it was read in, so a concurrent writer makes this a no-op. */
  filter: Record<string, unknown>;
  set: Record<string, unknown>;
  consent: ConsentEvent[];
  /** True when this write turns the email channel on, which is when the welcome mail goes out. */
  emailActivated: boolean;
}

/**
 * The write for one existing doc: which of the submitted channels it takes, and their state changes.
 * An active channel stays as it is. A channel the doc doesn't hold yet is added only when `claim` says the value is free,
 * so a phone number never moves from one person to another on an unverified form.
 */
export function channelWrite(doc: StoredSubscriber, input: SignupInput, claim: { email: boolean; phone: boolean }, now: Date): ChannelWrite {
  const filter: Record<string, unknown> = { _id: doc._id, email_status: doc.email_status, whatsapp_status: doc.whatsapp_status };
  const set: Record<string, unknown> = { updated_at: now };
  const channels: Channel[] = [];
  let emailActivated = false;

  const takesEmail = input.email && (doc.email_key === input.email.key || (claim.email && !doc.email_key));
  if (takesEmail && input.email) {
    channels.push('email');
    if (!doc.email_key) Object.assign(set, { email: input.email.email, email_key: input.email.key });
    if (doc.email_status !== 'active') {
      Object.assign(set, { email_status: 'active', email_since: now });
      emailActivated = true;
    }
  }

  const takesPhone = input.phone && (doc.phone_key === input.phone.key || (claim.phone && !doc.phone_key));
  if (takesPhone && input.phone) {
    channels.push('whatsapp');
    if (!doc.phone_key) Object.assign(set, { phone: input.phone.phone, phone_key: input.phone.key });
    if (doc.whatsapp_status !== 'active') Object.assign(set, { whatsapp_status: 'active', whatsapp_since: now });
  }

  if (input.name && !doc.name) set.name = input.name;
  return { filter, set, consent: consentEvents(input, now, channels), emailActivated };
}

/** The docs a submit writes to, given the doc holding its email and the doc holding its phone (either may be null or the same). */
export function signupTargets(byEmail: StoredSubscriber | null, byPhone: StoredSubscriber | null) {
  if (byEmail && byPhone && String(byEmail._id) !== String(byPhone._id)) {
    // Two people already: each keeps its own channel, nothing is merged.
    return [
      { doc: byEmail, claim: { email: true, phone: false } },
      { doc: byPhone, claim: { email: false, phone: true } },
    ];
  }
  // One doc holds whichever values exist, so the others are free to join it.
  const doc = byEmail ?? byPhone;
  return doc ? [{ doc, claim: { email: true, phone: true } }] : [];
}

/** How long after one welcome mail another can go to the same person, so the form can't be used to flood an inbox. */
export const WELCOME_RESEND_MS = 10 * 60 * 1000;
