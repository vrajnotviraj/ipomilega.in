import type { Ipo, IpoMarketLot, UseOfProceedsItem } from '@/types/ipo';
import type { HomePageIpoProps } from '@/types/ipo-with-analysis';

// ---------- Board and price band ----------

export const BOARDS = ['Mainboard', 'SME'] as const;
export type Board = (typeof BOARDS)[number];

/**
 * "Mainboard", "SME" or "N/A". ipo_type is often missing, so it falls back to the subscription range
 * and the exchange listing ("NSE SME" vs "NSE").
 */
export const getIpoType = (ipo: {
  ipo_type?: string;
  subscription_date_range?: string;
  ipo_details?: { ipo_listing?: string };
} | null | undefined): string => {
  const raw = ipo?.ipo_type?.trim();
  if (raw && raw.toLowerCase() !== 'n/a') return raw;

  const range = ipo?.subscription_date_range || '';
  if (/\bsme\b/i.test(range)) return 'SME';
  if (/mainboard/i.test(range)) return 'Mainboard';

  const listing = ipo?.ipo_details?.ipo_listing || '';
  if (/\bsme\b/i.test(listing)) return 'SME';
  if (listing.trim()) return 'Mainboard';
  return 'N/A';
};

// Matches a figure the RHP hasn't fixed yet, printed as "[●]".
const UNFIXED_VALUE_RE = /\[[^\]\d]{0,3}\]|[●•]/;

const isUnfixedValue = (raw: string | undefined | null): boolean =>
  UNFIXED_VALUE_RE.test(raw ?? '');

const isKnownValue = (value: string | undefined): value is string =>
  !!value && value.toLowerCase() !== 'n/a' && !isUnfixedValue(value);

/** The issue price band as "93-99", or null when the feed has none. */
export const getPriceBand = (ipo: {
  price_band?: string;
  ipo_details?: { ipo_price_band?: string };
} | null | undefined): string | null => {
  const band = [ipo?.price_band, ipo?.ipo_details?.ipo_price_band].map((value) => value?.trim()).find(isKnownValue);
  return band ? tidyPriceBand(band) : null;
};

/** "₹93 to 99 Per Share" as "93-99": no currency sign, no unit, a hyphen for the range. */
const tidyPriceBand = (band: string): string =>
  band
    .replace(/₹|rs\.?|inr/gi, '')
    .replace(/per\s+(equity\s+)?shares?/i, '')
    .replace(/\s*(?:to|-|\u2013|\u2014)\s*/i, '-')
    .replace(/\s+/g, ' ')
    .trim();

/** A price band with a rupee sign, "Price TBA" while it is still "[●] to [●]", or "N/A". */
export const formatPriceBand = (priceBand: string | undefined): string => {
  if (!priceBand || priceBand.toLowerCase() === 'n/a') return 'N/A';
  if (isUnfixedValue(priceBand)) return 'Price TBA';
  return `₹${tidyPriceBand(priceBand)}`;
};

/**
 * The issue size without clauses that are still "[●]" ("Approx [●] Crores, 1,43,00,000 Equity Shares"
 * keeps the share count). Null when nothing real is left, so the card shows "TBA".
 */
export const formatIssueSize = (raw: string | undefined | null): string | null => {
  const text = raw?.trim();
  if (!text) return null;
  if (['n/a', 'tba', 'tbd', '-'].includes(text.toLowerCase())) return null;

  // Comma plus whitespace: the commas inside "1,43,00,000" have none, so numbers stay whole.
  const kept = text
    .split(/,\s+/)
    .map((clause) => clause.trim())
    .filter((clause) => clause && !UNFIXED_VALUE_RE.test(clause));

  return kept.length ? kept.join(', ') : null;
};

// ---------- Gains ----------

/** Gain or loss colour for a signed figure on the ink panel, plain chalk for zero. */
export const gainColorOnInk = (value: number) => {
  if (value > 0) return 'text-score-good-on-ink';
  if (value < 0) return 'text-score-bad-on-ink';
  return 'text-primary-foreground';
};

// ---------- Dates ----------
// IPO dates are Indian calendar days, and this code runs on servers and in browsers in any time zone.

export const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Reads the loose dates the scraper and the analysis engine write: "June 12, 2026", "2026-06-12",
 * "12/06/2026" (day first) and "12 June" (this year). Null for TBA, "-", blank, a bare year or a month with no day.
 */
export function parseIpoDate(raw: string | null | undefined): Date | null {
  const text = raw?.trim() ?? '';
  if (!text || ['tba', 'tbd', 'n/a', '-'].includes(text.toLowerCase())) return null;
  if (/^\d{4}$/.test(text) || /^(?:\d{4}\s+[a-z]+|[a-z]+\s+\d{4})$/i.test(text)) return null;

  // Built by hand: Date reads "12/06/2026" as 6 December, and "2026-06-12" as UTC rather than local midnight.
  const dayFirst = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dayFirst) return new Date(Number(dayFirst[3]), Number(dayFirst[2]) - 1, Number(dayFirst[1]));
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  const hasYear = /\b\d{4}\b/.test(text);
  // Without a day of month, "June" alone would silently become the 1st.
  if (!hasYear && !/\b([1-9]|[12]\d|3[01])\b/.test(text)) return null;
  // Date fills a missing year with 2001, so this year is added first.
  const date = new Date(hasYear ? text : `${text} ${new Date().getFullYear()}`);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * The date's calendar day in India, as a whole day count.
 * ponytail: a date without a time is read at local midnight, which is the same Indian day anywhere west of India.
 */
export const dayNumberInIndia = (date: Date): number =>
  Date.parse(date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })) / DAY_MS;

/** Whole days from today in India to the date: 0 is today, negative once passed. Null when the date is unknown. */
export const daysFromToday = (raw: string | null | undefined): number | null => {
  const date = parseIpoDate(raw);
  return date ? dayNumberInIndia(date) - dayNumberInIndia(new Date()) : null;
};

/** Days until bidding closes (0 is today), or null without a usable close date. */
export const getDaysUntilClosing = (ipo: { ipo_dates?: { ipo_close_date?: string }; closing_date?: string } | null | undefined): number | null =>
  daysFromToday(ipo?.ipo_dates?.ipo_close_date || ipo?.closing_date);

/**
 * Whether the date has passed, counting from 5 PM IST on the day itself: when bidding shuts and allotment comes out.
 * Null when the date is unknown.
 */
export const isPastFivePmIst = (raw: string | null | undefined, now = new Date()): boolean | null => {
  const date = parseIpoDate(raw);
  if (!date) return null;
  const days = dayNumberInIndia(date) - dayNumberInIndia(now);
  const hourInIndia = Number(now.toLocaleString('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Kolkata' }));
  return days < 0 || (days === 0 && hourInIndia >= 17);
};

export type IssueStage = 'upcoming' | 'live' | 'past';

/** Where an issue is in its bidding window, or null without both dates. */
export const getIssueStage = (opening: string | null | undefined, closing: string | null | undefined): IssueStage | null => {
  const toOpen = daysFromToday(opening);
  const closed = isPastFivePmIst(closing);
  if (toOpen === null || closed === null) return null;
  if (closed) return 'past';
  if (toOpen > 0) return 'upcoming';
  return 'live';
};

/** "18 Aug", or "18 Aug 2026" with the year. Null when the date doesn't parse. */
export const formatIpoDate = (raw: string | null | undefined, withYear = false): string | null => {
  const date = parseIpoDate(raw);
  if (!date) return null;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: withYear ? 'numeric' : undefined });
};

/** A scrape timestamp as "30 Sep, 15:35 IST". Timestamps without an offset are UTC. Null when it doesn't parse. */
export const formatIstTimestamp = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const date = new Date(/Z|[+-]\d\d:?\d\d$/.test(raw) ? raw : `${raw}Z`);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
  return `${day}, ${time} IST`;
};

/** "18 Aug" (or "18 Aug 2026" with the year), or "TBA". */
export const formatShortDate = (raw: string | undefined, withYear = false): string => formatIpoDate(raw, withYear) ?? 'TBA';

/** "Today", "18 Aug" or "TBA". */
export const formatShortDateOrToday = (raw: string | undefined): string =>
  daysFromToday(raw) === 0 ? 'Today' : formatShortDate(raw);

/**
 * The exchange's allotment checker once the basis of allotment is out (5 PM IST on the day), else null.
 * BSE covers mainboard (listed on both) and BSE SME; NSE-only issues need NSE's.
 */
export const getAllotmentCheckUrl = (ipo: {
  ipo_dates?: { basis_of_allotment?: string };
  ipo_details?: { ipo_listing?: string };
} | null | undefined, now = new Date()): string | null => {
  if (!isPastFivePmIst(ipo?.ipo_dates?.basis_of_allotment, now)) return null;

  const listing = ipo?.ipo_details?.ipo_listing || '';
  const isNseOnly = /nse/i.test(listing) && !/bse/i.test(listing);
  return isNseOnly
    ? 'https://www.nseindia.com/invest/check-trades-bids-verify-ipo-bids'
    : 'https://www.bseindia.com/investors/appli_check.aspx';
};

// ---------- GMP ----------

/** First signed number in a loose string: "▲ 21.4%" is 21.4, "-4.2%" is -4.2. */
export const parseGainValue = (raw: string | undefined): number | null => {
  const match = raw?.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
};

/** The percentage in an est. listing string: "104 (11.83%)" is 11.83. */
export const parseEstListingPercent = (raw: string | undefined): number | null => {
  const match = raw?.match(/\(?\s*(-?\d+(?:\.\d+)?)\s*%\s*\)?/);
  return match ? parseFloat(match[1]) : null;
};

/** Gain green or loss red for a signed figure, muted for zero or none. */
export const gainColor = (value: number | null): string => {
  if (!value) return 'text-muted-foreground';
  return value > 0 ? 'text-score-good' : 'text-score-bad';
};

/** Motion class for a signed figure: gains drift up into place, losses drift down, zero stays still. */
export const gainMotion = (value: number | null): string => {
  if (!value) return '';
  return value > 0 ? 'gain-rise' : 'gain-sink';
};

/** GMP gain % for sorting highest first; no GMP sorts last. */
export const gmpOf = (item: HomePageIpoProps) => parseEstListingPercent(item.ipo?.gmp_price_gain) ?? -Infinity;

// ---------- Allotment odds ----------

const isValidRatio = (ratio: number | null): ratio is number => ratio !== null && !isNaN(ratio) && ratio >= 0;

/** Allotment chance in %: 100 up to fully subscribed, then roughly 1/ratio. */
export const getAllotmentProbability = (subscriptionRatio: number | null): number | null => {
  if (!isValidRatio(subscriptionRatio)) return null;
  if (subscriptionRatio <= 1) return 100;
  return Math.max(1, Math.round(100 / subscriptionRatio));
};

/** The N in "1 in N": one decimal below 10, whole above. */
const oddsN = (r: number) => (r < 10 ? Math.round(r * 10) / 10 : Math.round(r)).toLocaleString('en-IN');

/** A percent with its sign: "+38.2%", "-4%", "+0%". */
export const signedPercent = (value: number) => `${value >= 0 ? '+' : ''}${value}%`;

/** A rupee amount in Indian grouping: "₹1,49,760". */
export const formatRupees = (value: number) => `₹${value.toLocaleString('en-IN')}`;

/** GMP with its sign ("+38.23%"), or "N/A" when there is none. */
export const formatGmp = (percent: number | null) => (percent === null ? 'N/A' : signedPercent(percent));

/** A subscription ratio as "101.86x", or "–" when unknown. */
export const formatTimes = (ratio: number | null) => (ratio === null ? '–' : `${ratio}x`);

/** "1 in 40". One decimal below 10x so small books don't all read "1 in 1". */
export const formatAllotmentOdds = (subscriptionRatio: number | null): string => {
  if (!isValidRatio(subscriptionRatio)) return 'N/A';
  if (subscriptionRatio <= 1) return '1 in 1';
  return `1 in ${oddsN(subscriptionRatio)}`;
};

/** "2.5%". More decimals at the low end so big books don't all read "0%". */
export const formatAllotmentPercent = (subscriptionRatio: number | null): string => {
  if (!isValidRatio(subscriptionRatio)) return 'N/A';
  if (subscriptionRatio <= 1) return '100%';
  const pct = 100 / subscriptionRatio;
  if (pct < 0.01) return '<0.01%';
  const decimals = pct >= 10 ? 0 : pct >= 1 ? 1 : 2;
  return `${Number(pct.toFixed(decimals))}%`;
};

/** One plain sentence explaining the odds, or null without a ratio. */
export const describeAllotmentOdds = (subscriptionRatio: number | null): string | null => {
  if (!isValidRatio(subscriptionRatio)) return null;
  if (subscriptionRatio <= 1) return 'Not fully subscribed yet, so every valid application should get shares.';
  return `Roughly 1 out of every ${oddsN(subscriptionRatio)} applicants gets allotment.`;
};

/** Odds colour: 60% and up good, 25% and up mid, else bad. */
export const getProbabilityColor = (probability: number | null): string => {
  if (probability === null) return 'text-muted-foreground';
  if (probability >= 60) return 'text-score-good';
  if (probability >= 25) return 'text-score-mid';
  return 'text-score-bad';
};

type RatioField = 'rii_sr' | 'snii_sr' | 'bnii_sr';

export interface AllotmentCategoryDef {
  key: 'retail' | 'shni' | 'bhni';
  label: string;
  /** Regex fragment matched against ipo_market_lot[].application. */
  matchKeyword: string;
  ratioField: RatioField;
}

export const ALLOTMENT_CATEGORIES: AllotmentCategoryDef[] = [
  { key: 'retail', label: 'Retail', matchKeyword: 'retail', ratioField: 'rii_sr' },
  { key: 'shni', label: 'S-HNI', matchKeyword: 's[- ]?hni', ratioField: 'snii_sr' },
  { key: 'bhni', label: 'B-HNI', matchKeyword: 'b[- ]?hni', ratioField: 'bnii_sr' },
];

export const COMBINED_NII_NOTE = "This IPO's S-HNI and B-HNI subscription isn't split yet, so this uses the combined NII figure.";

/** The Minimum and Maximum application-size rows for one category. */
export const getMarketLotRows = (
  marketLot: IpoMarketLot[] | undefined,
  matchKeyword: string
): { min?: IpoMarketLot; max?: IpoMarketLot } => {
  const categoryRe = new RegExp(matchKeyword, 'i');
  const findRow = (size: RegExp) => (marketLot || []).find((r) => categoryRe.test(r.application) && size.test(r.application));
  return { min: findRow(/minimum/i), max: findRow(/maximum/i) };
};

/** Share of a B-HNI application one winning slot covers: S-HNI minimum ÷ B-HNI minimum, about ⅕. */
function bhniSlotShare(marketLot: IpoMarketLot[] | undefined, bhniKeyword: string): number {
  const slot = parseGainValue(getMarketLotRows(marketLot, 's[- ]?hni').min?.shares);
  const minApp = parseGainValue(getMarketLotRows(marketLot, bhniKeyword).min?.shares);
  // Without a lot table, use the ₹2L/₹10L thresholds the rows would give.
  return slot && minApp ? slot / minApp : 0.2;
}

/**
 * A category's subscription, and `lottery`: applicants per winning slot, the N in "1 in N".
 *
 * Retail winners get one lot. Under SEBI ICDR every NII winner gets the S-HNI minimum application
 * (just over ₹2L) by draw of lots from its own tier's pool. With everyone at their tier's minimum,
 * N = subscription × slot ÷ minimum application: 1× for retail and S-HNI, about ⅕ for B-HNI
 * (₹2L slot, ₹10L minimum). Bigger applications mean fewer applicants, so real odds run a little better.
 */
export const getAllotmentRatio = (
  ipo: Partial<Record<RatioField | 'nii_sr', string>> & { ipo_market_lot?: IpoMarketLot[] } | null | undefined,
  cat: AllotmentCategoryDef
): { subscription: number | null; lottery: number | null; usesCombinedNii: boolean } => {
  const tierRatio = parseGainValue(ipo?.[cat.ratioField]);
  // Falls back to the combined NII figure when the tier has none.
  const usesCombinedNii = tierRatio === null && cat.key !== 'retail';
  const subscription = usesCombinedNii ? parseGainValue(ipo?.nii_sr) : tierRatio;
  const lottery = subscription !== null && cat.key === 'bhni' ? subscription * bhniSlotShare(ipo?.ipo_market_lot, cat.matchKeyword) : subscription;
  return { subscription, lottery, usesCombinedNii };
};

// ---------- Use of proceeds ----------

export type UseOfProceeds = { items: UseOfProceedsItem[]; freshCr: number | null; ofsCr: number | null };

const croreOrNull = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;

/** Where the issue money goes, from the IPO's `issue` facts. Null when there is nothing to show. */
export const getUseOfProceeds = (ipo: Pick<Ipo, 'issue'>): UseOfProceeds | null => {
  const items = (Array.isArray(ipo.issue?.objects) ? ipo.issue.objects : []).filter(
    (item) => typeof item?.purpose === 'string' && item.purpose.trim()
  );
  const freshCr = croreOrNull(ipo.issue?.fresh_issue_cr);
  const ofsCr = croreOrNull(ipo.issue?.offer_for_sale_cr);
  // No items is only worth a card when the issue is OFS-only (fresh 0); otherwise there is nothing to list.
  if (items.length === 0 && freshCr !== 0) return null;
  return { items, freshCr, ofsCr };
};

// ---------- Listing estimate ----------

export type Listing = { price: number | null; gain: number | null };

type ListingFields = Pick<Ipo, 'gmp_price_band' | 'ipo_price' | 'gmp_est_listing' | 'gmp_price_gain'> | null | undefined;

/** Issue price: the GMP feed's upper band, else the performance row's issue price. */
export const issuePrice = (ipo: ListingFields): number | null =>
  parseGainValue(ipo?.gmp_price_band) || parseGainValue(ipo?.ipo_price) || null;

/** GMP-implied listing from "584 (37.74%)". The price is "-" when no GMP was quoted, so it is derived from the gain. */
export function estimatedListing(ipo: ListingFields): Listing {
  const raw = ipo?.gmp_est_listing || ipo?.gmp_price_gain;
  const gain = parseEstListingPercent(raw);
  const leadingNumber = raw?.trim().match(/^-?[\d,]+(?:\.\d+)?/);
  const issue = issuePrice(ipo);

  if (leadingNumber) return { price: parseFloat(leadingNumber[0].replace(/,/g, '')), gain };
  if (gain !== null && issue) return { price: Math.round(issue * (1 + gain / 100)), gain };
  return { price: null, gain };
}

/** Latest close and its gain on the issue price: how the IPO has done since it listed. */
export function lastListing(ipo: (ListingFields & Pick<Ipo, 'last_price'>) | null | undefined): Listing {
  const price = parseGainValue(ipo?.last_price);
  const issue = issuePrice(ipo);
  return { price, gain: price !== null && issue ? Math.round(((price - issue) / issue) * 10000) / 100 : null };
}

/** Rupees the minimum retail application would gain at today's GMP (one lot on Mainboard, usually two on SME), or null without a GMP or lot table. */
export function gmpGainPerApplication(ipo: Pick<Ipo, 'gmp_ipo_gmp' | 'ipo_market_lot'> | null | undefined): number | null {
  const perShare = parseGainValue(ipo?.gmp_ipo_gmp);
  const lotShares = parseGainValue(getMarketLotRows(ipo?.ipo_market_lot, 'retail').min?.shares);
  if (!perShare || !lotShares) return null;
  return Math.round(perShare * lotShares);
}
