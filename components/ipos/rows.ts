import { HomePageIpoProps } from "@/types/ipo-with-analysis";
import { formatIssueSize, formatTimes, getIpoType, getPriceBand, parseEstListingPercent, parseGainValue, scoreOf, type Board } from "@/lib/ipo-format";
import { ipoLifecycleSteps, type Step } from "@/components/ipo-shared/lifecycle";

export type Status = "Upcoming" | "Open" | "Closed" | "Listed";

/** An IPO with its status and lifecycle steps. Built on the server, so "today" matches between server and browser. */
export type Row = HomePageIpoProps & { status: Status; steps: Step[] };

export type SortKey = "status" | "score-desc" | "score-asc" | "closing" | "name";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "status", label: "Open and upcoming first" },
  { value: "score-desc", label: "Score, high to low" },
  { value: "score-asc", label: "Score, low to high" },
  { value: "closing", label: "Closing soonest" },
  { value: "name", label: "Name, A-Z" },
];

export type Filters = { status: Status | "all"; board: Board | "all"; query: string; sort: SortKey };

export const PAGE_SIZE = 10;

/** /ipos for page 1, /ipos/<n> after. */
export const ipoPagePath = (page: number) => (page === 1 ? "/ipos" : `/ipos/${page}`);

const nameOf = (row: Row) => row.ipo?.upcoming_ipo_2025 || "";

/** Whole days until the IPO closes (0 today, negative passed), null when unknown. */
export const daysToCloseOf = (row: Row) => row.steps.find((step) => step.name === "Close")?.days ?? null;

/** Listing date as "1 Oct", or "TBA". */
export const listingDateOf = (row: Row) => row.steps.find((step) => step.name === "List")?.date || "TBA";

/** Days left to close for ranking: closed or undated issues sort last. */
const closeRankOf = (row: Row) => {
  const days = daysToCloseOf(row);
  return days === null || days < 0 ? Infinity : days;
};

const STATUS_RANK: Record<Status, number> = { Open: 0, Upcoming: 1, Closed: 2, Listed: 3 };

/** True when the IPO has a scored analysis page to open. */
export const hasAnalysis = (row: Row) => scoreOf(row) > 0 && !!row.ipo?.slug;

/** Earlier stage first, then closing soonest, then higher score. */
function compareByStatus(a: Row, b: Row): number {
  const byStage = STATUS_RANK[a.status] - STATUS_RANK[b.status];
  if (byStage !== 0) return byStage;
  const byClose = closeRankOf(a) - closeRankOf(b) || 0; // Infinity - Infinity is NaN, treat as a tie
  if (byClose !== 0) return byClose;
  return scoreOf(b) - scoreOf(a);
}

const COMPARE: Record<SortKey, (a: Row, b: Row) => number> = {
  status: compareByStatus,
  "score-desc": (a, b) => scoreOf(b) - scoreOf(a),
  "score-asc": (a, b) => scoreOf(a) - scoreOf(b),
  name: (a, b) => nameOf(a).localeCompare(nameOf(b)),
  closing: (a, b) => closeRankOf(a) - closeRankOf(b) || 0,
};

/** Merges the four buckets into one list, tagging each IPO with its status and lifecycle. Call on the server. */
export function toRows(buckets: { live: HomePageIpoProps[]; upcoming: HomePageIpoProps[]; closed: HomePageIpoProps[]; past: HomePageIpoProps[] }): Row[] {
  const tag = (items: HomePageIpoProps[], status: Status): Row[] =>
    items.map((item) => ({ ...item, status, steps: ipoLifecycleSteps(item) }));
  return [
    ...tag(buckets.live, "Open"),
    ...tag(buckets.upcoming, "Upcoming"),
    ...tag(buckets.closed, "Closed"),
    ...tag(buckets.past, "Listed"),
  ];
}

export const matchesStatus = (row: Row, status: Filters["status"]) => status === "all" || row.status === status;

/** Rows on the chosen board whose name matches the search. */
export function matchBoardAndSearch(rows: Row[], { board, query }: Pick<Filters, "board" | "query">): Row[] {
  const search = query.trim().toLowerCase();
  return rows
    .filter((row) => board === "all" || getIpoType(row.ipo) === board)
    .filter((row) => !search || nameOf(row).toLowerCase().includes(search));
}

/** Rows matching the status, board and name search, in the chosen order. */
export function applyFilters(rows: Row[], filters: Filters): Row[] {
  return matchBoardAndSearch(rows, filters)
    .filter((row) => matchesStatus(row, filters.status))
    .sort(COMPARE[filters.sort]);
}

/** Price band with a rupee sign, or "N/A". */
export function priceBandOf(row: Row): string {
  const band = getPriceBand(row.ipo);
  return band ? `₹${band}` : "N/A";
}

/** Issue size with a rupee sign, unless the feed gave a share count instead of an amount. */
export function issueSizeOf(row: Row): string {
  const size = formatIssueSize(row.ipo?.ipo_size);
  if (!size) return "Size TBA";
  const isAmount = /^[\d.]/.test(size) && !/share/i.test(size);
  return isAmount ? `₹${size}` : size;
}

/** Overall subscription as "12.5x", whole numbers from 100x. */
export function subscribedOf(row: Row): string {
  const times = parseGainValue(row.ipo?.total_sr);
  return times !== null && times >= 100 ? `${Math.round(times)}x` : formatTimes(times);
}

/** Latest GMP gain %. For a listed IPO, the last quote before listing. */
export const gmpOf = (row: Row) => parseEstListingPercent(row.ipo?.gmp_price_gain);

/** True once bidding has closed. */
export const isPastBidding = (row: Row) => row.status === "Closed" || row.status === "Listed";
