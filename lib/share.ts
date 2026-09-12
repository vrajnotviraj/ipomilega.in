// Share copy for one IPO analysis.
//
// Used in two places that must agree: the client-side "Share" dialog (what a person pastes into
// WhatsApp) and `generateMetadata` on the analysis page (what WhatsApp/X/Slack render when that
// link is unfurled). Keeping the wording in one module means the preview card and the pasted
// message never drift apart.
//
// Everything here is pure and timezone-explicit, so it produces the same string on the server
// (where the page is ISR-rendered) as in the browser.

export const SITE_URL = "https://ipomilega.com";
export const SITE_NAME = "IPO Milega";

// Every date in an Indian IPO calendar is an IST date. The server may run anywhere, so "today"
// is always resolved against Asia/Kolkata rather than the host clock's local day.
const IST = "Asia/Kolkata";

/** The YYYY-MM-DD an instant falls on in India. */
function istDayKey(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: IST });
}

/** Whole days from `now` to `dateStr`, counted in IST calendar days. Null if unparseable. */
export function daysUntil(dateStr: string | null | undefined, now: Date = new Date()): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;

  const toUtcMidnight = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };

  const diff = toUtcMidnight(istDayKey(target)) - toUtcMidnight(istDayKey(now));
  return Math.round(diff / 86_400_000);
}

export function formatDay(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: IST });
}

/**
 * The urgency line — the whole reason someone forwards one of these links.
 * "Today is the last date to apply" beats any amount of analysis prose.
 */
export function closingLine(
  closing: string | null | undefined,
  opening: string | null | undefined,
  now: Date = new Date()
): string | null {
  const toClose = daysUntil(closing, now);
  const toOpen = daysUntil(opening, now);

  if (toOpen !== null && toOpen > 0) {
    return toOpen === 1 ? "Opens tomorrow." : `Opens ${formatDay(opening)}.`;
  }
  if (toClose === null) return null;
  if (toClose < 0) return "Bidding has closed.";
  if (toClose === 0) return "Today is the last date to apply.";
  if (toClose === 1) return "Tomorrow is the last date to apply.";
  return `${toClose} days left to apply — closes ${formatDay(closing)}.`;
}

/**
 * "GMP ₹329 (29.53%)".
 *
 * `gmp_price_gain` already arrives as an amount with the gain in brackets, so the percentage is
 * only appended when the stored value doesn't carry one.
 */
export function gmpLine(
  gmp: string | number | null | undefined,
  gainPercent?: string | number | null
): string | null {
  const raw = gmp === null || gmp === undefined ? "" : String(gmp).trim();
  if (!raw || ["n/a", "na", "tba", "tbd", "-", "0"].includes(raw.toLowerCase())) return null;

  const amount = raw.startsWith("₹") ? raw : `₹${raw}`;
  if (raw.includes("%")) return `GMP ${amount}`;

  const pct = gainPercent === null || gainPercent === undefined ? "" : String(gainPercent).trim();
  if (!pct || pct === "0") return `GMP ${amount}`;

  const signed = pct.startsWith("-") || pct.startsWith("+") ? pct : `+${pct}`;
  return `GMP ${amount} (${signed}${pct.endsWith("%") ? "" : "%"})`;
}

/** First sentence of the business model, capped so it stays a one-liner in a preview card. */
export function oneLiner(text: string | null | undefined, max = 150): string | null {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return null;

  const firstSentence = clean.split(/(?<=[.!?])\s/)[0] || clean;
  const candidate = firstSentence.length <= max ? firstSentence : clean;
  if (candidate.length <= max) return candidate.replace(/\.$/, "");

  return candidate.slice(0, candidate.lastIndexOf(" ", max) + 1).trim().replace(/[,.;:]$/, "") + "…";
}

export function analysisUrl(slug: string): string {
  return `${SITE_URL}/analysis/${slug}`;
}

export interface ShareFacts {
  companyName: string;
  slug: string;
  score?: number;
  gmp?: string | number | null;
  gainPercent?: string | number | null;
  opening?: string | null;
  closing?: string | null;
  businessModel?: string | null;
  /** Overridable so the menu can share the URL actually in the address bar. */
  url?: string;
  now?: Date;
  // The issue facts. All optional: a row with no value is dropped rather than
  // printed as "N/A", so a half-filled analysis still shares cleanly.
  ipoType?: string | null;
  status?: string | null;
  priceBand?: string | null;
  /** Shares per lot -- what a retail applicant actually bids for. */
  lotShares?: number | null;
  minInvestment?: number | null;
  issueSize?: string | null;
  allotment?: string | null;
  listing?: string | null;
}

const PLACEHOLDERS = ["n/a", "na", "tba", "tbd", "-"];

/** Trims a stored field, treating the scrapers' placeholders as absent. */
function value(raw: string | number | null | undefined): string | null {
  const text = raw === null || raw === undefined ? "" : String(raw).trim();
  if (!text || PLACEHOLDERS.includes(text.toLowerCase())) return null;
  return text;
}

/** Price band and issue size are stored with or without the rupee sign. */
function rupee(text: string): string {
  return /^\d/.test(text) ? `₹${text}` : text;
}

/** "15 Sept 2026" -- the long form, since a forwarded message outlives the week. */
export function formatFullDay(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return value(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: IST });
}

/**
 * The message that goes out when someone shares an IPO.
 *
 * It is the issue's own details -- what a friend needs in order to decide
 * whether to apply -- written in the site's voice, never the sharer's. There is
 * deliberately no editable draft and nothing to choose: tapping Share hands
 * this exact text to the system share sheet, and the only decision left is who
 * receives it.
 *
 * Plain text, no markup: it has to read the same in WhatsApp, Telegram, email
 * and notes, and only WhatsApp would render `*bold*` rather than print it.
 */
export function buildShareMessage(facts: ShareFacts): string {
  const {
    companyName, slug, score, gmp, gainPercent, opening, closing, url, now,
    ipoType, status, priceBand, lotShares, minInvestment, issueSize, allotment, listing,
  } = facts;

  const heading = [value(status), value(ipoType)].filter(Boolean).join(" · ");

  const band = value(priceBand);
  const open = formatFullDay(opening);
  const close = formatFullDay(closing);

  const details = [
    band ? `Price band: ${rupee(band)}` : null,
    lotShares ? `Lot size: ${lotShares} shares` : null,
    minInvestment ? `Min investment: ₹${Math.round(minInvestment).toLocaleString("en-IN")}` : null,
    value(issueSize) ? `Issue size: ${rupee(value(issueSize)!)}` : null,
    open || close ? `Dates: ${[open, close].filter(Boolean).join(" — ")}` : null,
    formatFullDay(allotment) ? `Allotment: ${formatFullDay(allotment)}` : null,
    formatFullDay(listing) ? `Listing: ${formatFullDay(listing)}` : null,
    gmpLine(gmp, gainPercent),
    score !== undefined && score > 0 ? `${SITE_NAME} score: ${score.toFixed(1)}/10` : null,
  ].filter(Boolean);

  // Blocks are separated by a blank line; the details keep their lines together.
  const blocks = [
    `${companyName} IPO${heading ? ` — ${heading}` : ""}`,
    details.join("\n"),
    closingLine(closing, opening, now),
    `Full analysis → ${url || analysisUrl(slug)}`,
  ].filter((b) => !!b);

  return blocks.join("\n\n");
}

/** The single-paragraph version used for og:description and twitter:description. */
export function buildShareDescription(facts: ShareFacts): string {
  const { companyName, score, gmp, gainPercent, opening, closing, businessModel, now } = facts;

  const parts = [
    gmpLine(gmp, gainPercent),
    closingLine(closing, opening, now),
    oneLiner(businessModel, 110),
    score !== undefined && score > 0 ? `Scored ${score.toFixed(1)}/10 from the RHP.` : null,
    `Read the full ${companyName} IPO analysis on ${SITE_NAME}.`,
  ].filter(Boolean);

  return parts.join(" ");
}
