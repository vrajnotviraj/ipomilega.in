import 'server-only';
import { unstable_cache } from 'next/cache';

/** Tag on every cached public read; revalidateSite() purges it after each write. */
export const SITE_DATA_TAG = 'site-data';

/**
 * Holds a public Mongo read in Next's server cache for 5 minutes. The data changes every few
 * hours and every write path pings revalidateSite(), so the window is only a fallback for a
 * missed ping. Results must be JSON-serialisable -- every caller already returns plain objects.
 */
export const cached = <A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string) =>
  unstable_cache(fn, [key], { revalidate: 300, tags: [SITE_DATA_TAG] });
