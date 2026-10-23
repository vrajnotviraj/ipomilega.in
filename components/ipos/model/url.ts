import { defaultSortOf, VIEWS } from "@/components/ipos/model/views";
import type { Filters, QuickKey, SortBy } from "@/components/ipos/model/types";

const STATUS_PARAM: Record<Filters["status"], string | null> = { all: null, Open: "live", Upcoming: "upcoming", Closed: "closed", Listed: "past" };

/** The filters a shared link describes: ?filter=closed&board=SME&q=tata&show=held25&sort=heldGain:desc. Unknown values fall back to the defaults. */
export function filtersFromQuery(params: URLSearchParams): Filters {
  const statuses = Object.keys(STATUS_PARAM) as Filters["status"][];
  const status = statuses.find((s) => STATUS_PARAM[s] === params.get("filter")) ?? "all";
  const { sortBy, quick } = VIEWS[status];
  const [by, dir] = (params.get("sort") ?? "").split(":");
  const board = params.get("board");
  const show = params.get("show") as QuickKey;
  return {
    status,
    board: board === "Mainboard" || board === "SME" ? board : "all",
    query: params.get("q") ?? "",
    sort: sortBy.includes(by as SortBy) && (dir === "asc" || dir === "desc") ? { by: by as SortBy, dir } : defaultSortOf(status),
    quick: quick.includes(show) ? show : null,
  };
}

/** The query string for the filters, leaving out anything at its default. */
export function queryFromFilters({ status, board, query, sort, quick }: Filters): string {
  const params = new URLSearchParams();
  const fallback = defaultSortOf(status);
  if (STATUS_PARAM[status]) params.set("filter", STATUS_PARAM[status]);
  if (board !== "all") params.set("board", board);
  if (query.trim()) params.set("q", query.trim());
  if (quick) params.set("show", quick);
  if (sort.by !== fallback.by || sort.dir !== fallback.dir) params.set("sort", `${sort.by}:${sort.dir}`);
  return params.toString();
}
