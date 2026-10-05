import 'server-only';
import { cache } from 'react';
import { ObjectId } from 'mongodb';
import { cached } from '@/lib/db/cache';
import { getDb, toPlain } from '@/lib/db/mongo';
import { Ipo, IpoIssue } from '@/types/ipo';
import { IpoComprehensiveAnalysis } from '@/types/ipo-comprehensive-analysis';
import { HomePageIpoProps } from '@/types/ipo-with-analysis';
import { stripCitations } from '@/lib/queries/citations';
import { daysFromToday, formatIssueSize, getIpoType, parseIpoDate } from '@/lib/ipo-format';

// The IPO fields the site may read: an allowlist, so where the engine scraped each fact from (raw captures, source
// names, source links, scrape times) never leaves the database, and a field the engine adds stays private until listed here.
const PUBLIC_IPO_FIELDS = [
  'upcoming_ipo_2025', 'slug', 'open_date', 'closing_date', 'ipo_type', 'ipo_size', 'price_band', 'image_url',
  'about', 'promoters', 'financial_report', 'ipo_dates', 'ipo_market_lot', 'ipo_name', 'ipo_price',
  'ipo_details.ipo_open_date', 'ipo_details.ipo_close_date', 'ipo_details.face_value', 'ipo_details.ipo_price_band',
  'ipo_details.issue_size', 'ipo_details.issue_type', 'ipo_details.ipo_listing', 'ipo_details.fresh_issue',
  'ipo_details.offer_for_sale', 'ipo_details.lot_size',
  'listing_price', 'listing_gain', 'last_price',
  'total_sr', 'qib_sr', 'nii_sr', 'snii_sr', 'bnii_sr', 'rii_sr', 'subscription_date_range', 'subscription_status',
  'subscription_captured_at', 'subscription_is_provisional', 'retail_allotment_probability',
  'gmp_current_ipos', 'gmp_price_gain', 'gmp_ipo_gmp', 'gmp_est_listing', 'gmp_trend', 'gmp_price_band', 'gmp_status',
  'gmp_date', 'gmp_subject', 'gmp_type', 'gmp_updated_at',
  'issue', 'ipo_valuation',
] as const;
// Card and list views skip the long-form fields; the analysis page and the API get them all.
const CARD_SKIPS: readonly string[] = ['about', 'promoters', 'financial_report', 'issue', 'ipo_valuation'];
const projectionOf = (fields: readonly string[]) => Object.fromEntries(fields.map((field) => [field, 1]));
export const PUBLIC_IPO_PROJECTION = projectionOf(PUBLIC_IPO_FIELDS);
const IPO_CARD_PROJECTION = projectionOf(PUBLIC_IPO_FIELDS.filter((field) => !CARD_SKIPS.includes(field)));

/** The engine's `issue` block as plain values: each fact's source and capture time are dropped. */
export const publicIssue = (issue: Record<string, { value?: unknown } | undefined> | undefined): IpoIssue =>
  Object.fromEntries(Object.entries(issue ?? {}).map(([key, fact]) => [key, fact?.value])) as IpoIssue;

// Cards show the overall score (scoreOf), so they need each section's score from the analysis document.
const ANALYSIS_CARD_PROJECTION = {
  ipo_table_id: 1,
  slug: 1,
  company_name: 1,
  'fundamentals.score': 1,
  'risk_meter.score': 1,
  'performance.score': 1,
  'flexibility.score': 1,
  'time.score': 1,
} as const;

type RawIpo = Ipo & { _id: { toString(): string } };

const openDateOf = (ipo: RawIpo) => ipo.ipo_dates?.ipo_open_date || ipo.open_date || '';
const closeDateOf = (ipo: RawIpo) => ipo.ipo_dates?.ipo_close_date || ipo.closing_date || '';
const timeOf = (date: string) => parseIpoDate(date)?.getTime() ?? 0;

// A recorded listing price counts too, for rows whose listing date is missing.
const isListed = (ipo: RawIpo) => {
  if (ipo.listing_price) return true;
  const toListing = daysFromToday(ipo.ipo_dates?.ipo_listing_date);
  return toListing !== null && toListing <= 0;
};

/** Splits IPOs into upcoming, live, closed (not listed yet) and past (listed), each sorted. IPOs without both dates are left out. */
function bucketIpos(ipoList: RawIpo[]) {
  const upcoming: RawIpo[] = [];
  const live: RawIpo[] = [];
  const past: RawIpo[] = [];

  for (const ipo of ipoList) {
    const toOpen = daysFromToday(openDateOf(ipo));
    const toClose = daysFromToday(closeDateOf(ipo));
    if (toOpen === null || toClose === null) continue;

    if (toOpen > 0) upcoming.push(ipo);
    else if (toClose >= 0) live.push(ipo);
    else past.push(ipo);
  }

  upcoming.sort((a, b) => timeOf(openDateOf(a)) - timeOf(openDateOf(b))); // opening soonest first
  live.sort((a, b) => timeOf(closeDateOf(a)) - timeOf(closeDateOf(b))); // closing soonest first
  past.sort((a, b) => timeOf(closeDateOf(b)) - timeOf(closeDateOf(a))); // most recently closed first

  const listed = past.filter(isListed);
  return {
    upcoming,
    live,
    past: listed,
    closed: past.filter((ipo) => !isListed(ipo)),
  };
}

/** Raw card documents. Only these are cached, since bucketing depends on today's date. */
const readCardIpoDocs = cached(async () => {
  const db = await getDb();
  const [ipos, analyses] = await Promise.all([
    db.collection('ipos').find({}, { projection: IPO_CARD_PROJECTION }).toArray(),
    db.collection('ipo_comprehensive_analysis').find({}, { projection: ANALYSIS_CARD_PROJECTION }).toArray(),
  ]);
  return toPlain({ ipos, analyses });
}, 'ipo-card-docs');

/** Buckets the card documents and attaches each IPO's analysis. */
async function loadIpoBuckets() {
  const { ipos, analyses } = await readCardIpoDocs();

  const analysisByIpoId = new Map<string, IpoComprehensiveAnalysis>();
  for (const analysis of analyses as unknown as IpoComprehensiveAnalysis[]) {
    if (analysis.ipo_table_id) analysisByIpoId.set(analysis.ipo_table_id, analysis);
  }

  const buckets = bucketIpos(ipos as unknown as RawIpo[]);

  const decorate = (list: RawIpo[]): HomePageIpoProps[] =>
    list.map((ipo) => {
      const id = ipo._id.toString();
      return { _id: id, ipo, analysis: analysisByIpoId.get(id) ?? null } as HomePageIpoProps;
    });

  return {
    upcoming: decorate(buckets.upcoming),
    live: decorate(buckets.live),
    closed: decorate(buckets.closed),
    past: decorate(buckets.past),
  };
}

/** IPO buckets for public pages. `analysis` holds only ANALYSIS_CARD_PROJECTION fields; consumers read just the section scores, via scoreOf. */
export const getIpoBuckets = cache(loadIpoBuckets);

type AnalysisPage = { ipos_analysis: IpoComprehensiveAnalysis; ipo: Ipo };

/** Analysis + its parent IPO for /analysis/[slug]. */
export const getAnalysisBySlug = cache(cached(
  async (slug: string): Promise<AnalysisPage | null> => {
    const db = await getDb();

    const ipo = await db.collection('ipos').findOne({ slug }, { projection: PUBLIC_IPO_PROJECTION });
    if (!ipo) return null;
    ipo.issue = publicIssue(ipo.issue);

    const analysis = await db
      .collection('ipo_comprehensive_analysis')
      .findOne({ ipo_table_id: ipo._id.toString() });
    if (!analysis) return null;

    const plain = toPlain({ analysis, ipo });
    return { ipos_analysis: stripCitations(plain.analysis), ipo: plain.ipo } as unknown as AnalysisPage;
  },
  'analysis-by-slug'
));

/** The IPO's name for a slug, or null when no IPO has it. Tells "analysis pending" apart from "no such IPO". */
export const getIpoNameBySlug = cache(cached(async (slug: string): Promise<string | null> => {
  const db = await getDb();
  const ipo = await db.collection('ipos').findOne({ slug }, { projection: { upcoming_ipo_2025: 1 } });
  return ipo ? ipo.upcoming_ipo_2025 || '' : null;
}, 'ipo-name-by-slug'));

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

/** An IPO's name, its entity-page slug (null until the IPO has an analysis page) and the facts its summary card shows. */
export type IpoLink = { name: string; slug: string | null; logo: string | null; board: string | null; issueSize: string | null };

export const getIpoLink = cache(cached(async (ipoId: string): Promise<IpoLink | null> => {
  const db = await getDb();
  const [analysis, ipo] = await Promise.all([
    db.collection('ipo_comprehensive_analysis').findOne({ ipo_table_id: ipoId }, { projection: { company_name: 1, slug: 1 } }),
    ObjectId.isValid(ipoId)
      ? db.collection('ipos').findOne(
          { _id: new ObjectId(ipoId) },
          { projection: { upcoming_ipo_2025: 1, slug: 1, image_url: 1, ipo_type: 1, subscription_date_range: 1, 'ipo_details.ipo_listing': 1, 'ipo_details.issue_size': 1 } }
        )
      : null,
  ]);
  const name = (analysis?.slug && analysis.company_name) || ipo?.upcoming_ipo_2025;
  if (!name) return null;
  // Only an IPO with an analysis has an entity page. One whose slug has not been synced yet still lives at the IPO's own slug.
  const slug = analysis ? ((analysis.slug as string) || ipo?.slug || null) : null;
  return {
    name: name as string,
    slug,
    logo: ipo?.image_url || null,
    board: ipo ? getIpoType(ipo as unknown as Ipo) : null,
    issueSize: formatIssueSize(ipo?.ipo_details?.issue_size),
  };
}, 'ipo-link'));
