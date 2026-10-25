import { createHash, timingSafeEqual } from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import { after, NextRequest, NextResponse } from 'next/server';
import { SITE_DATA_TAG } from '@/lib/db/cache';
import { LOCALES, localePath } from '@/lib/i18n/locales';
import { SITE_URL } from '@/lib/seo/share';

export const dynamic = 'force-dynamic';

// The busiest pages, re-rendered right after a purge so the first visitor doesn't get the stale copy.
const WARM_PATHS = LOCALES.flatMap((lang) => ['/', '/ipos'].map((path) => localePath(lang, path)));

const digest = (value: string) => createHash('sha256').update(value).digest();

/** Purges every ISR page and cached read, then re-renders the home and /ipos pages in every language. Called by the engine with `Authorization: Bearer <REVALIDATE_SECRET>`. */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ success: false, message: 'REVALIDATE_SECRET not configured' }, { status: 500 });
  }

  const header = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!timingSafeEqual(digest(header), digest(secret))) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Purges from the root layout down, which covers the dynamic /analysis/[slug] pages that revalidatePath('/analysis') misses.
    revalidatePath('/', 'layout');
    revalidateTag(SITE_DATA_TAG);
  } catch (error) {
    console.warn('Revalidation error:', error);
  }
  // The first request after a purge is served stale and triggers the re-render.
  after(() => Promise.allSettled(WARM_PATHS.map((path) => fetch(`${SITE_URL}${path}`, { cache: 'no-store' }))));
  return NextResponse.json({ success: true, revalidated: true, at: new Date().toISOString() });
}
