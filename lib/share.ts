// Share copy for one IPO: the Share dialog message and the link-preview metadata both read from here,
// so the pasted message and the unfurled card say the same thing.
import type { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis";

export const SITE_URL = "https://ipomilega.in";
export const SITE_NAME = "IPO Milega";

// A function, not a constant: Next mutates the `images` it resolves, so a shared array came back
// empty on every page after the first.
export const openGraphBase = () => ({
  siteName: SITE_NAME,
  locale: "en_IN",
  type: "website" as const,
  images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME} - Prospectus analysis for every Indian IPO` }],
});

// IPO calendar dates are IST dates, and the server may run in any timezone.
const IST = "Asia/Kolkata";

/** Whole IST calendar days from today to `dateStr`, or null if it does not parse. */
function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;

  const istMidnight = (d: Date) => Date.parse(d.toLocaleDateString("en-CA", { timeZone: IST }));
  return Math.round((istMidnight(target) - istMidnight(new Date())) / 86_400_000);
}

export function formatDay(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: IST });
}

/** How long is left to apply, e.g. "Today is the last date to apply." */
export function closingLine(closing: string | null | undefined, opening: string | null | undefined): string | null {
  const toOpen = daysUntil(opening);
  if (toOpen !== null && toOpen > 0) return toOpen === 1 ? "Opens tomorrow." : `Opens ${formatDay(opening)}.`;

  const toClose = daysUntil(closing);
  if (toClose === null) return null;
  if (toClose < 0) return "Bidding has closed.";
  if (toClose === 0) return "Today is the last date to apply.";
  if (toClose === 1) return "Tomorrow is the last date to apply.";
  return `${toClose} days left to apply — closes ${formatDay(closing)}.`;
}

/** "GMP ₹25" for a premium amount, "GMP +6.17%" for an estimated-listing string like "430 (6.17%)". */
export function gmpLine(gmp: string | number | null | undefined): string | null {
  const raw = gmp == null ? "" : String(gmp).trim();
  if (!raw || ["n/a", "na", "tba", "tbd", "-", "0"].includes(raw.toLowerCase())) return null;

  // In "430 (6.17%)" the amount is the estimated listing price, not the premium, so show only the gain.
  const estListing = raw.match(/^₹?\s*[\d,.]+\s*\(\s*([+-]?[\d.]+)\s*%\s*\)$/);
  if (estListing) {
    const pct = estListing[1];
    return `GMP ${/^[+-]/.test(pct) ? pct : `+${pct}`}%`;
  }

  return `GMP ${raw.startsWith("₹") ? raw : `₹${raw}`}`;
}

/** First sentence of the text, capped at `max` characters so it stays a one-liner. */
function oneLiner(text: string | null | undefined, max = 150): string | null {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return null;

  const firstSentence = clean.split(/(?<=[.!?])\s/)[0] || clean;
  const candidate = firstSentence.length <= max ? firstSentence : clean;
  if (candidate.length <= max) return candidate.replace(/\.$/, "");

  return candidate.slice(0, candidate.lastIndexOf(" ", max) + 1).trim().replace(/[,.;:]$/, "") + "…";
}

export interface ShareFacts {
  companyName: string;
  slug: string;
  score?: number;
  gmp?: string | number | null;
  opening?: string | null;
  closing?: string | null;
  businessModel?: string | null;
  /** The URL in the address bar, when the page knows it. */
  url?: string;
}

/**
 * The message a Share tap hands to the share sheet: GMP and deadline, the link.
 * Plain text on purpose: only WhatsApp renders `*bold*`; Telegram, email and notes print the asterisks.
 */
export function buildShareMessage({ companyName, slug, gmp, opening, closing, url }: ShareFacts): string {
  return [
    `Hey, I'm applying to the ${companyName} IPO.`,
    [gmpLine(gmp), closingLine(closing, opening)].filter(Boolean).join("\n"),
    `Full analysis → ${url || `${SITE_URL}/analysis/${slug}`}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** The one-paragraph version for og:description and twitter:description. */
export function buildShareDescription({ companyName, score, gmp, opening, closing, businessModel }: ShareFacts): string {
  return [
    gmpLine(gmp),
    closingLine(closing, opening),
    oneLiner(businessModel, 110),
    score !== undefined && score > 0 ? `Scored ${score.toFixed(1)}/10 from the RHP.` : null,
    `Read the full ${companyName} IPO analysis on ${SITE_NAME}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

/** The overall score: the mean of the five section scores, the same way the page body computes it. */
export function overallScoreOf(
  analysis: Pick<IpoComprehensiveAnalysis, "fundamentals" | "risk_meter" | "performance" | "flexibility" | "time">
): number {
  const sections = [analysis.fundamentals, analysis.risk_meter, analysis.performance, analysis.flexibility, analysis.time];
  return sections.reduce((sum, section) => sum + (section?.score ?? 0), 0) / sections.length;
}
