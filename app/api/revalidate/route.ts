import { createHash, timingSafeEqual } from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import { after, NextRequest, NextResponse } from 'next/server';
import { SITE_DATA_TAG } from '@/lib/db/cache';
import { LOCALES, localePath } from '@/lib/i18n/locales';
import { SITE_URL } from '@/lib/seo/share';

export const dynamic = 'force-dynamic';

// Home and /ipos in every language, re-rendered after each purge.
const WARM_PATHS = LOCALES.flatMap((lang) => ['/', '/ipos'].map((path) => localePath(lang, path)));

const digest = (value: string) => createHash('sha256').update(value).digest();

/** True when the request carries `Authorization: Bearer <secret>`. */
function isAuthorized(req: NextRequest, secret: string) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  return timingSafeEqual(digest(token), digest(secret));
}

/** Purges every page and cached read. The engine calls it after each write. */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ success: false, message: 'REVALIDATE_SECRET not configured' }, { status: 500 });
  }
  if (!isAuthorized(req, secret)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // From the root layout down, so dynamic pages such as /analysis/[id] go too.
  revalidatePath('/', 'layout');
  revalidateTag(SITE_DATA_TAG);
  after(() => Promise.allSettled(WARM_PATHS.map((path) => fetch(`${SITE_URL}${path}`, { cache: 'no-store' }))));
  return NextResponse.json({ success: true, revalidated: true, at: new Date().toISOString() });
}
