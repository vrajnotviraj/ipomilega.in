import 'server-only';
import { unstable_cache } from 'next/cache';

/** Tag on every cached public read; a bare /api/revalidate purges it with every page. */
export const SITE_DATA_TAG = 'site-data';

/** What the engine changed, named in /api/revalidate?tag=. `ipos` covers the ipos and analysis collections, `blogs` the blogs and authors. */
export const DATA_TAGS = ['ipos', 'blogs', 'translations', 'shareholder-quota'] as const;
export type DataTag = (typeof DATA_TAGS)[number];

/** Caches a public Mongo read, for a day unless `seconds` says otherwise. `tags` name every collection the read touches, nested cached reads included, so a purge of any of them refreshes it and the pages that used it. Results must be JSON-serialisable. */
export const cached = <A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string, tags: DataTag[], seconds = 86400) =>
  unstable_cache(fn, [key], { revalidate: seconds, tags: [SITE_DATA_TAG, ...tags] });

/** For reads filtered by the clock (liveFilter): a scheduled post goes live with no write to purge the cache, so it shows within this long. Matches the pages' 30 minutes, since a page refreshes as often as its shortest read. */
export const CLOCK_TTL = 1800;
