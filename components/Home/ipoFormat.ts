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
  if (primary && primary.toLowerCase() !== 'n/a') return primary;

  const fallback = ipo?.ipo_details?.ipo_price_band?.trim();
  if (fallback && fallback.toLowerCase() !== 'n/a') return fallback;

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
