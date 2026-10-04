import 'server-only';
import { cached } from '@/lib/db/cache';
import { getDb } from '@/lib/db/mongo';

/** Strongest first: dates set (RHP filed), SEBI approved, DRHP filed, announced. */
export const QUOTA_STAGES = ['dates', 'approved', 'filed', 'announced'] as const;
export type QuotaStage = (typeof QUOTA_STAGES)[number];

/** An upcoming IPO with a shareholder quota and the listed parent to hold. Dates are "YYYY-MM-DD". */
export interface QuotaIpo {
  id: string;
  name: string;
  stage: QuotaStage;
  parents: string[];
  drhpDate: string | null;
  openDate: string | null;
  closeDate: string | null;
  priceBand: string;
  documentUrl: string;
  slug: string;
}

type QuotaDoc = {
  _id: number;
  name: string;
  stage: QuotaStage;
  parents: string[];
  drhp_date: Date | null;
  open_date: Date | null;
  close_date: Date | null;
  price_band: string;
  drhp_url: string;
  ipo_slug: string;
  checked_at: Date;
};

// Only these fields leave the database; where the engine read them stays private.
const PUBLIC_FIELDS = { name: 1, stage: 1, parents: 1, drhp_date: 1, open_date: 1, close_date: 1, price_band: 1, drhp_url: 1, ipo_slug: 1, checked_at: 1 };

const dayOf = (date: Date | null) => date?.toISOString().slice(0, 10) ?? null;
const time = (date: Date | null, missing: number) => date?.getTime() ?? missing;

/** The IPOs on the list: strongest stage first, then nearest open date, then latest DRHP news. */
export const getShareholderQuotaIpos = cached(async () => {
  const db = await getDb();
  const docs = await db.collection<QuotaDoc>('shareholder_quota').find({ active: true }, { projection: PUBLIC_FIELDS }).toArray();
  const rank = (doc: QuotaDoc) => QUOTA_STAGES.indexOf(doc.stage);
  docs.sort((a, b) =>
    rank(a) - rank(b) ||
    time(a.open_date, Infinity) - time(b.open_date, Infinity) ||
    time(b.drhp_date, 0) - time(a.drhp_date, 0)
  );

  const ipos: QuotaIpo[] = docs.map((doc) => ({
    id: String(doc._id),
    name: doc.name,
    stage: doc.stage,
    parents: doc.parents,
    drhpDate: dayOf(doc.drhp_date),
    openDate: dayOf(doc.open_date),
    closeDate: dayOf(doc.close_date),
    priceBand: doc.price_band,
    documentUrl: doc.drhp_url,
    slug: doc.ipo_slug,
  }));
  const checkedAt = docs.length ? new Date(Math.max(...docs.map((doc) => doc.checked_at.getTime()))).toISOString() : null;
  return { ipos, checkedAt };
}, 'shareholder-quota');
