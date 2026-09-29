import 'server-only';
import { revalidatePath, revalidateTag } from 'next/cache';
import { SITE_DATA_TAG } from '@/lib/cache';

/** Drops every ISR page and cached read so the next request renders fresh from Mongo. */
export function revalidateSite() {
  try {
    // The root layout, not per-path calls: revalidatePath('/analysis') misses the dynamic /analysis/[slug] pages.
    revalidatePath('/', 'layout');
    revalidateTag(SITE_DATA_TAG);
  } catch (error) {
    console.warn('Revalidation error:', error);
  }
}
