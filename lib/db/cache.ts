import 'server-only';
import { unstable_cache } from 'next/cache';

/** Tag on every cached public read; /api/revalidate purges it after each engine write. */
export const SITE_DATA_TAG = 'site-data';

/** Caches a public Mongo read, for a day unless `seconds` says otherwise. Every engine job and admin save purges it, so the TTL is only a fallback. Results must be JSON-serialisable. */
export const cached = <A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string, seconds = 86400) =>
  unstable_cache(fn, [key], { revalidate: seconds, tags: [SITE_DATA_TAG] });

/** For reads filtered by the clock (liveFilter): a scheduled post goes live with no write to purge the cache. */
export const CLOCK_TTL = 300;
