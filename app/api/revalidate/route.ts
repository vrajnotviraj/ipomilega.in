import { createHash, timingSafeEqual } from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import { after, NextRequest, NextResponse } from 'next/server';
import { DATA_TAGS, type DataTag, SITE_DATA_TAG } from '@/lib/db/cache';
import { LOCALES, localePath } from '@/lib/i18n/locales';
import { SITE_URL } from '@/lib/seo/share';

export const dynamic = 'force-dynamic';

// The busiest pages, re-rendered right after a purge so the first visitor doesn't get the stale copy.
const WARM_PATHS = LOCALES.flatMap((lang) => ['/', '/ipos'].map((path) => localePath(lang, path)));

const digest = (value: string) => createHash('sha256').update(value).digest();

const isDataTag = (tag: string): tag is DataTag => (DATA_TAGS as readonly string[]).includes(tag);

/**
 * Called by the engine with `Authorization: Bearer <REVALIDATE_SECRET>` after it writes.
 * `?tag=ipos&tag=translations` purges the reads with those tags and every page that used them; with no tag it purges every page and read.
 * Either way it then re-renders the home and /ipos pages in every language.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ success: false, message: 'REVALIDATE_SECRET not configured' }, { status: 500 });
  }

  const header = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!timingSafeEqual(digest(header), digest(secret))) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const tags = req.nextUrl.searchParams.getAll('tag');
  const unknown = tags.filter((tag) => !isDataTag(tag));
  if (unknown.length) {
    return NextResponse.json({ success: false, message: `Unknown tag: ${unknown.join(', ')}. Known: ${DATA_TAGS.join(', ')}` }, { status: 400 });
  }

  try {
    if (tags.length) {
      tags.forEach((tag) => revalidateTag(tag));
    } else {
      // Purges from the root layout down, which covers the dynamic /analysis/[slug] pages that revalidatePath('/analysis') misses.
      revalidatePath('/', 'layout');
      revalidateTag(SITE_DATA_TAG);
    }
  } catch (error) {
    console.warn('Revalidation error:', error);
  }
  // The first request after a purge is served stale and triggers the re-render.
  after(() => Promise.allSettled(WARM_PATHS.map((path) => fetch(`${SITE_URL}${path}`, { cache: 'no-store' }))));
  return NextResponse.json({ success: true, revalidated: true, tags: tags.length ? tags : 'all', at: new Date().toISOString() });
}
