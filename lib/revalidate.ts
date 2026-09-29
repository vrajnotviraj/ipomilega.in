import 'server-only';
import { revalidatePath, revalidateTag } from 'next/cache';
import { SITE_DATA_TAG } from '@/lib/cache';

/**
 * Drops every ISR page (home, /ipos, /analysis/[slug], blogs) so the next request renders
 * from Mongo instead of serving a copy from before the write.
 *
 * Revalidating the root layout is deliberate: the old per-path calls missed the dynamic
 * `/analysis/[slug]` pages entirely (revalidatePath('/analysis') only touches the index), so
 * an admin edit kept showing the previous analysis until the 5-minute window lapsed and then
 * one more visitor had eaten the stale copy.
 */
export function revalidateSite() {
  try {
    revalidatePath('/', 'layout');
    revalidateTag(SITE_DATA_TAG);
  } catch (error) {
    console.warn('Revalidation error:', error);
  }
}
