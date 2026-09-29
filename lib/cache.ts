import 'server-only';
import { unstable_cache } from 'next/cache';

/** Tag on every cached public read; revalidateSite() purges it after each write. */
export const SITE_DATA_TAG = 'site-data';

/** Caches a public Mongo read for 5 minutes. Results must be JSON-serialisable. */
export const cached = <A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string) =>
  unstable_cache(fn, [key], { revalidate: 300, tags: [SITE_DATA_TAG] });
