import 'server-only';
import { cache } from 'react';
import { getDb } from '@/lib/mongo';
import { Ipo } from '@/app/models/ipo';
import { IpoComprehensiveAnalysis } from '@/app/models/ipo_comprehensive_analysis';
import { HomePageIpoProps } from '@/app/types/homepage';
import { parseIpoDate, getOpenDateString, getCloseDateString } from './ipo-dates';

// Public card/list views (homepage, /ipos) read a small slice of each document, but the whole
// thing was being embedded in the RSC payload. Measured across the live collection:
//
//   ipos      368.4KB full -> 194.0KB without tables_raw -> 118.2KB with this projection
//   analysis  173.1KB full -> 23.3KB with ANALYSIS_CARD_PROJECTION
//   combined  367.1KB -> 141.6KB  (-61%)
//
// Every field excluded here has zero references in components/Home, components/charts,
// components/AllotmentPredictor and app/ipos. `tables_raw` alone is 173.7KB -- a dump of
// scraped HTML tables that nothing in the app reads at all.
const IPO_CARD_PROJECTION = {
  tables_raw: 0,
  about: 0,
  ipo_valuation: 0,
  promoters: 0,
  rhp_url: 0,
  financial_report: 0,
} as const;

// Admin renders the full record, so it only sheds the field nothing reads anywhere.
const IPO_FULL_PROJECTION = { tables_raw: 0 } as const;

// Cards render exactly one number off the analysis document: risk_meter.score. Pulling the
// whole 10KB/doc analysis to show it was the single largest avoidable cost on the homepage.
const ANALYSIS_CARD_PROJECTION = {
  ipo_table_id: 1,
  slug: 1,
  company_name: 1,
  'risk_meter.score': 1,
} as const;

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

/**
 * Midnight of today's *Indian* calendar date, in server-local time.
 *
 * `new Date().setHours(0,0,0,0)` uses the server's timezone. Hosted in UTC, that put the day
 * boundary at 05:30 IST, so from midnight until 05:30 every morning an IPO opening today was
 * still "upcoming" and one that closed yesterday was still "live". parseIpoDate builds its
 * dates at server-local midnight too, so comparing against this keeps both sides aligned.
 */
function todayInIndia(): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return new Date(get('year'), get('month') - 1, get('day'));
}

function bucketIpos(ipoList: RawIpo[]) {
  const today = todayInIndia();
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
 *
 * `full` controls how much of each document comes back. Public pages take the card
 * projection; the admin console needs the complete records.
 */
async function loadIpoBuckets(full: boolean): Promise<IpoBuckets> {
  const db = await getDb();

  const [ipos, analyses] = await Promise.all([
    db
      .collection('ipos')
      .find({}, { projection: full ? IPO_FULL_PROJECTION : IPO_CARD_PROJECTION })
      .toArray(),
    db
      .collection('ipo_comprehensive_analysis')
      .find({}, full ? {} : { projection: ANALYSIS_CARD_PROJECTION })
      .toArray(),
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
 * Buckets for public pages: card-sized documents only.
 *
 * React `cache` dedupes this within a single render pass, so a page and its
 * `generateMetadata` share one database read instead of issuing two. The two variants keep
 * separate cache entries, which is what we want -- a public page must never be served the
 * admin-sized payload just because admin warmed the cache first.
 *
 * Note on typing: under the card projection the `analysis` objects carry only the fields in
 * ANALYSIS_CARD_PROJECTION. Every public consumer reads it as `analysis?.risk_meter?.score`,
 * so the absent fields are unobservable; `HomePageIpoProps` keeps the full type because admin
 * shares it and does get complete documents.
 */
export const getIpoBuckets = cache(() => loadIpoBuckets(false));

/** Buckets for the admin console: complete IPO and analysis documents. */
export const getIpoBucketsFull = cache(() => loadIpoBuckets(true));

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
