import 'server-only';
import { unstable_cache } from 'next/cache';

/** Tag on every cached read; /api/revalidate purges it after each engine write. */
export const SITE_DATA_TAG = 'site-data';

/** Caches a Mongo read for a day, or `seconds`. Results must be JSON-serialisable. */
export const cached = <A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string, seconds = 86400) =>
  unstable_cache(fn, [key], { revalidate: seconds, tags: [SITE_DATA_TAG] });

/** Cache time for reads that depend on the clock, such as scheduled posts going live. */
export const CLOCK_TTL = 300;
