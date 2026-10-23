import { formatIssueSize, formatTimes, getPriceBand, lastListing, parseEstListingPercent, parseGainValue } from "@/lib/ipo-format";
import { scoreOf } from "@/lib/ipo-score";
import type { StepName } from "@/components/ipo-shared/lifecycle";
import type { Row } from "@/components/ipos/model/types";

export const nameOf = (row: Row) => row.ipo?.upcoming_ipo_2025 || "";

/** Whole days until a lifecycle step (0 today, negative passed), null when unknown. */
export const daysToStep = (row: Row, name: StepName) => row.steps.find((step) => step.name === name)?.days ?? null;

/** Listing date as "1 Oct", or "TBA". */
export const listingDateOf = (row: Row) => row.steps.find((step) => step.name === "List")?.date || "TBA";

/** True when the IPO has a scored analysis page to open. */
export const hasAnalysis = (row: Row) => scoreOf(row) > 0 && !!row.ipo?.slug;

/** True once bidding has closed. */
export const isListed = (row: Row) => row.status === "Listed";

export const isPastBidding = (row: Row) => row.status === "Closed" || row.status === "Listed";

/** Price band with a rupee sign, or "N/A". */
export function priceBandOf(row: Row): string {
  const band = getPriceBand(row.ipo);
  return band ? `₹${band}` : "N/A";
}

/** The issue size when the feed gave an amount, null when it gave a share count or nothing. */
function issueAmountOf(row: Row): string | null {
  const size = formatIssueSize(row.ipo?.ipo_size);
  return size && /^[\d.]/.test(size) && !/share/i.test(size) ? size : null;
}

/** Issue size with a rupee sign, or the share count, or "Size TBA". */
export function issueSizeOf(row: Row): string {
  const amount = issueAmountOf(row);
  return amount ? `₹${amount}` : formatIssueSize(row.ipo?.ipo_size) ?? "Size TBA";
}

/** Issue size as a number for sorting, null without an amount. */
export const sizeOf = (row: Row) => parseGainValue(issueAmountOf(row) ?? undefined);

/** Overall subscription in times, null when unknown. */
export const subscribedTimesOf = (row: Row) => parseGainValue(row.ipo?.total_sr);

/** Overall subscription as "12.5x", whole numbers from 100x. */
export function subscribedOf(row: Row): string {
  const times = subscribedTimesOf(row);
  return times !== null && times >= 100 ? `${Math.round(times)}x` : formatTimes(times);
}

/** Latest GMP gain %. For a listed IPO, the last quote before listing. */
export const gmpOf = (row: Row) => parseEstListingPercent(row.ipo?.gmp_price_gain);

/** Gain % on listing day. */
export const listingGainOf = (row: Row) => parseEstListingPercent(row.ipo?.listing_gain);

/** Gain % at the latest close, held since listing. */
export const heldGainOf = (row: Row) => lastListing(row.ipo).gain;
