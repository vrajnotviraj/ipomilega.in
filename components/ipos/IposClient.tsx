"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Building2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { AiDisclaimer } from "@/components/ui/AiDisclaimer";
import { BoardCounts, IpoFilters } from "@/components/ipos/IpoFilters";
import { IpoTable } from "@/components/ipos/IpoTable";
import { OpenNowStrip } from "@/components/ipos/OpenNowStrip";
import { StatusTiles } from "@/components/ipos/StatusTiles";
import { getIpoType } from "@/lib/ipo-format";
import { Filters, Row, Status, applyFilters, matchBoardAndSearch } from "@/components/ipos/rows";

const PAGE_SIZE = 10;
const STATUS_BY_FILTER_PARAM: Record<string, Status> = { live: "Open", upcoming: "Upcoming", closed: "Closed", past: "Listed" };

/** Applies ?filter=live|upcoming|closed|past, and resets to all without it. Kept behind its own Suspense so the table still prerenders. */
function StatusFromQuery({ onStatus }: { onStatus: (status: Filters["status"]) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    onStatus(STATUS_BY_FILTER_PARAM[searchParams.get("filter") ?? ""] ?? "all");
  }, [searchParams, onStatus]);
  return null;
}

/** Rows per board tab for the current search and status. */
function countByBoard(rows: Row[], { query, status }: Filters): BoardCounts {
  const matching = matchBoardAndSearch(rows, { board: "all", query }).filter((row) => status === "all" || row.status === status);
  const countOf = (board: string) => matching.filter((row) => getIpoType(row.ipo) === board).length;
  return { all: matching.length, Mainboard: countOf("Mainboard"), SME: countOf("SME") };
}

/** The /ipos page: status tiles, the IPOs open now, then every IPO with search, board filter, sorting and pages. */
export default function IposClient({ rows }: { rows: Row[] }) {
  const [filters, setFilters] = useState<Filters>({ status: "all", board: "all", query: "", sort: "status" });
  const [page, setPage] = useState(1);

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
          <Pagination page={page} pageSize={PAGE_SIZE} total={matchingRows.length} onPageChange={setPage} />
        </div>
      )}

      <AiDisclaimer className="mt-6 max-w-[65ch]" />
    </div>
  );
}
