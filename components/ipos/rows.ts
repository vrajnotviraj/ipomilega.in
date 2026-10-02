import { HomePageIpoProps } from "@/types/ipo-with-analysis";
import { daysFromToday, formatIssueSize, formatShortDate, getIpoType, parseEstListingPercent, scoreOf, type Board } from "@/lib/ipo-format";

export type Status = "Upcoming" | "Open" | "Closed" | "Listed";

export type StepName = "Open" | "Close" | "Allot" | "List";
export type StepState = "done" | "today" | "future";
/** One lifecycle date. days is whole days from today (0 today, negative passed), null when unknown. */
export type Step = { name: StepName; date: string; days: number | null; state: StepState };

/** An IPO with its status and every "today"-relative figure, computed on the server so hydration matches. */
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

/** /ipos for page 1, /ipos/<n> after. A path segment keeps each page in the ISR cache, where ?page= would not. */
export const ipoPagePath = (page: number) => (page === 1 ? "/ipos" : `/ipos/${page}`);

const nameOf = (row: Row) => row.ipo?.upcoming_ipo_2025 || "";

/** Whole days until the IPO closes (0 today, negative passed), null when unknown. */
export const daysToCloseOf = (row: Row) => row.steps[1].days;

/** Days left to close for ranking: closed or undated issues sort last. */
const closeRankOf = (row: Row) => {
  const days = daysToCloseOf(row);
  return days === null || days < 0 ? Infinity : days;
};

const STATUS_RANK: Record<Status, number> = { Open: 0, Upcoming: 1, Closed: 2, Listed: 3 };

/** True when the IPO has a scored analysis page to open. */
export const hasAnalysis = (row: Row) => scoreOf(row) > 0 && !!row.ipo?.slug;

/** Listing gain % once listed, else the GMP estimate. */
export function gainOf(row: Row): { value: number | null; isActual: boolean } {
  const listed = row.status === "Listed" ? parseEstListingPercent(row.ipo?.listing_gain) : null;
  if (listed !== null) return { value: listed, isActual: true };
  return { value: parseEstListingPercent(row.ipo?.gmp_price_gain), isActual: false };
}

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

/** future until its day, done once passed; on the day itself only the last step due today is "today". */
function stepState(day: number | null, isLastDueToday: boolean): StepState {
  if (day === null || day > 0) return "future";
  if (day < 0) return "done";
  return isLastDueToday ? "today" : "done";
}

/** Open, close, allotment and listing dates. Only the last step due today is "today"; earlier ones count as done. */
function lifecycleOf(item: HomePageIpoProps): Step[] {
  const dates = item.ipo?.ipo_dates;
  const raw: [StepName, string | undefined][] = [
    ["Open", dates?.ipo_open_date || item.ipo?.open_date],
    ["Close", dates?.ipo_close_date || item.ipo?.closing_date],
    ["Allot", dates?.basis_of_allotment],
    ["List", dates?.ipo_listing_date],
  ];
  const days = raw.map(([, date]) => daysFromToday(date));
  const todayIndex = days.lastIndexOf(0);

  return raw.map(([name, date], index) => ({
    name,
    date: formatShortDate(date),
    days: days[index],
    state: stepState(days[index], index === todayIndex),
  }));
}

/** Merges the four buckets into one list, tagging each IPO with its status and lifecycle. Call on the server. */
export function toRows(buckets: { live: HomePageIpoProps[]; upcoming: HomePageIpoProps[]; closed: HomePageIpoProps[]; past: HomePageIpoProps[] }): Row[] {
  const tag = (items: HomePageIpoProps[], status: Status): Row[] =>
    items.map((item) => ({ ...item, status, steps: lifecycleOf(item) }));
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

/** "today", "tomorrow", "in 4 days", or the date itself when it is more than a week out. */
export function whenText(days: number, date: string): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days <= 7) return `in ${days} days`;
  return `on ${date}`;
}

const STEP_VERB: Record<StepName, { next: string; today: string; past: string }> = {
  Open: { next: "Opens", today: "Opens today", past: "Opened" },
  Close: { next: "Closes", today: "Closes today", past: "Closed" },
  Allot: { next: "Allotment", today: "Allotment today", past: "Allotted" },
  List: { next: "Lists", today: "Lists today", past: "Listed" },
};

/** One line for the timeline: the step due today, else the next dated step, else when it listed. */
export function lifecycleCaption(steps: Step[]): string {
  const today = steps.find((step) => step.state === "today");
  if (today) return STEP_VERB[today.name].today;

  const next = steps.find((step) => step.state === "future" && step.days !== null);
  if (next?.days != null) return `${STEP_VERB[next.name].next} ${whenText(next.days, next.date)}`;

  const last = steps.findLast((step) => step.state === "done");
  if (last) return `${STEP_VERB[last.name].past} ${last.date}`;
  return "Dates to be announced";
}

/** Issue size with a rupee sign, unless the feed gave a share count instead of an amount. */
export function issueSizeOf(row: Row): string {
  const size = formatIssueSize(row.ipo?.ipo_size);
  if (!size) return "Size TBA";
  const isAmount = /^[\d.]/.test(size) && !/share/i.test(size);
  return isAmount ? `₹${size}` : size;
}
