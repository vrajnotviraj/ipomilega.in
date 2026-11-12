import { addWorkingDays, dayOf } from '@/lib/ipo/planner/days';
import { dayNumberInIndia, daysFromToday, isPastFivePmIst, isPastLastBuyIst } from '@/lib/ipo/format';

/** Strongest first: dates set (RHP filed), SEBI approved, DRHP filed, announced (a rumour). */
export const QUOTA_STAGES = ['dates', 'approved', 'filed', 'announced'] as const;
export type QuotaStage = (typeof QUOTA_STAGES)[number];

/** The parent's last close, "YYYY-MM-DD". */
export type ParentQuote = { name: string; price: number; asOf: string };

/** An upcoming IPO with a shareholder quota and the listed parent to hold. Dates are "YYYY-MM-DD". */
export interface QuotaIpo {
  id: string;
  name: string;
  stage: QuotaStage;
  source: 'chittorgarh' | 'nse' | 'bse' | 'watchlist' | 'admin';
  parents: string[];
  parentQuotes: ParentQuote[];
  drhpDate: string | null;
  openDate: string | null;
  closeDate: string | null;
  /** Last day to buy the parent and still hold it on the record date. */
  lastBuyDate: string | null;
  listingDate: string | null;
  priceBand: string;
  documentUrl: string;
  slug: string;
  issueSizeCr: number | null;
  quotaSizeCr: number | null;
  quotaPercent: number | null;
  /** The admin's note on the card. */
  note: string | null;
  /** Rumours: when the board announced it (BSE) or the admin added it. */
  announcedOn: string | null;
  /** BSE rumours: the announcement PDF. */
  announcementUrl: string | null;
}

/** A Buy before card: the countdown to the last day to buy, and whether 3:30 PM IST on it has passed. */
export type BuyBeforeIpo = QuotaIpo & { daysToLastBuy: number | null; lastBuyClosed: boolean };

type Overrides = Partial<Pick<QuotaDoc, 'name' | 'parents' | 'drhp_url' | 'stage' | 'open_date' | 'close_date' | 'last_buy_date'>> & { note?: string };

export type QuotaDoc = {
  _id: number | string;
  name: string;
  stage: QuotaStage | null;
  source?: QuotaIpo['source'];
  parents: string[];
  parent_quotes?: { name: string; price: number; as_of: Date }[];
  drhp_date: Date | null;
  open_date: Date | null;
  close_date: Date | null;
  last_buy_date?: Date | null;
  listing_date?: Date | null;
  price_band: string;
  drhp_url: string;
  ipo_slug: string;
  issue_size_cr?: number | null;
  quota_size_cr?: number | null;
  quota_percent?: number | null;
  announced_on?: Date;
  created_at?: Date;
  announcement_url?: string;
  checked_at?: Date;
  admin?: { hidden?: boolean; overrides?: Overrides };
};

const IST_OFFSET_MS = 5.5 * 3600 * 1000;
// The calendar day in India; scraped dates are UTC midnight, but BSE stamps announcements with an IST time of day.
const dayOfDate = (date: Date | null | undefined) => (date ? new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10) : null);

/** The doc as the site shows it: the admin's overrides laid over the scraped fields. */
const toIpo = (scraped: QuotaDoc): QuotaIpo => {
  const { note, ...overrides } = scraped.admin?.overrides ?? {};
  const doc = { ...scraped, ...overrides };
  return {
    id: String(doc._id),
    name: doc.name,
    stage: doc.stage ?? 'dates', // a listed IPO has no stage left; it had dates
    source: doc.source ?? 'chittorgarh', // legacy chittorgarh docs carry no source
    parents: doc.parents,
    // Only the parents shown: an admin's parent change takes effect before the engine re-prices.
    parentQuotes: (doc.parent_quotes ?? [])
      .filter((quote) => doc.parents.includes(quote.name))
      .map((quote) => ({ name: quote.name, price: quote.price, asOf: dayOfDate(quote.as_of)! })),
    drhpDate: dayOfDate(doc.drhp_date),
    openDate: dayOfDate(doc.open_date),
    closeDate: dayOfDate(doc.close_date),
    lastBuyDate: dayOfDate(doc.last_buy_date),
    listingDate: dayOfDate(doc.listing_date),
    priceBand: doc.price_band,
    documentUrl: doc.drhp_url,
    slug: doc.ipo_slug,
    issueSizeCr: doc.issue_size_cr ?? null,
    quotaSizeCr: doc.quota_size_cr ?? null,
    quotaPercent: doc.quota_percent ?? null,
    note: note || null,
    announcedOn: dayOfDate(doc.announced_on ?? doc.created_at),
    announcementUrl: doc.announcement_url || null,
  };
};

const later = (a: string | null, b: string | null) => (a ?? '').localeCompare(b ?? '');
const rank = (ipo: QuotaIpo) => QUOTA_STAGES.indexOf(ipo.stage);

/**
 * The cacheable part: hidden docs dropped, overrides applied, rumours apart. `ipos` runs strongest stage first,
 * then nearest open date, then latest DRHP news; rumours newest first.
 */
export function quotaRows(docs: QuotaDoc[], listedDocs: QuotaDoc[]) {
  const shown = (list: QuotaDoc[]) => list.filter((doc) => !doc.admin?.hidden).map(toIpo);
  const all = shown(docs);
  const ipos = all
    .filter((ipo) => ipo.stage !== 'announced')
    .sort((a, b) => rank(a) - rank(b) || later(a.openDate ?? '9', b.openDate ?? '9') || later(b.drhpDate, a.drhpDate));
  const rumoured = all.filter((ipo) => ipo.stage === 'announced').sort((a, b) => later(b.announcedOn, a.announcedOn));
  const checked = docs.flatMap((doc) => doc.checked_at?.getTime() ?? []);
  const checkedAt = checked.length ? new Date(Math.max(...checked)).toISOString() : null;
  return { ipos, rumoured, listed: shown(listedDocs), checkedAt };
}

const QUOTE_FRESH_TRADING_DAYS = 5;

/** The per-request split: Buy before, SEBI approved, DRHP filed, rumoured, bidding closed (5 PM IST on the close date), listed. */
export function splitQuota({ ipos: all, rumoured, listed, checkedAt }: ReturnType<typeof quotaRows>, now = new Date()) {
  const today = dayNumberInIndia(now);
  // shortcut: counts weekdays, not exchange holidays; upgrade if a holiday calendar lands.
  const freshQuotes = (ipo: QuotaIpo): QuotaIpo => ({
    ...ipo,
    parentQuotes: ipo.parentQuotes.filter((quote) => addWorkingDays(dayOf(quote.asOf)!, QUOTE_FRESH_TRADING_DAYS) >= today),
  });
  const withQuotes = all.map(freshQuotes);
  const closed = withQuotes.filter((ipo) => isPastFivePmIst(ipo.closeDate, now));
  const ipos = withQuotes.filter((ipo) => !isPastFivePmIst(ipo.closeDate, now));
  const buyBefore: BuyBeforeIpo[] = ipos
    .filter((ipo) => ipo.stage === 'dates' || ipo.lastBuyDate)
    .map((ipo) => ({ ...ipo, daysToLastBuy: daysFromToday(ipo.lastBuyDate, now), lastBuyClosed: isPastLastBuyIst(ipo.lastBuyDate, now) ?? false }));
  const inBuyBefore = new Set(buyBefore.map((ipo) => ipo.id));
  const rest = ipos.filter((ipo) => !inBuyBefore.has(ipo.id));
  return {
    ipos,
    buyBefore,
    approved: rest.filter((ipo) => ipo.stage === 'approved'),
    filed: rest.filter((ipo) => ipo.stage === 'filed'),
    rumoured: rumoured.map(freshQuotes),
    closed,
    listed: listed.map(freshQuotes),
    checkedAt,
  };
}
