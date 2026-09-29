import { IpoMarketLot } from '@/types/ipo';
import { HomePageIpoProps } from '@/types/homepage';

// ipo_type is often missing or "N/A", so fall back to signals known from the DRHP stage on:
// the subscription range, the exchange listing ("NSE SME" vs "NSE"), and the "/sme-ipo/" detail URL.
export const getIpoType = (ipo: {
  ipo_type?: string;
  subscription_date_range?: string;
  ipo_details?: { ipo_listing?: string };
  detail_url?: string;
} | null | undefined): string => {
  const raw = ipo?.ipo_type?.trim();
  if (raw && raw.toLowerCase() !== 'n/a') return raw;

  const range = ipo?.subscription_date_range || '';
  if (/\bsme\b/i.test(range)) return 'SME';
  if (/mainboard/i.test(range)) return 'Mainboard';

  const listing = ipo?.ipo_details?.ipo_listing || '';
  if (/\bsme\b/i.test(listing)) return 'SME';
  if (listing.trim()) return 'Mainboard';

  if (/sme/i.test(ipo?.detail_url || '')) return 'SME';
  return 'N/A';
};

const isKnownValue = (value: string | undefined): value is string =>
  !!value && value.toLowerCase() !== 'n/a' && !isUnfixedValue(value);

// Top-level price_band, else ipo_details.ipo_price_band, which a different scrape pass fills.
export const getPriceBand = (ipo: {
  price_band?: string;
  ipo_details?: { ipo_price_band?: string };
} | null | undefined): string | null => {
  const primary = ipo?.price_band?.trim();
  if (isKnownValue(primary)) return primary;
  const fallback = ipo?.ipo_details?.ipo_price_band?.trim();
  return isKnownValue(fallback) ? fallback : null;
};

export const getRiskTextColor = (riskScore: number) => {
  if (riskScore <= 3) return 'text-score-bad';
  if (riskScore <= 6) return 'text-score-mid';
  return 'text-score-good';
};

// Reads "June 18, 2026" as is, and "18 June" as this year. Null for TBA or blank.
export const parseCardDate = (dateString: string | undefined): Date | null => {
  const clean = dateString?.trim();
  if (!clean || clean.toLowerCase() === 'tba' || clean === '-') return null;

  const direct = new Date(clean);
  if (!isNaN(direct.getTime())) return direct;

  const withYear = new Date(`${clean} ${new Date().getFullYear()}`);
  return isNaN(withYear.getTime()) ? null : withYear;
};

// Whole days from today to the date (negative once it has passed), or null when the date is unknown.
export const daysFromToday = (dateString: string | undefined): number | null => {
  const date = parseCardDate(dateString);
  if (!date) return null;
  return Math.round((date.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
};

// Days until bidding closes: 0 is today, -1 means no usable close date.
export const getDaysUntilClosing = (ipo: { ipo_dates?: { ipo_close_date?: string }; closing_date?: string } | null | undefined): number =>
  daysFromToday(ipo?.ipo_dates?.ipo_close_date || ipo?.closing_date) ?? -1;

// "18 Aug", or "TBA".
export const formatShortDate = (dateString: string | undefined): string => {
  const date = parseCardDate(dateString);
  if (!date) return 'TBA';
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

export const formatShortDateOrToday = (dateString: string | undefined): string =>
  daysFromToday(dateString) === 0 ? 'Today' : formatShortDate(dateString);

// The exchange's allotment checker once the basis of allotment is out, else null.
// BSE covers mainboard (listed on both) and BSE SME; NSE-only issues need NSE's.
export const getAllotmentCheckUrl = (ipo: {
  ipo_dates?: { basis_of_allotment?: string };
  ipo_details?: { ipo_listing?: string };
} | null | undefined): string | null => {
  const days = daysFromToday(ipo?.ipo_dates?.basis_of_allotment);
  if (days === null || days > 0) return null;
  const listing = ipo?.ipo_details?.ipo_listing || '';
  return /nse/i.test(listing) && !/bse/i.test(listing)
    ? 'https://www.nseindia.com/invest/check-trades-bids-verify-ipo-bids'
    : 'https://www.bseindia.com/investors/appli_check.aspx';
};

// First signed number in a loose string: "▲ 21.4%" is 21.4, "-4.2%" is -4.2.
export const parseGainValue = (raw: string | undefined): number | null => {
  const match = raw?.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
};

// The percentage in an est. listing string: "104 (11.83%)" is 11.83.
export const parseEstListingPercent = (raw: string | undefined): number | null => {
  const match = raw?.match(/\(?\s*(-?\d+(?:\.\d+)?)\s*%\s*\)?/);
  return match ? parseFloat(match[1]) : null;
};

// GMP gain % for sorting highest first; no GMP sorts last.
export const gmpOf = (item: HomePageIpoProps) => parseEstListingPercent(item.ipo?.gmp_price_gain) ?? -Infinity;

export const getScoreTrustLabel = (score: number): string => {
  if (score >= 7) return 'Strong';
  if (score >= 4) return 'Moderate';
  return 'Weak';
};

const isValidRatio = (ratio: number | null): ratio is number => ratio !== null && !isNaN(ratio) && ratio >= 0;

// Allotment chance in %: 100 up to fully subscribed, then roughly 1/ratio (the lottery approximation).
export const getAllotmentProbability = (subscriptionRatio: number | null): number | null => {
  if (!isValidRatio(subscriptionRatio)) return null;
  if (subscriptionRatio <= 1) return 100;
  return Math.max(1, Math.round(100 / subscriptionRatio));
};

// "1 in 40": the lottery ratio (see getAllotmentRatio) is the N. One decimal below 10x so small books don't all read "1 in 1".
export const formatAllotmentOdds = (subscriptionRatio: number | null): string => {
  if (!isValidRatio(subscriptionRatio)) return 'N/A';
  if (subscriptionRatio <= 1) return '1 in 1';
  const n = subscriptionRatio < 10 ? Math.round(subscriptionRatio * 10) / 10 : Math.round(subscriptionRatio);
  return `1 in ${n.toLocaleString('en-IN')}`;
};

// "2.5%" for the home card grid. More decimals at the low end so big books don't all read "0%".
export const formatAllotmentPercent = (subscriptionRatio: number | null): string => {
  if (!isValidRatio(subscriptionRatio)) return 'N/A';
  if (subscriptionRatio <= 1) return '100%';
  const pct = 100 / subscriptionRatio;
  if (pct < 0.01) return '<0.01%';
  const decimals = pct >= 10 ? 0 : pct >= 1 ? 1 : 2;
  return `${Number(pct.toFixed(decimals))}%`;
};

export const describeAllotmentOdds = (subscriptionRatio: number | null): string | null => {
  if (!isValidRatio(subscriptionRatio)) return null;
  if (subscriptionRatio <= 1) return 'Not fully subscribed yet, so every valid application should get shares.';
  return `Roughly 1 out of every ${formatAllotmentOdds(subscriptionRatio).slice(5)} applicants gets allotment.`;
};

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

/**
 * A category's subscription, and `lottery`: applicants per winning slot, the N in "1 in N".
 *
 * Retail winners get one lot. Since April 2022 (SEBI ICDR) every NII winner, S-HNI or B-HNI, gets
 * the S-HNI minimum application (just over ₹2L) by draw of lots, from that tier's own pool. If
 * everyone applies at their tier's minimum, N = subscription × slot ÷ minimum application. That's
 * 1× for retail and S-HNI, and about ⅕ for B-HNI (₹2L slot, ₹10L minimum), so B-HNI odds run
 * about 5x better than the same subscription in S-HNI. Bigger applications mean fewer applicants,
 * so real odds are a little better than this for retail and S-HNI.
 */
export const getAllotmentRatio = (
  ipo: Partial<Record<RatioField | 'nii_sr', string>> & { ipo_market_lot?: IpoMarketLot[] } | null | undefined,
  cat: AllotmentCategoryDef
): { subscription: number | null; lottery: number | null; usesCombinedNii: boolean } => {
  const tierRatio = parseGainValue(ipo?.[cat.ratioField]);
  // IPOs captured before the split, or from ipowatch, only have the combined NII figure.
  const usesCombinedNii = tierRatio === null && cat.key !== 'retail';
  const subscription = usesCombinedNii ? parseGainValue(ipo?.nii_sr) : tierRatio;
  if (subscription === null || cat.key !== 'bhni') return { subscription, lottery: subscription, usesCombinedNii };

  const slot = parseGainValue(getMarketLotRows(ipo?.ipo_market_lot, 's[- ]?hni').min?.shares);
  const minApp = parseGainValue(getMarketLotRows(ipo?.ipo_market_lot, cat.matchKeyword).min?.shares);
  // No lot table: fall back to the ₹2L/₹10L thresholds the rows would give.
  const lottery = subscription * (slot && minApp ? slot / minApp : 0.2);
  return { subscription, lottery, usesCombinedNii };
};

export const COMBINED_NII_NOTE = "This IPO's S-HNI and B-HNI subscription isn't split yet, so this uses the combined NII figure.";

// The Minimum and Maximum application-size rows for one category.
export const getMarketLotRows = (
  marketLot: IpoMarketLot[] | undefined,
  matchKeyword: string
): { min?: IpoMarketLot; max?: IpoMarketLot } => {
  const categoryRe = new RegExp(matchKeyword, 'i');
  const findRow = (size: RegExp) => (marketLot || []).find((r) => categoryRe.test(r.application) && size.test(r.application));
  return { min: findRow(/minimum/i), max: findRow(/maximum/i) };
};

// An RHP prints a figure not fixed yet as "[●]", and the scraper stores the text verbatim.
// Cleaned at display time so the stored copy stays faithful to the prospectus.
const UNFIXED_VALUE_RE = /\[[^\]\d]{0,3}\]|[●•]/;

export const isUnfixedValue = (raw: string | undefined | null): boolean =>
  UNFIXED_VALUE_RE.test(raw ?? '');

// Drops clauses that are still "[●]" ("Approx [●] Crores, 1,43,00,000 Equity Shares" keeps the
// share count); null when nothing real is left, so the card shows "TBA".
export const formatIssueSize = (raw: string | undefined | null): string | null => {
  const text = raw?.trim();
  if (!text) return null;
  if (['n/a', 'tba', 'tbd', '-'].includes(text.toLowerCase())) return null;

  // Split on comma plus whitespace: commas inside "1,43,00,000" have none, so numbers stay whole.
  const kept = text
    .split(/,\s+/)
    .map((clause) => clause.trim())
    .filter((clause) => clause && !UNFIXED_VALUE_RE.test(clause));

  return kept.length ? kept.join(', ') : null;
};

// QIB demand nudges the score by up to 1.5 points. Institutions bid on the closing day, so before
// it the figure is ignored; on the closing day only a bonus applies (a low figure may just be early);
// once bidding has closed it counts both ways. SME books often have no QIB portion, and the feed
// prints 0 for both "no portion" and "no demand", so a 0x SME QIB is treated as absent.

type QibTier = 'weak' | 'neutral' | 'good' | 'strong';

interface QibSignal {
  qib: number;
  tier: QibTier;
  /** Points added to the score; a negative one is withheld on the closing day. */
  delta: number;
  /** Bidding has closed, so the figure is final. */
  final: boolean;
}

const QIB_TIERS: { min: number; tier: QibTier; delta: number }[] = [
  { min: 50, tier: 'strong', delta: 1.5 },
  { min: 10, tier: 'good', delta: 1 },
  { min: 1, tier: 'neutral', delta: 0 },
  { min: -Infinity, tier: 'weak', delta: -1.5 },
];

// Today's Indian calendar date as yyyymmdd, whatever the server's time zone.
const indiaDayKey = (): number => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return get('year') * 10000 + get('month') * 100 + get('day');
};

// parseCardDate builds the date at local midnight, so its local fields are the calendar date.
const dayKey = (date: Date): number => date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();

export const getQibSignal = (
  ipo: {
    qib_sr?: string;
    subscription_is_provisional?: boolean;
    ipo_type?: string;
    subscription_date_range?: string;
    ipo_details?: { ipo_listing?: string };
    detail_url?: string;
    ipo_dates?: { ipo_close_date?: string };
    closing_date?: string;
  } | null | undefined
): QibSignal | null => {
  const qib = parseGainValue(ipo?.qib_sr);
  if (qib === null || qib < 0) return null;
  if (qib === 0 && /sme/i.test(getIpoType(ipo))) return null;

  const close = parseCardDate(ipo?.ipo_dates?.ipo_close_date || ipo?.closing_date);
  if (!close) return null;

  const today = indiaDayKey();
  const closeKey = dayKey(close);
  if (today < closeKey) return null;

  // Final once past the close date, or once the capture service marks the book final.
  const final = today > closeKey || ipo?.subscription_is_provisional === false;
  const { tier, delta } = QIB_TIERS.find((t) => qib >= t.min)!;
  return { qib, tier, delta: final ? delta : Math.max(0, delta), final };
};

// The score with the QIB nudge applied. An IPO with no analysis stays at 0.
export const applyQibAdjustment = (baseScore: number, signal: QibSignal | null): number => {
  if (!baseScore || !signal || signal.delta === 0) return baseScore;
  return Math.round(Math.min(10, Math.max(0, baseScore + signal.delta)) * 10) / 10;
};

// Color for the QIB figure. A low closing-day figure may just be early, so it stays neutral.
export const getQibColor = (signal: QibSignal | null): string => {
  if (signal?.tier === 'strong' || signal?.tier === 'good') return 'text-score-good';
  if (signal?.tier === 'weak' && signal.final) return 'text-score-bad';
  return 'text-foreground';
};

export const describeQibAdjustment = (baseScore: number, signal: QibSignal | null): string => {
  if (!baseScore || !signal || signal.delta === 0) return 'Analysis score';
  const sign = signal.delta > 0 ? '+' : '';
  return `Analysis score ${baseScore} ${sign}${signal.delta} for ${signal.qib}x QIB subscription${signal.final ? '' : ' (closing day)'}`;
};
