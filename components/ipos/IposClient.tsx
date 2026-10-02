"use client";

import { MouseEvent, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { AiDisclaimer } from "@/components/ui/AiDisclaimer";
import { BoardCounts, IpoFilters } from "@/components/ipos/IpoFilters";
import { IpoTable } from "@/components/ipos/IpoTable";
import { OpenNowStrip } from "@/components/ipos/OpenNowStrip";
import { StatusTiles } from "@/components/ipos/StatusTiles";
import { getIpoType } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";
import { PAGER } from "@/components/ui/pager";
import { isNativeClick } from "@/components/progress/ProgressLink";
import { Filters, PAGE_SIZE, Row, Status, applyFilters, ipoPagePath, matchBoardAndSearch, matchesStatus } from "@/components/ipos/rows";

const STATUS_BY_FILTER_PARAM: Record<string, Status> = { live: "Open", upcoming: "Upcoming", closed: "Closed", past: "Listed" };

/** Applies ?filter=live|upcoming|closed|past, and resets to all without it. Kept behind its own Suspense so the table still prerenders. */
function StatusFromQuery({ onStatus }: { onStatus: (status: Filters["status"]) => void }) {
  const searchParams = useSearchParams();
  // Starts as "no filter" so a first load without ?filter keeps its /ipos/<n> page instead of resetting to page 1.
  const applied = useRef<string | null>(null);
  useEffect(() => {
    const filter = searchParams.get("filter");
    if (filter === applied.current) return;
    applied.current = filter;
    onStatus(STATUS_BY_FILTER_PARAM[filter ?? ""] ?? "all");
  }, [searchParams, onStatus]);
  return null;
}

/** Rows per board tab for the current search and status. */
function countByBoard(rows: Row[], { query, status }: Filters): BoardCounts {
  const matching = matchBoardAndSearch(rows, { board: "all", query }).filter((row) => matchesStatus(row, status));
  const countOf = (board: string) => matching.filter((row) => getIpoType(row.ipo) === board).length;
  return { all: matching.length, Mainboard: countOf("Mainboard"), SME: countOf("SME") };
}

/** "Showing 1 to 10 of 42" with previous and next links. The links are real /ipos/<n> URLs for crawlers; a click swaps the page in place so filters stay, and IposClient keeps the address bar in step. */
function Pager({ page, total, onPage }: { page: number; total: number; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const first = (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, total);
  const go = (to: number) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (isNativeClick(e, ipoPagePath(to))) return;
    e.preventDefault();
    onPage(to);
  };
  const link = (to: number, rel: "prev" | "next", children: React.ReactNode) =>
    to < 1 || to > pages ? (
      <span aria-disabled="true" className={cn(PAGER, "pointer-events-none opacity-40")}>{children}</span>
    ) : (
      <a href={ipoPagePath(to)} rel={rel} onClick={go(to)} className={PAGER}>{children}</a>
    );

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-mono tabular-nums">{first}</span> to <span className="font-mono tabular-nums">{last}</span> of{" "}
        <span className="font-mono tabular-nums">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        {link(page - 1, "prev", <><ChevronLeft className="size-4" strokeWidth={2} aria-hidden="true" /> Previous</>)}
        <span className="font-mono text-sm tabular-nums text-muted-foreground">{page} / {pages}</span>
        {link(page + 1, "next", <>Next <ChevronRight className="size-4" strokeWidth={2} aria-hidden="true" /></>)}
      </div>
    </nav>
  );
}

/** The /ipos page: status tiles, the IPOs open now, then every IPO with search, board filter, sorting and pages. */
export default function IposClient({ rows, initialPage }: { rows: Row[]; initialPage: number }) {
  const [filters, setFilters] = useState<Filters>({ status: "all", board: "all", query: "", sort: "status" });
  const [page, setPage] = useState(initialPage);

  const searchedRows = useMemo(() => matchBoardAndSearch(rows, filters), [rows, filters]);
  const matchingRows = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const boardCounts = useMemo(() => countByBoard(rows, filters), [rows, filters]);
  const pageRows = matchingRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const showOpenNow = (filters.status === "all" || filters.status === "Open") && !filters.query.trim();
  const openRows = searchedRows.filter((row) => row.status === "Open");

  const updateFilters = useCallback((next: Partial<Filters>) => {
    setFilters((current) => ({ ...current, ...next }));
    setPage(1);
  }, []);
  const showStatus = useCallback((status: Filters["status"]) => updateFilters({ status }), [updateFilters]);

  // Unfiltered, the address bar follows the page on screen so a reload or share lands on it. The query is kept so ?filter does not re-apply.
  const unfiltered = filters.status === "all" && filters.board === "all" && !filters.query.trim() && filters.sort === "status";
  useEffect(() => {
    if (unfiltered) window.history.replaceState(null, "", ipoPagePath(page) + window.location.search);
  }, [unfiltered, page]);

  return (
    <div className="app-container min-h-screen pt-24 pb-16">
      <Suspense fallback={null}>
        <StatusFromQuery onStatus={showStatus} />
      </Suspense>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h1 className="type-hero text-[44px] text-balance text-foreground sm:text-[60px]">All IPOs</h1>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono tabular-nums text-foreground">{matchingRows.length}</span> of{" "}
          <span className="font-mono tabular-nums">{rows.length}</span> IPOs
        </p>
      </header>

      <StatusTiles rows={searchedRows} value={filters.status} onChange={showStatus} />

      {showOpenNow && (
        <div className="mt-6">
          <OpenNowStrip rows={openRows} />
        </div>
      )}

      <div className="mt-8 mb-4">
        <IpoFilters filters={filters} boardCounts={boardCounts} onChange={updateFilters} />
      </div>

      {matchingRows.length === 0 ? (
        <EmptyState icon={Building2} title="No IPOs found" hint="Try a different search or filter." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <IpoTable rows={pageRows} />
          <Pager page={page} total={matchingRows.length} onPage={setPage} />
        </div>
      )}

      <AiDisclaimer className="mt-6 max-w-[65ch]" />
    </div>
  );
}
