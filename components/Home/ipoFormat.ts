// Shared formatting/parsing helpers for IPO cards and list rows
import { IpoMarketLot } from '@/app/models/ipo';

// ipo_type is frequently missing/"N/A" from the scraper. Subscription only exists once bidding
// opens, so genuinely-upcoming IPOs need earlier-available signals too: the exchange listing
// text ("NSE SME"/"BSE SME" vs "NSE"/"BSE") and the detail page URL (scrapers commonly route
// SME issues through a distinct "/sme-ipo/" path) are both known from the DRHP stage onward.
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

  const url = ipo?.detail_url || '';
  if (/sme/i.test(url)) return 'SME';

  return 'N/A';
};

// price_band is sometimes blank at the top level while ipo_details.ipo_price_band carries the
// same figure (populated from a different scrape pass) — fall back to it before giving up.
export const getPriceBand = (ipo: {
  price_band?: string;
  ipo_details?: { ipo_price_band?: string };
} | null | undefined): string | null => {
  const primary = ipo?.price_band?.trim();
  if (primary && primary.toLowerCase() !== 'n/a' && !isUnfixedValue(primary)) return primary;

  const fallback = ipo?.ipo_details?.ipo_price_band?.trim();
  if (fallback && fallback.toLowerCase() !== 'n/a' && !isUnfixedValue(fallback)) return fallback;

  return null;
};

// Utility function to get risk border color
export const getRiskBorderColor = (riskScore: number) => {
  if (riskScore <= 3) return 'border-b-score-bad';
  if (riskScore <= 6) return 'border-b-score-mid';
  return 'border-b-score-good';
};

// Utility function to get risk text color (no background)
export const getRiskTextColor = (riskScore: number) => {
  if (riskScore <= 3) return 'text-score-bad';
  if (riskScore <= 6) return 'text-score-mid';
  return 'text-score-good';
};

// Utility function to parse date strings safely in a browser/node environment
export const parseCardDate = (dateString: string | undefined): Date | null => {
  if (!dateString) return null;
  const cleanDate = dateString.trim();
  if (cleanDate.toLowerCase() === 'tba' || cleanDate === '-' || cleanDate === '') {
    return null;
  }

  // Try parsing directly first (handles formats with years like "June 18, 2026")
  const directDate = new Date(cleanDate);
  if (!isNaN(directDate.getTime())) {
    return directDate;
  }

  // Try parsing with current year (handles formats like "18 June" or "June 18")
  const currentYear = new Date().getFullYear();
  const dateWithYear = `${cleanDate} ${currentYear}`;
  const parsedDate = new Date(dateWithYear);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  return null;
};

// Utility function to format a date string as "18 Aug"
export const formatShortDate = (dateString: string | undefined): string => {
  const date = parseCardDate(dateString);
  if (!date) return 'TBA';
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

// Same as formatShortDate, but reads as "Today" when the date is today instead of "18 Aug"
export const formatShortDateOrToday = (dateString: string | undefined): string => {
  const date = parseCardDate(dateString);
  if (!date) return 'TBA';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  if (compareDate.getTime() === today.getTime()) return 'Today';
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

// Extracts a signed numeric value out of a loosely-formatted percentage string (e.g. "▲ 21.4%", "-4.2%")
export const parseGainValue = (raw: string | undefined): number | null => {
  if (!raw) return null;
  const match = raw.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  return parseFloat(match[0]);
};

// Extracts the "(11.83%)" style gain percentage out of a formatted Est. Listing string
// (e.g. "104 (11.83%)" or "- (0.00%)"). Falls back to null when no percentage is present.
export const parseEstListingPercent = (raw: string | undefined): number | null => {
  if (!raw) return null;
  const match = raw.match(/\(?\s*(-?\d+(?:\.\d+)?)\s*%\s*\)?/);
  if (!match) return null;
  return parseFloat(match[1]);
};

// Qualitative read on the risk score so a bare number ("6.9") isn't the only signal of trust
export const getScoreTrustLabel = (score: number): string => {
  if (score >= 7) return 'Strong';
  if (score >= 4) return 'Moderate';
  return 'Weak';
};

// Rough allotment-chance estimate from a subscription ratio: fully subscribed or under -> guaranteed,
// oversubscribed -> roughly 1/ratio (the standard proportional-lottery approximation).
export const getAllotmentProbability = (subscriptionRatio: number | null): number | null => {
  if (subscriptionRatio === null || isNaN(subscriptionRatio) || subscriptionRatio < 0) return null;
  if (subscriptionRatio <= 1) return 100;
  return Math.max(1, Math.round(100 / subscriptionRatio));
};

// Allotment odds as "1 in 40" rather than "2.5%". User feedback: a percentage read like "how many
// people applied" and made readers stop to convert; "1 in 40" is understood at a glance.
// The subscription ratio *is* the N in the lottery approximation, so it's printed directly --
// one decimal below 10x (1.4x -> "1 in 1.4") so small books don't all collapse to "1 in 1".
export const formatAllotmentOdds = (subscriptionRatio: number | null): string => {
  if (subscriptionRatio === null || isNaN(subscriptionRatio) || subscriptionRatio < 0) return 'N/A';
  if (subscriptionRatio <= 1) return '1 in 1';
  const n = subscriptionRatio < 10 ? Math.round(subscriptionRatio * 10) / 10 : Math.round(subscriptionRatio);
  return `1 in ${n.toLocaleString('en-IN')}`;
};

// Plain-language sentence under the odds, for the predictor modal.
export const describeAllotmentOdds = (subscriptionRatio: number | null): string | null => {
  if (subscriptionRatio === null || isNaN(subscriptionRatio) || subscriptionRatio < 0) return null;
  if (subscriptionRatio <= 1) return 'Not fully subscribed yet — every valid application should get shares.';
  return `Roughly 1 out of every ${formatAllotmentOdds(subscriptionRatio).slice(5)} applicants gets shares.`;
};

// Color-code an allotment-chance percentage the same way scores are color-coded
export const getProbabilityColor = (probability: number | null): string => {
  if (probability === null) return 'text-muted-foreground';
  if (probability >= 60) return 'text-score-good';
  if (probability >= 25) return 'text-score-mid';
  return 'text-score-bad';
};

// The investor categories the app can actually price/predict for.
// rii_sr/nii_sr/qib_sr are the only subscription ratios the scraper captures (no separate
// S-HNI/B-HNI subscription split exists) — the analysis page's "Application Size" table does
// carry S-HNI/B-HNI *lot-size* rows (via ipo_market_lot[].application), so both HNI tiers share
// the combined NII subscription ratio as the closest honest proxy, flagged via `ratioNote`.
export interface AllotmentCategoryDef {
  key: 'retail' | 'shni' | 'bhni';
  label: string;
  matchKeyword: string; // regex fragment matched against ipo_market_lot[].application
  ratioField: 'rii_sr' | 'nii_sr';
  ratioNote?: string;
}

export const ALLOTMENT_CATEGORIES: AllotmentCategoryDef[] = [
  { key: 'retail', label: 'Retail', matchKeyword: 'retail', ratioField: 'rii_sr' },
  {
    key: 'shni',
    label: 'S-HNI',
    matchKeyword: 's[- ]?hni',
    ratioField: 'nii_sr',
    ratioNote: "S-HNI and B-HNI subscription isn't tracked separately — this uses the combined NII subscription ratio.",
  },
  {
    key: 'bhni',
    label: 'B-HNI',
    matchKeyword: 'b[- ]?hni',
    ratioField: 'nii_sr',
    ratioNote: "S-HNI and B-HNI subscription isn't tracked separately — this uses the combined NII subscription ratio.",
  },
];

// Looks up the Minimum/Maximum application-size rows for a category from ipo_market_lot,
// the same array the analysis page's "Application Size" table (investorSplit) is copied from.
export const getMarketLotRows = (
  marketLot: IpoMarketLot[] | undefined,
  matchKeyword: string
): { min?: IpoMarketLot; max?: IpoMarketLot } => {
  const rows = marketLot || [];
  const categoryRe = new RegExp(matchKeyword, 'i');
  const min = rows.find((r) => categoryRe.test(r.application) && /minimum/i.test(r.application));
  const max = rows.find((r) => categoryRe.test(r.application) && /maximum/i.test(r.application));
  return { min, max };
};

// An RHP prints a figure that hasn't been fixed yet as a bracketed bullet — "[●]" — and the
// scraper stores the detail-page text verbatim, so an issue size arrives as
// "Approx [●] Crores, 1,43,00,000 Equity Shares" while the rupee amount is genuinely still
// undecided. Rendered raw, that puts a stray "[.]" on the card. Drop the clauses whose figure is
// still a placeholder, keep the ones carrying a real number, and return null when none do — an
// unannounced size should fall back to "TBA", not print the prospectus's punctuation.
//
// Fixed at display time rather than in the scraper deliberately: the stored text is a faithful
// copy of the source, every document already in Mongo carries it, and an admin editing the field
// should see what the prospectus actually says.
const UNFIXED_VALUE_RE = /\[[^\]\d]{0,3}\]|[●•]/;

/**
 * Is this figure still the prospectus's placeholder rather than a number?
 *
 * Exported because the issue size is not the only field it reaches: a price
 * band that has not been fixed arrives as "[●] to [●] Per Share", and putting
 * a rupee sign in front of that does not make it a price.
 */
export const isUnfixedValue = (raw: string | undefined | null): boolean =>
  UNFIXED_VALUE_RE.test(raw ?? '');

export const formatIssueSize = (raw: string | undefined | null): string | null => {
  const text = raw?.trim();
  if (!text) return null;

  const lower = text.toLowerCase();
  if (lower === 'n/a' || lower === 'tba' || lower === 'tbd' || text === '-') return null;

  // The clause separator is a comma followed by whitespace. Commas inside an Indian-format
  // number ("1,43,00,000") never are, so this splits the string into its two clauses without
  // cutting the share count apart.
  const kept = text
    .split(/,\s+/)
    .map((clause) => clause.trim())
    .filter((clause) => clause && !UNFIXED_VALUE_RE.test(clause));

  if (kept.length === 0) return null;
  return kept.join(', ');
};

// --- QIB demand signal -------------------------------------------------------------------------
//
// Institutions (mutual funds, FIIs, insurers) do their own diligence and bid almost entirely on
// the closing day, so their subscription on that day is the market's "smart money" read -- a
// 60x total can hide a 1.5x QIB book that retail and HNI froth carried. Traders treat it as a
// deciding factor, so it nudges the analysis score: decent weight, capped at +/-1.5 so it never
// overrides the prospectus read.
//
// Timing is the whole design. On days 1-2 QIB sits near 0x as a matter of course, so it says
// nothing and is ignored. On the closing day the bids are landing through the afternoon: a high
// figure already means something, a low one may just be early, so only the bonus applies. Once
// bidding has closed the figure is final and counts both ways.
//
// Thresholds are mainboard rules of thumb. SME books often have no QIB portion at all, and
// ipowatch prints 0 for "no portion" and "no demand" alike, so a 0x SME QIB is treated as absent.

export type QibTier = 'weak' | 'neutral' | 'good' | 'strong';

export interface QibSignal {
  qib: number;
  tier: QibTier;
  /** Points added to the analysis score (already withheld if negative on closing day). */
  delta: number;
  /** Bidding has closed, so the figure is final. False on the closing day itself. */
  final: boolean;
}

const QIB_TIERS: { min: number; tier: QibTier; delta: number }[] = [
  { min: 50, tier: 'strong', delta: 1.5 },
  { min: 10, tier: 'good', delta: 1 },
  { min: 1, tier: 'neutral', delta: 0 },
  { min: -Infinity, tier: 'weak', delta: -1.5 },
];

/** Today's Indian calendar date as a comparable yyyymmdd number, whatever the server's zone. */
const indiaDayKey = (now: Date = new Date()): number => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
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
  } | null | undefined,
  now: Date = new Date()
): QibSignal | null => {
  const qib = parseGainValue(ipo?.qib_sr);
  if (qib === null || qib < 0) return null;
  if (qib === 0 && /sme/i.test(getIpoType(ipo))) return null;

  const close = parseCardDate(ipo?.ipo_dates?.ipo_close_date || ipo?.closing_date);
  if (!close) return null;

  const today = indiaDayKey(now);
  const closeKey = dayKey(close);
  if (today < closeKey) return null;

  // Past the close date, or the capture service has already marked the book final.
  const final = today > closeKey || ipo?.subscription_is_provisional === false;
  const { tier, delta } = QIB_TIERS.find((t) => qib >= t.min)!;
  return { qib, tier, delta: final ? delta : Math.max(0, delta), final };
};

/** The analysis score with the QIB nudge applied. An IPO with no analysis stays at 0 ("–"). */
export const applyQibAdjustment = (baseScore: number, signal: QibSignal | null): number => {
  if (!baseScore || !signal || signal.delta === 0) return baseScore;
  return Math.round(Math.min(10, Math.max(0, baseScore + signal.delta)) * 10) / 10;
};

/** Colour for the QIB figure itself. A low closing-day figure may just be early, so it stays neutral. */
export const getQibColor = (signal: QibSignal | null): string => {
  if (!signal) return 'text-foreground';
  if (signal.tier === 'strong' || signal.tier === 'good') return 'text-score-good';
  if (signal.tier === 'weak' && signal.final) return 'text-score-bad';
  return 'text-foreground';
};

/** "+0.8 QIB" style tooltip text for a score that has been nudged. */
export const describeQibAdjustment = (baseScore: number, signal: QibSignal | null): string => {
  if (!baseScore || !signal || signal.delta === 0) return 'Analysis score';
  const sign = signal.delta > 0 ? '+' : '';
  return `Analysis score ${baseScore} ${sign}${signal.delta} for ${signal.qib}x QIB subscription${signal.final ? '' : ' (closing day)'}`;
};
