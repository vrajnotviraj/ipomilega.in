// Share copy for one IPO. The Share dialog and the link-preview metadata both read from here so they match.
import { daysFromToday, formatIpoDate } from "@/lib/ipo/format";
import { fill, languageAlternates, type Locale, localePath, LOCALES, OG_LOCALE } from "@/lib/i18n/locales";
import type { Dictionary } from "@/messages";

export const SITE_URL = "https://www.ipomilega.in";
export const SITE_NAME = "IPO Milega";

/** Base Open Graph fields. A function because Next mutates the `images` array it resolves. */
export const openGraphBase = (lang: Locale) => ({
  siteName: SITE_NAME,
  locale: OG_LOCALE[lang],
  type: "website" as const,
  images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME} - Prospectus analysis for every Indian IPO` }],
});

/** Canonical and hreflang set for a page, listing only the languages it exists in. */
export const alternatesFor = (lang: Locale, path: string, locales: readonly Locale[] = LOCALES) => ({
  canonical: localePath(lang, path),
  languages: languageAlternates(path, SITE_URL, locales),
});

/** Keeps the layout's " | IPO Milega" suffix only while the whole title fits Google's ~60 characters; otherwise the suffix would push the page's own words off the end. */
export const titleFor = (title: string) => (title.length + " | IPO Milega".length > 60 ? { absolute: title } : title);

/** The share sentences of one language: messages/<lang>/analysis.json, "share". */
export type ShareWords = Dictionary["analysis"]["share"];

/** How long is left to apply, e.g. "Today is the last date to apply." */
export function closingLine(closing: string | null | undefined, opening: string | null | undefined, words: ShareWords): string | null {
  const toOpen = daysFromToday(opening);
  if (toOpen !== null && toOpen > 0) return toOpen === 1 ? words.opensTomorrow : fill(words.opensOn, { date: formatIpoDate(opening) ?? "" });

  const toClose = daysFromToday(closing);
  if (toClose === null) return null;
  if (toClose < 0) return words.closed;
  if (toClose === 0) return words.lastDayToday;
  if (toClose === 1) return words.lastDayTomorrow;
  return fill(words.daysLeft, { count: toClose, date: formatIpoDate(closing) ?? "" });
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
export function buildShareMessage({ companyName, slug, gmp, opening, closing }: ShareFacts, words: ShareWords, lang: Locale): string {
  return [
    fill(words.applying, { name: companyName }),
    [gmpLine(gmp), closingLine(closing, opening, words)].filter(Boolean).join("\n"),
    fill(words.fullAnalysis, { url: `${SITE_URL}${localePath(lang, `/analysis/${slug}`)}` }),
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** The one-paragraph version for the meta, og and twitter descriptions. Google cuts at ~155 characters, so the business blurb is the first thing dropped. */
export function buildShareDescription({ companyName, score, gmp, opening, closing, businessModel }: ShareFacts, words: ShareWords): string {
  const build = (blurb: string | null) =>
    [
      gmpLine(gmp),
      closingLine(closing, opening, words),
      blurb,
      score !== undefined && score > 0 ? fill(words.scored, { score: score.toFixed(1) }) : null,
      fill(words.readFull, { name: companyName, site: SITE_NAME }),
    ]
      .filter((part): part is string => Boolean(part))
      // gmpLine never ends in a stop and oneLiner may not, so each part is ended as a sentence before joining. Hindi ends in a danda.
      .map((part) => (/[.!?…।]$/.test(part) ? part : `${part}.`))
      .join(" ");

  const full = build(oneLiner(businessModel, 110));
  return full.length <= 160 ? full : build(null);
}
