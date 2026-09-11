import 'server-only';
import { cache } from 'react';
import { getDb } from '@/lib/mongo';
import { Ipo } from '@/app/models/ipo';
import { IpoComprehensiveAnalysis } from '@/app/models/ipo_comprehensive_analysis';
import { HomePageIpoProps } from '@/app/types/homepage';
import { parseIpoDate, getOpenDateString, getCloseDateString } from './ipo-dates';

// `tables_raw` is a ~3.4KB/doc dump of scraped HTML tables that nothing in the UI reads --
// across 51 IPOs it was roughly half the bytes of every list response. Projecting it away at
// the driver keeps it out of the wire, out of the RSC payload, and out of the cache entry.
const IPO_LIST_PROJECTION = { tables_raw: 0 } as const;

export type IpoBuckets = {
  upcoming: HomePageIpoProps[];
  live: HomePageIpoProps[];
  closed: HomePageIpoProps[];
  past: HomePageIpoProps[];
  tba: HomePageIpoProps[];
  recently_added: HomePageIpoProps[];
};

type RawIpo = Ipo & { _id: { toString(): string } };

/** Mongo ObjectIds and Dates aren't serialisable across the RSC boundary. */
function toPlain<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}

function bucketIpos(ipoList: RawIpo[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);
  const currentYear = today.getFullYear();

  const upcoming: RawIpo[] = [];
  const live: RawIpo[] = [];
  const past: RawIpo[] = [];
  const tba: RawIpo[] = [];
  const recentlyAdded: RawIpo[] = [];

  for (const ipo of ipoList) {
    if (ipo.scraped_at) {
      const scrapedDate = new Date(ipo.scraped_at);
      if (!isNaN(scrapedDate.getTime()) && scrapedDate >= twoDaysAgo) {
        recentlyAdded.push(ipo);
      }
    }

    const openDate = parseIpoDate(getOpenDateString(ipo), currentYear);
    const closeDate = parseIpoDate(getCloseDateString(ipo), currentYear);

    if (!openDate || !closeDate) {
      tba.push(ipo);
      continue;
    }

    openDate.setHours(0, 0, 0, 0);
    closeDate.setHours(23, 59, 59, 999);

    if (openDate > today) upcoming.push(ipo);
    else if (closeDate >= today) live.push(ipo);
    else past.push(ipo);
  }

  const byOpenAsc = (a: RawIpo, b: RawIpo) => {
    const da = parseIpoDate(getOpenDateString(a), currentYear);
    const db = parseIpoDate(getOpenDateString(b), currentYear);
    return !da || !db ? 0 : da.getTime() - db.getTime();
  };
  const byCloseAsc = (a: RawIpo, b: RawIpo) => {
    const da = parseIpoDate(getCloseDateString(a), currentYear);
    const db = parseIpoDate(getCloseDateString(b), currentYear);
    return !da || !db ? 0 : da.getTime() - db.getTime();
  };

  upcoming.sort(byOpenAsc);
  live.sort(byCloseAsc);
  past.sort((a, b) => -byCloseAsc(a, b));
  tba.sort((a, b) => (a.upcoming_ipo_2025 || '').localeCompare(b.upcoming_ipo_2025 || ''));
  recentlyAdded.sort(
    (a, b) =>
      (b.scraped_at ? new Date(b.scraped_at).getTime() : 0) -
      (a.scraped_at ? new Date(a.scraped_at).getTime() : 0)
  );

  return {
    upcoming,
    live,
    // Listed: bidding over and a listing price recorded.
    past: past.filter((ipo) => ipo.listing_price),
    // Closed: bidding over but not yet listed -- when users check allotment odds.
    closed: past.filter((ipo) => !ipo.listing_price),
    tba,
    recentlyAdded,
  };
}

/**
 * Loads IPOs + their analyses and joins them.
 *
 * The two collections are read in parallel (they were sequential, costing ~230ms of
 * round-trips back to back) and joined through a Map. The previous `analysisList.find(...)`
 * inside a per-IPO loop was an O(ipos x analyses) linear scan repeated once per bucket.
 */
async function loadIpoBuckets(): Promise<IpoBuckets> {
  const db = await getDb();

  const [ipos, analyses] = await Promise.all([
    db.collection('ipos').find({}, { projection: IPO_LIST_PROJECTION }).toArray(),
    db.collection('ipo_comprehensive_analysis').find({}).toArray(),
  ]);

  const analysisByIpoId = new Map<string, IpoComprehensiveAnalysis>();
  for (const analysis of analyses) {
    const typed = analysis as unknown as IpoComprehensiveAnalysis;
    if (typed.ipo_table_id) analysisByIpoId.set(typed.ipo_table_id, typed);
  }

  const buckets = bucketIpos(ipos as unknown as RawIpo[]);

  const decorate = (list: RawIpo[]): HomePageIpoProps[] =>
    list.map((ipo) => {
      const id = ipo._id.toString();
      return toPlain({
        _id: id,
        ipo,
        analysis: analysisByIpoId.get(id) ?? null,
      }) as HomePageIpoProps;
    });

  return {
    upcoming: decorate(buckets.upcoming),
    live: decorate(buckets.live),
    closed: decorate(buckets.closed),
    past: decorate(buckets.past),
    tba: decorate(buckets.tba),
    recently_added: decorate(buckets.recentlyAdded),
  };
}

/**
 * React `cache` dedupes this within a single render pass, so a page and its
 * `generateMetadata` share one database read instead of issuing two.
 */
export const getIpoBuckets = cache(loadIpoBuckets);

/** A single IPO by its slug -- an indexed lookup, not a full-collection scan. */
export const getIpoBySlug = cache(async (slug: string) => {
  const db = await getDb();
  const ipo = await db.collection('ipos').findOne({ slug });
  return ipo ? (toPlain(ipo) as unknown as Ipo) : null;
});

/** Analysis + its parent IPO for /analysis/[slug]. */
export const getAnalysisBySlug = cache(
  async (slug: string): Promise<{ ipos_analysis: IpoComprehensiveAnalysis; ipo: Ipo } | null> => {
    const db = await getDb();

    // The old route pulled every IPO document into memory and ran Array.find on it just to
    // resolve one slug, then queried the analysis collection -- two full scans per page view.
    const ipo = await db.collection('ipos').findOne({ slug });
    if (!ipo) return null;

    const analysis = await db
      .collection('ipo_comprehensive_analysis')
      .findOne({ ipo_table_id: ipo._id.toString() });
    if (!analysis) return null;

    return toPlain({
      ipos_analysis: analysis,
      ipo,
    }) as unknown as { ipos_analysis: IpoComprehensiveAnalysis; ipo: Ipo };
  }
);

/** Every analysis, for the /analysis index. */
export const getAllAnalyses = cache(async (): Promise<IpoComprehensiveAnalysis[]> => {
  const db = await getDb();
  const analyses = await db.collection('ipo_comprehensive_analysis').find({}).toArray();
  return toPlain(analyses) as unknown as IpoComprehensiveAnalysis[];
});
