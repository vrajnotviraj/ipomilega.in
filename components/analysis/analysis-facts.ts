import type { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis";
import type { Ipo } from "@/types/ipo";
import type { Dictionary } from "@/messages";
import {
  ALLOTMENT_CATEGORIES,
  allotmentOddsN,
  getAllotmentRatio,
  parseEstListingPercent,
  formatRupees,
  signedPercent,
} from "@/lib/ipo/format";
import { gmpFigure, type ShareFacts } from "@/lib/seo/share";

type SectionKey = "overview" | "timing" | "financials" | "risk" | "performance" | "flexibility";
type SectionNames = Dictionary["analysis"]["sections"];

export interface SectionTab {
  key: SectionKey;
  label: string;
  score?: number;
}

/** The page's sections in reading order, leaving out any the analysis has no data for. Timing leads: "apply now?" is the first question. */
export function getSectionTabs(analysis: IpoComprehensiveAnalysis, names: SectionNames): SectionTab[] {
  const sections = [
    { key: "timing", label: names.timing, data: analysis.time },
    { key: "financials", label: names.financials, data: analysis.fundamentals },
    { key: "risk", label: names.risk, data: analysis.risk_meter },
    { key: "performance", label: names.performance, data: analysis.performance },
    { key: "flexibility", label: names.flexibility, data: analysis.flexibility },
  ] as const;

  const scoredTabs = sections
    .filter((section) => section.data)
    .map(({ key, label, data }) => ({ key, label, score: data.score ?? 0 }));

  return [{ key: "overview", label: names.overview }, ...scoredTabs];
}

/** The five section scores in the fixed order the radar draws them. */
export function getScoreAxes(analysis: IpoComprehensiveAnalysis, names: SectionNames) {
  return [
    { label: names.financials, score: analysis.fundamentals?.score ?? 0 },
    { label: names.performance, score: analysis.performance?.score ?? 0 },
    { label: names.flexibility, score: analysis.flexibility?.score ?? 0 },
    { label: names.timing, score: analysis.time?.score ?? 0 },
    { label: names.risk, score: analysis.risk_meter?.score ?? 0 },
  ];
}

/** The four issue dates as strings, empty when missing. */
export function getIssueDates(analysis: IpoComprehensiveAnalysis) {
  return {
    opening: analysis.time?.issue_dates?.opening || "",
    closing: analysis.time?.issue_dates?.closing || "",
    allotment: analysis.time?.allotment_timeline?.date || "",
    listing: analysis.time?.listing_details?.expected_date || "",
  };
}

/** Cost of one lot at the cut-off (the last number in the band). */
export function getMinInvestment(analysis: IpoComprehensiveAnalysis): number | null {
  const bandNumbers = analysis.ipo_details?.price_band?.replace(/,/g, "").match(/\d+(?:\.\d+)?/g);
  const cutOffPrice = bandNumbers?.length ? parseFloat(bandNumbers[bandNumbers.length - 1]) : null;
  const lotShares = getLotShares(analysis);
  return cutOffPrice && lotShares ? cutOffPrice * lotShares : null;
}

/** The cost of one lot as "₹1,49,760", or the N/A word. */
export const formatMinInvestment = (analysis: IpoComprehensiveAnalysis, na: string) => {
  const value = getMinInvestment(analysis);
  return value ? formatRupees(value) : na;
};

/** Shares per lot, from ipo_details.shares or else lot_size. */
export function getLotShares(analysis: IpoComprehensiveAnalysis): number | undefined {
  return analysis.ipo_details?.shares || analysis.ipo_details?.lot_size;
}

/** The estimated listing ("360 (31.25%)") when there is one, and the premium shown in the GMP figure. */
export function getGmp(analysis: IpoComprehensiveAnalysis, ipo: Ipo) {
  const raw = ipo.gmp_price_gain || analysis.gmp_price_gain || "";
  const estimatedListing = raw && !["N/A", "TBD", "TBA"].includes(raw) ? raw : null;

  const premium = parseFloat(ipo.gmp_ipo_gmp);
  if (isNaN(premium)) {
    return { estimatedListing, premium: gmpFigure(estimatedListing) };
  }

  const percent = parseEstListingPercent(raw);
  const percentLabel = percent == null ? "" : ` (${signedPercent(percent)})`;
  return { estimatedListing, premium: `₹${ipo.gmp_ipo_gmp}${percentLabel}` };
}

/** Whether any investor category has allotment odds yet. */
export function hasAllotmentOdds(ipo: Ipo): boolean {
  return ALLOTMENT_CATEGORIES.some((category) => allotmentOddsN(getAllotmentRatio(ipo, category).lottery) !== null);
}

/** What the company does, from the business model or else its market position. */
export function getAboutLine(analysis: IpoComprehensiveAnalysis): string | null {
  return analysis.fundamentals?.business_model?.trim() || analysis.fundamentals?.market_position?.trim() || null;
}

/**
 * The first sentence of the analysis summary, as the page's one-line verdict.
 * ponytail: splits at ". " before a capital, so "Ltd. Board" cuts early; lib/seo/share has a oneLiner to export if that shows up.
 */
export function getVerdict(analysis: IpoComprehensiveAnalysis): string | null {
  const summary = (analysis.fundamentals?.summary || "").replace(/\s+/g, " ").trim();
  if (!summary) return null;
  return summary.split(/(?<=[.!?])\s+(?=[A-Z])/)[0];
}

function firstNumber(value: string): number {
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

/** QIB, NII and retail quota in percent, from the analysis or else the scraped IPO details. */
export function getQuotaSplit(analysis: IpoComprehensiveAnalysis, ipo: Ipo, retail: string) {
  const allocation = analysis.ipo_details?.allocation_details;
  return [
    { name: "QIB", value: allocation?.qib || firstNumber(ipo.ipo_details?.qib_quota || "50"), color: "var(--chart-1)" },
    { name: "NII", value: allocation?.nii || firstNumber(ipo.ipo_details?.nii_quota || "15"), color: "var(--chart-5)" },
    { name: retail, value: allocation?.retail || firstNumber(ipo.ipo_details?.retail_quota || "35"), color: "var(--chart-3)" },
  ];
}

/** The facts a Share tap sends, taken from what the page shows. */
export function getShareFacts(analysis: IpoComprehensiveAnalysis, ipo: Ipo): ShareFacts {
  const { opening, closing } = getIssueDates(analysis);
  return {
    companyName: analysis.company_name,
    slug: analysis.slug || ipo.slug || "",
    gmp: getGmp(analysis, ipo).estimatedListing,
    opening,
    closing,
    businessModel: analysis.fundamentals?.business_model || analysis.fundamentals?.summary || null,
  };
}

export const nonBlank = (items: string[] | undefined) => (items ?? []).filter((item) => item.trim() !== "");
