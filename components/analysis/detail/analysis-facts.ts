import type { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis";
import type { Ipo } from "@/types/ipo";
import {
  ALLOTMENT_CATEGORIES,
  formatAllotmentOdds,
  getAllotmentRatio,
  parseEstListingPercent,
  signedPercent,
} from "@/lib/ipo-format";
import { gmpFigure, type ShareFacts } from "@/lib/seo/share";

export type SectionKey = "overview" | "timing" | "financials" | "risk" | "performance" | "flexibility";

export interface SectionTab {
  key: SectionKey;
  label: string;
  score?: number;
}

/** The page's sections in reading order, leaving out any the analysis has no data for. Timing leads: "apply now?" is the first question. */
export function getSectionTabs(analysis: IpoComprehensiveAnalysis): SectionTab[] {
  const sections = [
    { key: "timing", label: "Timing", data: analysis.time },
    { key: "financials", label: "Financials", data: analysis.fundamentals },
    { key: "risk", label: "Risk", data: analysis.risk_meter },
    { key: "performance", label: "Performance", data: analysis.performance },
    { key: "flexibility", label: "Flexibility", data: analysis.flexibility },
  ] as const;

  const scoredTabs = sections
    .filter((section) => section.data)
    .map(({ key, label, data }) => ({ key, label, score: data.score ?? 0 }));

  return [{ key: "overview", label: "Overview" }, ...scoredTabs];
}

/** The five section scores in the fixed order the radar draws them. */
export function getScoreAxes(analysis: IpoComprehensiveAnalysis) {
  return [
    { label: "Financials", score: analysis.fundamentals?.score ?? 0 },
    { label: "Performance", score: analysis.performance?.score ?? 0 },
    { label: "Flexibility", score: analysis.flexibility?.score ?? 0 },
    { label: "Timing", score: analysis.time?.score ?? 0 },
    { label: "Risk", score: analysis.risk_meter?.score ?? 0 },
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

/** Shares per lot, from ipo_details.shares or else lot_size. */
export function getLotShares(analysis: IpoComprehensiveAnalysis): number | undefined {
  return analysis.ipo_details?.shares || analysis.ipo_details?.lot_size;
}

/** The estimated listing ("360 (31.25%)") when there is one, and the premium shown in the GMP figure. */
export function getGmp(analysis: IpoComprehensiveAnalysis, ipo: Ipo) {
  const raw = analysis.gmp_price_gain || ipo.gmp_price_gain || "";
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
  return ALLOTMENT_CATEGORIES.some((category) => formatAllotmentOdds(getAllotmentRatio(ipo, category).lottery) !== "N/A");
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
export function getQuotaSplit(analysis: IpoComprehensiveAnalysis, ipo: Ipo) {
  const allocation = analysis.ipo_details?.allocation_details;
  return [
    { name: "QIB", value: allocation?.qib || firstNumber(ipo.ipo_details?.qib_quota || "50"), color: "var(--chart-1)" },
    { name: "NII", value: allocation?.nii || firstNumber(ipo.ipo_details?.nii_quota || "15"), color: "var(--chart-5)" },
    // Marigold marks the investor's own slice, the only marigold in that card.
    { name: "Retail", value: allocation?.retail || firstNumber(ipo.ipo_details?.retail_quota || "35"), color: "var(--chart-3)" },
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
