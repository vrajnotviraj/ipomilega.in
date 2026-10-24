import { scoreBand, scoreOf } from "@/lib/ipo/score";
import { daysToStep, gmpOf, heldGainOf, listingGainOf, nameOf, sizeOf, subscribedTimesOf } from "@/components/ipos/model/cells";
import type { Filters, QuickKey, Row, Sort, SortBy } from "@/components/ipos/model/types";

const STATUS_RANK = { Open: 0, Upcoming: 1, Closed: 2, Listed: 3 };

type Metric = { kind: "text" | "number" | "date"; of: (row: Row) => number | string | null };

/** Every value a list can be sorted by. Its words are in ipos.json under filters.sortBy. */
const METRICS: Record<SortBy, Metric> = {
  stage: { kind: "date", of: (row) => STATUS_RANK[row.status] * 10_000 + Math.max(daysToStep(row, "Close") ?? 9_999, 0) },
  opening: { kind: "date", of: (row) => daysToStep(row, "Open") },
  closing: { kind: "date", of: (row) => daysToStep(row, "Close") },
  listing: { kind: "date", of: (row) => daysToStep(row, "List") },
  name: { kind: "text", of: nameOf },
  size: { kind: "number", of: sizeOf },
  subscribed: { kind: "number", of: subscribedTimesOf },
  gmp: { kind: "number", of: gmpOf },
  score: { kind: "number", of: (row) => scoreOf(row) || null },
  listingGain: { kind: "number", of: listingGainOf },
  heldGain: { kind: "number", of: heldGainOf },
};

/** Direction a column starts in when first clicked: biggest first for numbers, earliest or A to Z otherwise. */
const firstDirection = (by: SortBy): Sort["dir"] => (METRICS[by].kind === "number" ? "desc" : "asc");

/** Quick filter tests. Their words are in ipos.json under filters.quick. */
const QUICK: Record<QuickKey, (row: Row) => boolean> = {
  gmpUp: (row) => (gmpOf(row) ?? 0) > 0,
  oversubscribed: (row) => (subscribedTimesOf(row) ?? 0) >= 1,
  strongScore: (row) => scoreBand(scoreOf(row)) === "good",
  allotmentDue: (row) => (daysToStep(row, "Allot") ?? -1) >= 0,
  listsThisWeek: (row) => { const days = daysToStep(row, "List"); return days !== null && days >= 0 && days <= 7; },
  heldUp: (row) => (heldGainOf(row) ?? 0) > 0,
  heldDown: (row) => (heldGainOf(row) ?? 0) < 0,
  held25: (row) => (heldGainOf(row) ?? 0) >= 25,
  held50: (row) => (heldGainOf(row) ?? 0) >= 50,
  listing25: (row) => (listingGainOf(row) ?? 0) >= 25,
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

/** One dropdown entry per sortable column and direction. The control labels each from its column and kind. */
export const sortOptionsOf = (status: Filters["status"]) =>
  VIEWS[status].sortBy.flatMap((by) =>
    (["asc", "desc"] as const).map((dir) => ({ key: `${by}:${dir}`, kind: METRICS[by].kind, sort: { by, dir } }))
  );

/** The sort after clicking a column: flips the direction, or starts a new column in its first direction. */
export const clickSort = (current: Sort, by: SortBy): Sort =>
  current.by === by ? { by, dir: current.dir === "asc" ? "desc" : "asc" } : { by, dir: firstDirection(by) };

export const matchesQuick = (row: Row, quick: QuickKey | null) => quick === null || QUICK[quick](row);

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
