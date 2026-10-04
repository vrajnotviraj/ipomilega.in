import 'server-only';
import { cached } from '@/lib/db/cache';
import { getDb } from '@/lib/db/mongo';

/** How far an IPO has got, strongest first: dates set (RHP filed), SEBI approved, DRHP filed, announced. */
export const QUOTA_STAGES = ['dates', 'approved', 'filed', 'announced'] as const;
export type QuotaStage = (typeof QUOTA_STAGES)[number];

/** An upcoming IPO with a shareholder quota, and the listed parent whose shareholders can apply in it. Dates are "YYYY-MM-DD". */
export interface QuotaIpo {
  id: string;
  name: string;
  stage: QuotaStage;
  parents: string[];
  drhpDate: string | null;
  openDate: string | null;
  closeDate: string | null;
  priceBand: string;
  sourceUrl: string;
  slug: string;
}

export interface QuotaList {
  ipos: QuotaIpo[];
  checkedAt: string | null;
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
  url: string;
  ipo_slug: string;
  checked_at: Date;
};

const dayOf = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : null);

/**
 * The IPOs on the shareholder-quota list (the engine's daily shareholderQuota job), strongest stage first, then by the
 * nearest open date or the latest DRHP news. checkedAt is the job's latest read.
 */
export const getShareholderQuotaIpos = cached(async (): Promise<QuotaList> => {
  const db = await getDb();
  const docs = await db.collection<QuotaDoc>('shareholder_quota').find({ active: true }).toArray();
  const rank = (doc: QuotaDoc) => QUOTA_STAGES.indexOf(doc.stage);
  docs.sort((a, b) =>
    rank(a) - rank(b) ||
    (a.open_date?.getTime() ?? Infinity) - (b.open_date?.getTime() ?? Infinity) ||
    (b.drhp_date?.getTime() ?? 0) - (a.drhp_date?.getTime() ?? 0)
  );
  const checked = docs.reduce<Date | null>((latest, doc) => (!latest || doc.checked_at > latest ? doc.checked_at : latest), null);
  return {
    checkedAt: checked?.toISOString() ?? null,
    ipos: docs.map((doc) => ({
      id: String(doc._id),
      name: doc.name,
      stage: doc.stage,
      parents: doc.parents,
      drhpDate: dayOf(doc.drhp_date),
      openDate: dayOf(doc.open_date),
      closeDate: dayOf(doc.close_date),
      priceBand: doc.price_band,
      // The offer document when there is one, else the page the job read.
      sourceUrl: doc.drhp_url || doc.url,
      slug: doc.ipo_slug,
    })),
  };
}, 'shareholder-quota');
