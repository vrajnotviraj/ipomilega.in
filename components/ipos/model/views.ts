import { scoreBand, scoreOf } from "@/lib/ipo-score";
import { daysToStep, gmpOf, heldGainOf, listingGainOf, nameOf, sizeOf, subscribedTimesOf } from "@/components/ipos/model/cells";
import type { Filters, QuickKey, Row, Sort, SortBy } from "@/components/ipos/model/types";

const STATUS_RANK = { Open: 0, Upcoming: 1, Closed: 2, Listed: 3 };

type Metric = { label: string; kind: "text" | "number" | "date"; of: (row: Row) => number | string | null };

/** Every value a list can be sorted by. */
const METRICS: Record<SortBy, Metric> = {
  stage: { label: "Stage", kind: "date", of: (row) => STATUS_RANK[row.status] * 10_000 + Math.max(daysToStep(row, "Close") ?? 9_999, 0) },
  opening: { label: "Open date", kind: "date", of: (row) => daysToStep(row, "Open") },
  closing: { label: "Close date", kind: "date", of: (row) => daysToStep(row, "Close") },
  listing: { label: "Listing date", kind: "date", of: (row) => daysToStep(row, "List") },
  name: { label: "Name", kind: "text", of: nameOf },
  size: { label: "Issue size", kind: "number", of: sizeOf },
  subscribed: { label: "Subscribed", kind: "number", of: subscribedTimesOf },
  gmp: { label: "GMP", kind: "number", of: gmpOf },
  score: { label: "Score", kind: "number", of: (row) => scoreOf(row) || null },
  listingGain: { label: "Listing day gain", kind: "number", of: listingGainOf },
  heldGain: { label: "Held till today", kind: "number", of: heldGainOf },
};

const DIRECTION_WORDS = {
  text: { asc: "A to Z", desc: "Z to A" },
  number: { asc: "low to high", desc: "high to low" },
  date: { asc: "earliest first", desc: "latest first" },
};

/** Direction a column starts in when first clicked: biggest first for numbers, earliest or A to Z otherwise. */
const firstDirection = (by: SortBy): Sort["dir"] => (METRICS[by].kind === "number" ? "desc" : "asc");

const QUICK: Record<QuickKey, { label: string; test: (row: Row) => boolean }> = {
  gmpUp: { label: "GMP above 0", test: (row) => (gmpOf(row) ?? 0) > 0 },
  oversubscribed: { label: "Oversubscribed", test: (row) => (subscribedTimesOf(row) ?? 0) >= 1 },
  strongScore: { label: "Strong score", test: (row) => scoreBand(scoreOf(row)) === "good" },
  allotmentDue: { label: "Allotment not yet done", test: (row) => (daysToStep(row, "Allot") ?? -1) >= 0 },
  listsThisWeek: { label: "Lists this week", test: (row) => { const days = daysToStep(row, "List"); return days !== null && days >= 0 && days <= 7; } },
  heldUp: { label: "Above issue price", test: (row) => (heldGainOf(row) ?? 0) > 0 },
  heldDown: { label: "Below issue price", test: (row) => (heldGainOf(row) ?? 0) < 0 },
  held25: { label: "Up 25%+ till today", test: (row) => (heldGainOf(row) ?? 0) >= 25 },
  held50: { label: "Up 50%+ till today", test: (row) => (heldGainOf(row) ?? 0) >= 50 },
  listing25: { label: "Up 25%+ on listing day", test: (row) => (listingGainOf(row) ?? 0) >= 25 },
};

const BIDDING_QUICK: QuickKey[] = ["gmpUp", "oversubscribed", "strongScore"];

const COLUMN_SORTS: SortBy[] = ["subscribed", "gmp", "size", "score", "name"];

/** Per status tab: sort columns (first is the default), what the timeline header sorts by, and the quick filters. */
export const VIEWS: Record<Filters["status"], { sortBy: SortBy[]; stageSort: SortBy; quick: QuickKey[]; defaultDir: Sort["dir"] }> = {
  all: { sortBy: ["stage", "listing", ...COLUMN_SORTS], stageSort: "stage", quick: BIDDING_QUICK, defaultDir: "asc" },
  Open: { sortBy: ["closing", ...COLUMN_SORTS], stageSort: "closing", quick: BIDDING_QUICK, defaultDir: "asc" },
  Upcoming: { sortBy: ["opening", ...COLUMN_SORTS], stageSort: "opening", quick: ["gmpUp", "strongScore"], defaultDir: "asc" },
  Closed: { sortBy: ["listing", ...COLUMN_SORTS], stageSort: "listing", quick: ["allotmentDue", "listsThisWeek", "gmpUp", "oversubscribed"], defaultDir: "asc" },
  Listed: { sortBy: ["listing", "heldGain", "listingGain", ...COLUMN_SORTS], stageSort: "heldGain", quick: ["heldUp", "held25", "held50", "listing25", "heldDown"], defaultDir: "desc" },
};

export const defaultSortOf = (status: Filters["status"]): Sort => ({ by: VIEWS[status].sortBy[0], dir: VIEWS[status].defaultDir });

export const quickOptionsOf = (status: Filters["status"]) => VIEWS[status].quick.map((value) => ({ value, label: QUICK[value].label }));

/** One dropdown entry per sortable column and direction, labelled like "Subscribed, high to low". */
export const sortOptionsOf = (status: Filters["status"]) =>
  VIEWS[status].sortBy.flatMap((by) =>
    (["asc", "desc"] as const).map((dir) => ({
      key: `${by}:${dir}`,
      label: `${METRICS[by].label}, ${DIRECTION_WORDS[METRICS[by].kind][dir]}`,
      sort: { by, dir },
    }))
  );

/** The sort after clicking a column: flips the direction, or starts a new column in its first direction. */
export const clickSort = (current: Sort, by: SortBy): Sort =>
  current.by === by ? { by, dir: current.dir === "asc" ? "desc" : "asc" } : { by, dir: firstDirection(by) };

export const matchesQuick = (row: Row, quick: QuickKey | null) => quick === null || QUICK[quick].test(row);

/** Comparator for the sort: rows without a value last, ties by higher score. */
export function compareBy({ by, dir }: Sort) {
  const { of, kind } = METRICS[by];
  const sign = dir === "asc" ? 1 : -1;
  return (a: Row, b: Row) => {
    const [x, y] = [of(a), of(b)];
    if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
    const order = kind === "text" ? String(x).localeCompare(String(y)) : Number(x) - Number(y);
    return sign * order || scoreOf(b) - scoreOf(a);
  };
}
