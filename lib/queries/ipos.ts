import 'server-only';
import { cache } from 'react';
import { cached } from '@/lib/db/cache';
import { getDb, toPlain } from '@/lib/db/mongo';
import { Ipo } from '@/types/ipo';
import { IpoComprehensiveAnalysis } from '@/types/ipo-comprehensive-analysis';
import { HomePageIpoProps } from '@/types/homepage';
import { stripCitations } from '@/lib/queries/citations';
import { daysFromToday, parseIpoDate } from '@/lib/ipo-format';

// Card and list views never read these fields; `tables_raw` alone is most of each document.
const IPO_CARD_PROJECTION = {
  tables_raw: 0,
  about: 0,
  ipo_valuation: 0,
  promoters: 0,
  rhp_url: 0,
  financial_report: 0,
} as const;

// Cards show only risk_meter.score from the analysis document.
const ANALYSIS_CARD_PROJECTION = {
  ipo_table_id: 1,
  slug: 1,
  company_name: 1,
  'risk_meter.score': 1,
} as const;

type RawIpo = Ipo & { _id: { toString(): string } };

const openDateOf = (ipo: RawIpo) => ipo.ipo_dates?.ipo_open_date || ipo.open_date || '';
const closeDateOf = (ipo: RawIpo) => ipo.ipo_dates?.ipo_close_date || ipo.closing_date || '';

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

  const byDate = (dateOf: (ipo: RawIpo) => string) => (a: RawIpo, b: RawIpo) =>
    (parseIpoDate(dateOf(a))?.getTime() ?? 0) - (parseIpoDate(dateOf(b))?.getTime() ?? 0);

  upcoming.sort(byDate(openDateOf));
  live.sort(byDate(closeDateOf));
  past.sort((a, b) => byDate(closeDateOf)(b, a));

  // A recorded listing price counts too, for rows whose listing date is missing.
  const isListed = (ipo: RawIpo) => {
    if (ipo.listing_price) return true;
    const toListing = daysFromToday(ipo.ipo_dates?.ipo_listing_date);
    return toListing !== null && toListing <= 0;
  };

  return {
    upcoming,
    live,
    past: past.filter(isListed),
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

/** IPO buckets for public pages. `analysis` holds only ANALYSIS_CARD_PROJECTION fields; consumers read just risk_meter.score. */
export const getIpoBuckets = cache(loadIpoBuckets);

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

    const plain = toPlain({ analysis, ipo });
    return { ipos_analysis: stripCitations(plain.analysis), ipo: plain.ipo } as unknown as AnalysisPage;
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
