import type { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis";
import type { Ipo } from "@/types/ipo";
import {
  ALLOTMENT_CATEGORIES,
  daysFromToday,
  formatAllotmentOdds,
  formatAllotmentPercent,
  formatShortDate,
  gainColor,
  getAllotmentProbability,
  getAllotmentRatio,
  getProbabilityColor,
  signedPercent,
  parseEstListingPercent,
  parseGainValue,
} from "@/lib/ipo-format";
import { getGmp, getIssueDates, getLotShares, getMinInvestment, formatMinInvestment } from "@/components/analysis/analysis-facts";

export interface HeadlineFigure {
  label: string;
  value: string;
  caption: string;
  color: string;
}

/**
 * The three numbers to check before bidding. Once bids come in: GMP as a signed listing gain, total subscription
 * and retail odds. Before that: GMP, the opening date and the cost of one lot. Once listed, the listing gain replaces GMP.
 */
export function getHeadlineFigures(analysis: IpoComprehensiveAnalysis, ipo: Ipo): HeadlineFigure[] {
  const gmp = getListingFigure(ipo) ?? getGmpFigure(analysis, ipo);
  const subscription = parseGainValue(ipo.total_sr);
  if (subscription === null) return [gmp, getOpensFigure(analysis), getMinInvestmentFigure(analysis)];

  const retailLottery = getAllotmentRatio(ipo, ALLOTMENT_CATEGORIES[0]).lottery;
  const retailOdds = formatAllotmentOdds(retailLottery);
  return [
    gmp,
    {
      label: "Subscribed",
      value: `${subscription}x`,
      caption: ipo.subscription_is_provisional ? "Total so far" : "Total",
      color: "text-foreground",
    },
    {
      label: "Retail odds",
      value: formatAllotmentPercent(retailLottery),
      caption: retailOdds === "N/A" ? "Once bids come in" : retailOdds,
      color: getProbabilityColor(getAllotmentProbability(retailLottery)),
    },
  ];
}

/** The listing-day gain and price, or null before the IPO lists. */
function getListingFigure(ipo: Ipo): HeadlineFigure | null {
  const gain = parseGainValue(String(ipo.listing_gain ?? ""));
  if (!ipo.listing_price || gain === null) return null;
  return {
    label: "Listing gain",
    value: signedPercent(Math.round(gain * 100) / 100),
    caption: `Listed at ₹${ipo.listing_price}`,
    color: gainColor(gain),
  };
}

/** GMP as a signed listing gain, or the rupee premium when there is no percent. */
function getGmpFigure(analysis: IpoComprehensiveAnalysis, ipo: Ipo): HeadlineFigure {
  const gmp = getGmp(analysis, ipo);
  const gmpPercent = parseEstListingPercent(gmp.estimatedListing ?? undefined);
  const gmpRupees = parseFloat(ipo.gmp_ipo_gmp);
  const hasRupees = !Number.isNaN(gmpRupees);
  const gmpSign = gmpPercent ?? (hasRupees ? gmpRupees : null);

  return {
    label: "GMP (unofficial)",
    value: gmpPercent === null ? gmp.premium : signedPercent(gmpPercent),
    caption: hasRupees ? `₹${gmpRupees} a share` : "Grey market premium",
    color: gainColor(gmpSign),
  };
}

/** The opening date, with how many days away it is (computed in the ISR render). */
function getOpensFigure(analysis: IpoComprehensiveAnalysis): HeadlineFigure {
  const { opening, closing } = getIssueDates(analysis);
  return {
    label: "Opens",
    value: formatShortDate(opening),
    caption: opensCaption(opening, closing),
    color: opening ? "text-foreground" : "text-muted-foreground",
  };
}

function opensCaption(opening: string, closing: string): string {
  const days = daysFromToday(opening);
  if (days === 1) return "Tomorrow";
  if (days !== null && days > 1) return `In ${days} days`;
  if (closing) return `Closes ${formatShortDate(closing)}`;
  return "Dates to be announced";
}

/** The cost of one lot at the top of the band. */
function getMinInvestmentFigure(analysis: IpoComprehensiveAnalysis): HeadlineFigure {
  const minInvestment = getMinInvestment(analysis);
  const lotShares = getLotShares(analysis);
  return {
    label: "Min. investment",
    value: formatMinInvestment(analysis),
    caption: lotShares ? `${lotShares} shares` : "One lot",
    color: minInvestment ? "text-foreground" : "text-muted-foreground",
  };
}
