import type { FinancialReport } from "@/types/ipo";
import { DAY_MS, formatIpoDate, parseGainValue, parseIpoDate } from "@/lib/ipo-format";

export interface FinancialHighlight {
  label: string;
  value: string;
  /** Signed change on the year before, as text and as a number for its colour. Null without a comparable year. */
  change: { text: string; value: number } | null;
  /** True when the figure itself is below zero (a loss or a negative margin), so it reads in loss red. */
  isLoss: boolean;
}

/** A report figure in crores; the feed writes them as strings, sometimes with commas. */
export const croresOf = (raw: string | undefined) => parseGainValue(raw) ?? 0;

/** When a period ended, from "31 Mar 2025", "Mar 2025", "2025" or "FY25" (those three read as 31 March). */
export function periodTime(period: string): number | null {
  const exact = parseIpoDate(period);
  if (exact) return exact.getTime();
  const year = periodYear(period);
  return year ? new Date(year, 2, 31).getTime() : null;
}

/** The year in "Mar 2025", "2025" or "FY25", or null. */
function periodYear(period: string): number | null {
  const fullYear = period.match(/\b(20\d{2})\b/)?.[1];
  if (fullYear) return Number(fullYear);
  const shortYear = period.match(/FY\s*'?(\d{2})\b/i)?.[1];
  if (shortYear) return 2000 + Number(shortYear);
  return null;
}

/** A short chart label: "FY25" for a year ending in March, "Sep 24" for any other period end, else the period as written. */
export function periodLabel(period: string): string {
  const time = periodTime(period);
  if (time === null) return period;
  const date = new Date(time);
  const shortYear = String(date.getFullYear()).slice(2);
  if (date.getMonth() === 2) return `FY${shortYear}`;
  return `${date.toLocaleDateString("en-GB", { month: "short" })} ${shortYear}`;
}

/** The reports oldest first, and whether every period could be dated (only then are year-on-year changes safe). */
export function sortReports(reports: FinancialReport[]): { reports: FinancialReport[]; dated: boolean } {
  const times = reports.map((report) => periodTime(report.period_ended || ""));
  if (times.some((time) => time === null)) return { reports, dated: false };

  const sorted = reports.map((report, i) => ({ report, time: times[i]! })).sort((a, b) => a.time - b.time);
  return { reports: sorted.map((entry) => entry.report), dated: true };
}

/**
 * The latest report that has one about a year before it, so a part-year stub period is never compared
 * with a full year. Falls back to the newest report with nothing to compare.
 */
function latestYearPair(reports: FinancialReport[], dated: boolean) {
  const latest = reports[reports.length - 1];
  if (!dated) return { current: latest, previous: null };

  for (let i = reports.length - 1; i > 0; i--) {
    const gapDays = (periodTime(reports[i].period_ended)! - periodTime(reports[i - 1].period_ended)!) / DAY_MS;
    if (gapDays >= 330 && gapDays <= 400) return { current: reports[i], previous: reports[i - 1] };
  }
  return { current: latest, previous: null };
}

const formatCrores = (value: number) =>
  `${value < 0 ? "-" : ""}₹${Math.abs(value).toLocaleString("en-IN", { maximumFractionDigits: Math.abs(value) >= 100 ? 0 : 2 })} Cr`;

const signed = (value: number, unit: string) => `${value > 0 ? "+" : ""}${value.toFixed(1)}${unit}`;

/** Percent change, or null when the base is zero or negative and a percentage would mislead. */
function percentChange(current: number, previous: number | null) {
  if (previous === null || previous <= 0) return null;
  const value = ((current - previous) / previous) * 100;
  return { text: signed(value, "%"), value };
}

const marginOf = (report: FinancialReport) => {
  const revenue = croresOf(report.revenue);
  return revenue > 0 ? (croresOf(report.profit_after_tax) / revenue) * 100 : null;
};

/** Revenue, profit, net margin and assets for the latest year, each with its change on the year before. */
export function getFinancialHighlights(reports: FinancialReport[], dated: boolean) {
  const { current, previous } = latestYearPair(reports, dated);
  const previousOf = (field: "revenue" | "profit_after_tax" | "assets") => (previous ? croresOf(previous[field]) : null);

  const profit = croresOf(current.profit_after_tax);
  const margin = marginOf(current);
  const previousMargin = previous ? marginOf(previous) : null;
  const marginChange = margin !== null && previousMargin !== null ? margin - previousMargin : null;

  const highlights: FinancialHighlight[] = [
    {
      label: "Revenue",
      value: formatCrores(croresOf(current.revenue)),
      change: percentChange(croresOf(current.revenue), previousOf("revenue")),
      isLoss: false,
    },
    {
      label: "Profit after tax",
      value: formatCrores(profit),
      change: percentChange(profit, previousOf("profit_after_tax")),
      isLoss: profit < 0,
    },
    {
      label: "Net margin",
      value: margin === null ? "N/A" : `${margin.toFixed(1)}%`,
      change: marginChange === null ? null : { text: signed(marginChange, " pts"), value: marginChange },
      isLoss: margin !== null && margin < 0,
    },
    {
      label: "Assets",
      value: formatCrores(croresOf(current.assets)),
      change: percentChange(croresOf(current.assets), previousOf("assets")),
      isLoss: false,
    },
  ];

  return {
    highlights,
    period: formatIpoDate(current.period_ended, true) ?? current.period_ended,
    previousPeriod: previous ? (formatIpoDate(previous.period_ended, true) ?? previous.period_ended) : null,
  };
}
