import { getIpoType } from "@/lib/ipo/format";
import { ipoLifecycleSteps } from "@/components/ipo-shared/lifecycle";
import type { HomePageIpoProps } from "@/types/ipo-with-analysis";
import { nameOf } from "@/components/ipos/model/cells";
import { compareBy, matchesQuick } from "@/components/ipos/model/views";
import type { BoardCounts, Filters, Row, Status } from "@/components/ipos/model/types";

export const PAGE_SIZE = 10;

/** /ipos for page 1, /ipos/<n> after. */
export const ipoPagePath = (page: number) => (page === 1 ? "/ipos" : `/ipos/${page}`);

/** Merges the four buckets into one list, tagging each IPO with its status and lifecycle. Call on the server. */
export function toRows(buckets: { live: HomePageIpoProps[]; upcoming: HomePageIpoProps[]; closed: HomePageIpoProps[]; past: HomePageIpoProps[] }): Row[] {
  const tag = (items: HomePageIpoProps[], status: Status): Row[] =>
    items.map((item) => ({ ...item, status, steps: ipoLifecycleSteps(item) }));
  return [...tag(buckets.live, "Open"), ...tag(buckets.upcoming, "Upcoming"), ...tag(buckets.closed, "Closed"), ...tag(buckets.past, "Listed")];
}

export const matchesStatus = (row: Row, status: Filters["status"]) => status === "all" || row.status === status;

/** Rows on the chosen board whose name matches the search. */
export function matchBoardAndSearch(rows: Row[], { board, query }: Pick<Filters, "board" | "query">): Row[] {
  const search = query.trim().toLowerCase();
  return rows
    .filter((row) => board === "all" || getIpoType(row.ipo) === board)
    .filter((row) => !search || nameOf(row).toLowerCase().includes(search));
}

/** Rows matching the status, board, search and quick filter, in the chosen order. */
export function applyFilters(rows: Row[], filters: Filters): Row[] {
  return matchBoardAndSearch(rows, filters)
    .filter((row) => matchesStatus(row, filters.status) && matchesQuick(row, filters.quick))
    .sort(compareBy(filters.sort));
}

/** Rows per board tab for the current search, status and quick filter. */
export function countByBoard(rows: Row[], { query, status, quick }: Filters): BoardCounts {
  const matching = matchBoardAndSearch(rows, { board: "all", query }).filter((row) => matchesStatus(row, status) && matchesQuick(row, quick));
  const countOf = (board: string) => matching.filter((row) => getIpoType(row.ipo) === board).length;
  return { all: matching.length, Mainboard: countOf("Mainboard"), SME: countOf("SME") };
}
