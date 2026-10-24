"use client";

import { Suspense, useState } from "react";
import { Building2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { QuotaTeaser } from "@/components/shareholder-quota/QuotaTeaser";
import { useT } from "@/lib/i18n/client";
import { FilterUrlSync } from "@/components/ipos/filters/FilterUrlSync";
import { IpoFilters } from "@/components/ipos/filters/IpoFilters";
import { StatusTiles } from "@/components/ipos/filters/StatusTiles";
import { OpenNowStrip } from "@/components/ipos/open-now/OpenNowStrip";
import { IpoTable } from "@/components/ipos/table/IpoTable";
import { Pager } from "@/components/ipos/table/Pager";
import { PAGE_SIZE, applyFilters, countByBoard, matchBoardAndSearch } from "@/components/ipos/model/query";
import { clickSort, defaultSortOf } from "@/components/ipos/model/views";
import type { Filters, Row, SortBy } from "@/components/ipos/model/types";

/** The /ipos page: status tiles, the IPOs open now, then every IPO with search, filters, sorting and pages. */
export default function IposClient({ rows, initialPage, quotaCount }: { rows: Row[]; initialPage: number; quotaCount: number }) {
  const w = useT().ipos.page;
  const [filters, setFilters] = useState<Filters>({ status: "all", board: "all", query: "", sort: defaultSortOf("all"), quick: null });
  const [page, setPage] = useState(initialPage);

  const searchedRows = matchBoardAndSearch(rows, filters);
  const matchingRows = applyFilters(rows, filters);
  const pageRows = matchingRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const showOpenNow = (filters.status === "all" || filters.status === "Open") && !filters.query.trim();

  const setFiltersAndRestart = (next: Filters) => {
    setFilters(next);
    setPage(1);
  };
  const updateFilters = (next: Partial<Filters>) => setFiltersAndRestart({ ...filters, ...next });
  const showStatus = (status: Filters["status"]) => updateFilters({ status, sort: defaultSortOf(status), quick: null });
  const sortBy = (by: SortBy) => updateFilters({ sort: clickSort(filters.sort, by) });

  return (
    <div className="app-container min-h-screen pt-24 pb-16">
      <Suspense fallback={null}>
        <FilterUrlSync filters={filters} page={page} onFilters={setFiltersAndRestart} />
      </Suspense>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h1 className="type-hero text-[44px] text-balance text-foreground sm:text-[60px]">{w.heading}</h1>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono tabular-nums text-foreground">{matchingRows.length}</span> {w.of}{" "}
          <span className="font-mono tabular-nums">{rows.length}</span> {w.ipos}
        </p>
      </header>

      <StatusTiles rows={searchedRows} value={filters.status} onChange={showStatus} />

      <div className="mt-4">
        <QuotaTeaser count={quotaCount} />
      </div>

      {showOpenNow && (
        <div className="mt-6">
          <OpenNowStrip rows={searchedRows.filter((row) => row.status === "Open")} />
        </div>
      )}

      <div className="mt-8 mb-4">
        <IpoFilters filters={filters} boardCounts={countByBoard(rows, filters)} onChange={updateFilters} />
      </div>

      {matchingRows.length === 0 ? (
        <EmptyState icon={Building2} title={w.noneFound} hint={w.tryAnother} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <IpoTable rows={pageRows} filters={filters} onSort={sortBy} />
          <Pager page={page} total={matchingRows.length} onPage={setPage} />
        </div>
      )}

      <Disclaimer className="mt-6 max-w-[65ch]" />
    </div>
  );
}
