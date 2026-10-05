// Share copy for one IPO. The Share dialog and the link-preview metadata both read from here so they match.
import { daysFromToday, formatIpoDate } from "@/lib/ipo-format";

export const SITE_URL = "https://www.ipomilega.in";
export const SITE_NAME = "IPO Milega";

/** Base Open Graph fields. A function because Next mutates the `images` array it resolves. */
export const openGraphBase = () => ({
  siteName: SITE_NAME,
  locale: "en_IN",
  type: "website" as const,
  images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME} - Prospectus analysis for every Indian IPO` }],
});

/** How long is left to apply, e.g. "Today is the last date to apply." */
export function closingLine(closing: string | null | undefined, opening: string | null | undefined): string | null {
  const toOpen = daysFromToday(opening);
  if (toOpen !== null && toOpen > 0) return toOpen === 1 ? "Opens tomorrow." : `Opens ${formatIpoDate(opening)}.`;

  const toClose = daysFromToday(closing);
  if (toClose === null) return null;
  if (toClose < 0) return "Bidding has closed.";
  if (toClose === 0) return "Today is the last date to apply.";
  if (toClose === 1) return "Tomorrow is the last date to apply.";
  return `${toClose} days left to apply, closes ${formatIpoDate(closing)}.`;
}

/** "GMP ₹25" for a premium amount, "GMP +6.17%" for an estimated-listing string like "430 (6.17%)". */
function gmpLine(gmp: string | number | null | undefined): string | null {
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

/** The GMP figure alone ("+6.17%" or "₹25"), or "N/A". */
export const gmpFigure = (gmp: string | number | null | undefined): string => gmpLine(gmp)?.replace(/^GMP /, "") ?? "N/A";

/** First sentence of the text, capped at `max` characters so it stays a one-liner. */
function oneLiner(text: string | null | undefined, max = 150): string | null {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return null;

  const firstSentence = clean.split(/(?<=[.!?])\s/)[0] || clean;
  if (firstSentence.length <= max) return firstSentence;
  // The first sentence alone is too long, so cut the whole text at the last word that fits.
  return clean.slice(0, clean.lastIndexOf(" ", max) + 1).trim().replace(/[,.;:]$/, "") + "…";
}

export interface ShareFacts {
  companyName: string;
  slug: string;
  score?: number;
  gmp?: string | number | null;
  opening?: string | null;
  closing?: string | null;
  businessModel?: string | null;
}

/**
 * The message a Share tap hands to the share sheet: GMP, deadline and link.
 * Plain text on purpose: only WhatsApp renders `*bold*`; Telegram, email and notes print the asterisks.
 */
export function buildShareMessage({ companyName, slug, gmp, opening, closing }: ShareFacts): string {
  return [
    `Hey, I'm applying to the ${companyName} IPO.`,
    [gmpLine(gmp), closingLine(closing, opening)].filter(Boolean).join("\n"),
    `Full analysis → ${SITE_URL}/analysis/${slug}`,
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
    .filter((part): part is string => Boolean(part))
    // gmpLine never ends in a stop and oneLiner may not, so each part is ended as a sentence before joining.
    .map((part) => (/[.!?…]$/.test(part) ? part : `${part}.`))
    .join(" ");
}

