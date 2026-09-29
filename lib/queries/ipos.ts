import 'server-only';
import { cache } from 'react';
import { cached } from '@/lib/cache';
import { getDb } from '@/lib/mongo';
import { Ipo } from '@/types/ipo';
import { IpoComprehensiveAnalysis } from '@/types/ipo-comprehensive-analysis';
import { HomePageIpoProps } from '@/types/homepage';
import { stripCitations } from '@/lib/citations';
import { parseIpoDate, getOpenDateString, getCloseDateString, getListingDateString } from '@/lib/queries/ipo-dates';

// Card and list views never read these fields; `tables_raw` alone is most of each document.
const IPO_CARD_PROJECTION = {
  tables_raw: 0,
  about: 0,
  ipo_valuation: 0,
  promoters: 0,
  rhp_url: 0,
  financial_report: 0,
} as const;

const IPO_FULL_PROJECTION = { tables_raw: 0 } as const;

// Cards show only risk_meter.score from the analysis document.
const ANALYSIS_CARD_PROJECTION = {
  ipo_table_id: 1,
  slug: 1,
  company_name: 1,
  'risk_meter.score': 1,
} as const;

type RawIpo = Ipo & { _id: { toString(): string } };

/** Mongo ObjectIds and Dates aren't serialisable across the RSC boundary. */
function toPlain<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}

/**
 * Midnight of today's Indian calendar date, in server-local time.
 * The server runs in UTC, and parseIpoDate builds dates at server-local midnight, so both sides must match.
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
      if (!isNaN(scrapedDate.getTime()) && scrapedDate >= twoDaysAgo) recentlyAdded.push(ipo);
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

  const byDateAsc = (dateString: (ipo: RawIpo) => string) => (a: RawIpo, b: RawIpo) => {
    const da = parseIpoDate(dateString(a), currentYear);
    const db = parseIpoDate(dateString(b), currentYear);
    return !da || !db ? 0 : da.getTime() - db.getTime();
  };
  const byCloseAsc = byDateAsc(getCloseDateString);
  const scrapedTime = (ipo: RawIpo) => (ipo.scraped_at ? new Date(ipo.scraped_at).getTime() : 0);

  upcoming.sort(byDateAsc(getOpenDateString));
  live.sort(byCloseAsc);
  past.sort((a, b) => -byCloseAsc(a, b));
  tba.sort((a, b) => (a.upcoming_ipo_2025 || '').localeCompare(b.upcoming_ipo_2025 || ''));
  recentlyAdded.sort((a, b) => scrapedTime(b) - scrapedTime(a));

  // A recorded listing price counts too, for rows whose listing date is missing.
  const isListed = (ipo: RawIpo) => {
    if (ipo.listing_price) return true;
    const listingDate = parseIpoDate(getListingDateString(ipo), currentYear);
    return listingDate !== null && listingDate <= today;
  };

  return {
    upcoming,
    live,
    past: past.filter(isListed),
    closed: past.filter((ipo) => !isListed(ipo)),
    tba,
    recentlyAdded,
  };
}

/** Reads IPOs and analyses in parallel; `full` returns complete records for admin. */
async function readIpoDocs(full: boolean) {
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
  return toPlain({ ipos, analyses });
}

// Only raw documents are cached: bucketing depends on today's date.
const readCardIpoDocs = cached(() => readIpoDocs(false), 'ipo-card-docs');

async function loadIpoBuckets(full: boolean) {
  const { ipos, analyses } = full ? await readIpoDocs(true) : await readCardIpoDocs();

  const analysisByIpoId = new Map<string, IpoComprehensiveAnalysis>();
  for (const analysis of analyses as unknown as IpoComprehensiveAnalysis[]) {
    if (analysis.ipo_table_id) analysisByIpoId.set(analysis.ipo_table_id, analysis);
  }

  const buckets = bucketIpos(ipos as unknown as RawIpo[]);

  const decorate = (list: RawIpo[]): HomePageIpoProps[] =>
    list.map((ipo) => {
      const id = ipo._id.toString();
      return toPlain({ _id: id, ipo, analysis: analysisByIpoId.get(id) ?? null }) as HomePageIpoProps;
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
 * Buckets for public pages, with card-sized documents. Under the card projection `analysis`
 * holds only ANALYSIS_CARD_PROJECTION fields; public consumers read just risk_meter.score.
 */
export const getIpoBuckets = cache(() => loadIpoBuckets(false));

/** Buckets for the admin console: complete IPO and analysis documents. */
export const getIpoBucketsFull = cache(() => loadIpoBuckets(true));

type AnalysisPage = { ipos_analysis: IpoComprehensiveAnalysis; ipo: Ipo };

/** Analysis + its parent IPO for /analysis/[slug]. */
export const getAnalysisBySlug = cache(cached(
  async (slug: string): Promise<AnalysisPage | null> => {
    const db = await getDb();

    const ipo = await db.collection('ipos').findOne({ slug });
    if (!ipo) return null;

    const analysis = await db
      .collection('ipo_comprehensive_analysis')
      .findOne({ ipo_table_id: ipo._id.toString() });
    if (!analysis) return null;

    return toPlain({
      ipos_analysis: stripCitations(toPlain(analysis)),
      ipo,
    }) as unknown as AnalysisPage;
  },
  'analysis-by-slug'
));

type AnalysisSlug = { slug: string; updated_at?: string };

/** Every analysis slug with its last edit, for prerendering and the sitemap. */
export const getAnalysisSlugs = cache(cached(async (): Promise<AnalysisSlug[]> => {
  const db = await getDb();
  const docs = await db
    .collection('ipo_comprehensive_analysis')
    .find({ slug: { $nin: [null, ''] } }, { projection: { _id: 0, slug: 1, updated_at: 1 } })
    .toArray();
  return toPlain(docs) as unknown as AnalysisSlug[];
}, 'analysis-slugs'));
