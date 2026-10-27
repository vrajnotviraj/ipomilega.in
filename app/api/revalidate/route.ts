import { createHash, timingSafeEqual } from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import { after, NextRequest, NextResponse } from 'next/server';
import { DATA_TAGS, type DataTag, SITE_DATA_TAG } from '@/lib/db/cache';
import { LOCALES, localePath } from '@/lib/i18n/locales';
import { SITE_URL } from '@/lib/seo/share';

export const dynamic = 'force-dynamic';

// Home and /ipos in every language, re-rendered after each purge.
const WARM_PATHS = LOCALES.flatMap((lang) => ['/', '/ipos'].map((path) => localePath(lang, path)));

const digest = (value: string) => createHash('sha256').update(value).digest();

const isDataTag = (tag: string): tag is DataTag => (DATA_TAGS as readonly string[]).includes(tag);

/** True when the request carries `Authorization: Bearer <secret>`. */
function isAuthorized(req: NextRequest, secret: string) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  return timingSafeEqual(digest(token), digest(secret));
}

/** Purges the pages that read the tagged data, or every page when no tag is given. */
function purge(tags: DataTag[]) {
  try {
    if (tags.length) {
      tags.forEach((tag) => revalidateTag(tag));
      return;
    }
    // From the root layout down, so dynamic pages such as /analysis/[id] go too.
    revalidatePath('/', 'layout');
    revalidateTag(SITE_DATA_TAG);
  } catch (error) {
    console.warn('Revalidation error:', error);
  }
}

/** The engine calls this after it writes: `POST /api/revalidate?tag=ipos&tag=translations`, or no tag to purge everything. */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ success: false, message: 'REVALIDATE_SECRET not configured' }, { status: 500 });
  }
  if (!isAuthorized(req, secret)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const tags = req.nextUrl.searchParams.getAll('tag');
  const unknown = tags.filter((tag) => !isDataTag(tag));
  if (unknown.length) {
    return NextResponse.json({ success: false, message: `Unknown tag: ${unknown.join(', ')}. Known: ${DATA_TAGS.join(', ')}` }, { status: 400 });
  }

  purge(tags as DataTag[]);
  after(() => Promise.allSettled(WARM_PATHS.map((path) => fetch(`${SITE_URL}${path}`, { cache: 'no-store' }))));
  return NextResponse.json({ success: true, revalidated: true, tags: tags.length ? tags : 'all', at: new Date().toISOString() });
}
