import type { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis";
import type { Ipo } from "@/types/ipo";
import type { Dictionary } from "@/messages";
import { fill, plural } from "@/lib/i18n/locales";
import {
  ALLOTMENT_CATEGORIES,
  daysFromToday,
  allotmentOddsN,
  formatAllotmentPercent,
  formatShortDate,
  gainColor,
  getAllotmentProbability,
  getAllotmentRatio,
  getProbabilityColor,
  signedPercent,
  parseEstListingPercent,
  parseGainValue,
} from "@/lib/ipo/format";
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
export function getHeadlineFigures(analysis: IpoComprehensiveAnalysis, ipo: Ipo, d: Dictionary): HeadlineFigure[] {
  const words = d.analysis.summary.figures;
  const gmp = getListingFigure(ipo, d) ?? getGmpFigure(analysis, ipo, d);
  const subscription = parseGainValue(ipo.total_sr);
  if (subscription === null) return [gmp, getOpensFigure(analysis, d), getMinInvestmentFigure(analysis, d)];

  const retailLottery = getAllotmentRatio(ipo, ALLOTMENT_CATEGORIES[0]).lottery;
  const n = allotmentOddsN(retailLottery);
  return [
    gmp,
    {
      label: d.common.subscribed,
      value: `${subscription}x`,
      caption: ipo.subscription_is_provisional ? words.totalSoFar : words.total,
      color: "text-foreground",
    },
    {
      label: words.retailOdds,
      value: n === null ? d.common.na : formatAllotmentPercent(retailLottery),
      caption: n === null ? words.onceBidsComeIn : fill(d.common.oneIn, { n }),
      color: getProbabilityColor(getAllotmentProbability(retailLottery)),
    },
  ];
}

/** The listing-day gain and price, or null before the IPO lists. */
function getListingFigure(ipo: Ipo, d: Dictionary): HeadlineFigure | null {
  const gain = parseGainValue(String(ipo.listing_gain ?? ""));
  if (!ipo.listing_price || gain === null) return null;
  return {
    label: d.analysis.summary.figures.listingGain,
    value: signedPercent(Math.round(gain * 100) / 100),
    caption: fill(d.analysis.summary.figures.listedAt, { price: ipo.listing_price }),
    color: gainColor(gain),
  };
}

/** GMP as a signed listing gain, or the rupee premium when there is no percent. */
function getGmpFigure(analysis: IpoComprehensiveAnalysis, ipo: Ipo, d: Dictionary): HeadlineFigure {
  const words = d.analysis.summary.figures;
  const gmp = getGmp(analysis, ipo);
  const gmpPercent = parseEstListingPercent(gmp.estimatedListing ?? undefined);
  const gmpRupees = parseFloat(ipo.gmp_ipo_gmp);
  const hasRupees = !Number.isNaN(gmpRupees);
  const gmpSign = gmpPercent ?? (hasRupees ? gmpRupees : null);
  const premium = gmp.premium === "N/A" ? d.common.na : gmp.premium;

  return {
    label: words.gmp,
    value: gmpPercent === null ? premium : signedPercent(gmpPercent),
    caption: hasRupees ? fill(words.perShare, { amount: gmpRupees }) : words.greyMarketPremium,
    color: gainColor(gmpSign),
  };
}

/** The opening date, with how many days away it is (computed in the ISR render). */
function getOpensFigure(analysis: IpoComprehensiveAnalysis, d: Dictionary): HeadlineFigure {
  const { opening, closing } = getIssueDates(analysis);
  const date = formatShortDate(opening);
  return {
    label: d.analysis.summary.figures.opens,
    value: date === "TBA" ? d.common.tba : date,
    caption: opensCaption(opening, closing, d),
    color: opening ? "text-foreground" : "text-muted-foreground",
  };
}

function opensCaption(opening: string, closing: string, d: Dictionary): string {
  const days = daysFromToday(opening);
  if (days === 1) return d.common.tomorrow;
  if (days !== null && days > 1) return plural(d.common.inDays, days);
  if (closing) return fill(d.analysis.summary.figures.closes, { date: formatShortDate(closing) });
  return d.common.datesTba;
}

/** The cost of one lot at the top of the band. */
function getMinInvestmentFigure(analysis: IpoComprehensiveAnalysis, d: Dictionary): HeadlineFigure {
  const minInvestment = getMinInvestment(analysis);
  const lotShares = getLotShares(analysis);
  return {
    label: d.analysis.summary.minInvestment,
    value: formatMinInvestment(analysis, d.common.na),
    caption: lotShares ? fill(d.analysis.summary.shares, { count: lotShares }) : d.analysis.summary.figures.oneLot,
    color: minInvestment ? "text-foreground" : "text-muted-foreground",
  };
}
