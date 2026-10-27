import 'server-only';
import { unstable_cache } from 'next/cache';

/** Tag on every cached read. A purge with no tag clears it. */
export const SITE_DATA_TAG = 'site-data';

/** The data a purge can name in /api/revalidate?tag=. `ipos` covers IPOs and analyses; `blogs` covers blogs and authors. */
export const DATA_TAGS = ['ipos', 'blogs', 'translations', 'shareholder-quota'] as const;
export type DataTag = (typeof DATA_TAGS)[number];

/** Caches a Mongo read for a day, or `seconds`. `tags` lists all the data it reads, including nested cached reads. Results must be JSON-serialisable. */
export const cached = <A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string, tags: DataTag[], seconds = 86400) =>
  unstable_cache(fn, [key], { revalidate: seconds, tags: [SITE_DATA_TAG, ...tags] });

/** Cache time for reads that depend on the clock, such as scheduled posts going live. Same as the pages' 30 minutes. */
export const CLOCK_TTL = 1800;
