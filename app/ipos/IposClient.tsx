"use client";
import { useEffect, useState, useMemo, useRef, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { HomePageIpoProps } from "../types/homepage";
import { useProgressRouter } from "@/components/Progressbar/useProgressRouter";
import { useSearchParams } from "next/navigation";
import { getIpoType, getPriceBand, getRiskTextColor, formatShortDate } from "@/components/Home/ipoFormat";
import { IpoTitleLink } from "@/components/Home/IpoTitleLink";

type Status = "Upcoming" | "Open" | "Listed";
type Row = HomePageIpoProps & { status: Status };

const STATUS_STYLES: Record<Status, string> = {
  Upcoming: "bg-secondary text-foreground/70",
  Open: "bg-score-mid/15 text-score-mid",
  Listed: "bg-muted text-muted-foreground",
};

function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

export type IposClientProps = {
  upcoming: HomePageIpoProps[];
  live: HomePageIpoProps[];
  past: HomePageIpoProps[];
};

/**
 * Applies the ?filter= deep link. Kept in its own component behind <Suspense> because
 * `useSearchParams` bails its nearest boundary out of server rendering -- inlining it in the
 * table component would mean the rows never appear in the prerendered HTML.
 */
const FilterFromQuery = ({ onFilter }: { onFilter: (status: Status) => void }) => {
  const searchParams = useSearchParams();
  const handler = useRef(onFilter);
  handler.current = onFilter;

  useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam === "live") handler.current("Open");
    else if (filterParam === "upcoming") handler.current("Upcoming");
    else if (filterParam === "past") handler.current("Listed");
  }, [searchParams]);

  return null;
};

function IPOsContent({ upcoming, live, past }: IposClientProps) {
  const router = useProgressRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "Mainboard" | "SME">("all");
  const [sortBy, setSortBy] = useState<"score-desc" | "score-asc" | "closing" | "name">("score-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const allRows: Row[] = useMemo(() => [
    ...live.map((item) => ({ ...item, status: "Open" as const })),
    ...upcoming.map((item) => ({ ...item, status: "Upcoming" as const })),
    ...past.map((item) => ({ ...item, status: "Listed" as const })),
  ], [live, upcoming, past]);

  const filteredRows = useMemo(() => {
    let rows = allRows;

    if (statusFilter !== "all") {
      rows = rows.filter((r) => r.status === statusFilter);
    }
    if (typeFilter !== "all") {
      rows = rows.filter((r) => getIpoType(r.ipo) === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      rows = rows.filter((r) => r.ipo?.upcoming_ipo_2025?.toLowerCase().includes(q));
    }

    const sorted = [...rows];
    switch (sortBy) {
      case "score-desc":
        sorted.sort((a, b) => (b.analysis?.risk_meter?.score || 0) - (a.analysis?.risk_meter?.score || 0));
        break;
      case "score-asc":
        sorted.sort((a, b) => (a.analysis?.risk_meter?.score || 0) - (b.analysis?.risk_meter?.score || 0));
        break;
      case "name":
        sorted.sort((a, b) => (a.ipo?.upcoming_ipo_2025 || "").localeCompare(b.ipo?.upcoming_ipo_2025 || ""));
        break;
      case "closing":
        sorted.sort((a, b) => {
          const dateA = a.ipo?.ipo_dates?.ipo_close_date ? new Date(a.ipo.ipo_dates.ipo_close_date).getTime() : Infinity;
          const dateB = b.ipo?.ipo_dates?.ipo_close_date ? new Date(b.ipo.ipo_dates.ipo_close_date).getTime() : Infinity;
          return dateA - dateB;
        });
        break;
    }
    return sorted;
  }, [allRows, statusFilter, typeFilter, searchQuery, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageRows = filteredRows.slice(startIndex, startIndex + itemsPerPage);

  const dateCell = (row: Row) => {
    if (row.status === "Upcoming") {
      return { label: "Opens", value: formatShortDate(row.ipo?.ipo_dates?.ipo_open_date) };
    }
    if (row.status === "Open") {
      return { label: "Closes", value: formatShortDate(row.ipo?.ipo_dates?.ipo_close_date) };
    }
    return { label: "Listed", value: formatShortDate(row.ipo?.ipo_dates?.ipo_listing_date) };
  };

  return (
    <div className="min-h-screen app-container pt-24 pb-16 font-sans">
      <Suspense fallback={null}>
        <FilterFromQuery onFilter={setStatusFilter} />
      </Suspense>
      <div>
        <div className="mb-6">
          <div className="text-xs italic text-muted-foreground font-sans mb-1">§ Register</div>
          <h1 className="text-3xl md:text-4xl font-semibold font-serif text-foreground mb-1">All IPOs</h1>
          <p className="text-sm text-muted-foreground">{filteredRows.length} of {allRows.length} IPOs</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search company name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | Status)}>
            <SelectTrigger className="bg-card border-border text-sm w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Upcoming">Upcoming</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Listed">Listed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as "all" | "Mainboard" | "SME")}>
            <SelectTrigger className="bg-card border-border text-sm w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mainboard + SME</SelectItem>
              <SelectItem value="Mainboard">Mainboard</SelectItem>
              <SelectItem value="SME">SME</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="bg-card border-border text-sm w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="score-desc">Sort: score, high to low</SelectItem>
              <SelectItem value="score-asc">Sort: score, low to high</SelectItem>
              <SelectItem value="closing">Sort: closing soonest</SelectItem>
              <SelectItem value="name">Sort: name, A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredRows.length === 0 ? (
          <div className="border border-border rounded-lg bg-card py-16 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-foreground font-medium">No IPOs found</p>
            <p className="text-muted-foreground text-sm mt-1">Try a different search or filter.</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-mono uppercase tracking-wide text-muted-foreground font-medium px-4 py-3">Company</th>
                    <th className="text-left text-xs font-mono uppercase tracking-wide text-muted-foreground font-medium px-4 py-3">Type</th>
                    <th className="text-left text-xs font-mono uppercase tracking-wide text-muted-foreground font-medium px-4 py-3">Price band</th>
                    <th className="text-left text-xs font-mono uppercase tracking-wide text-muted-foreground font-medium px-4 py-3">Issue size</th>
                    <th className="text-left text-xs font-mono uppercase tracking-wide text-muted-foreground font-medium px-4 py-3">Dates</th>
                    <th className="text-right text-xs font-mono uppercase tracking-wide text-muted-foreground font-medium px-4 py-3">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => {
                    const riskScore = row.analysis?.risk_meter?.score || 0;
                    const priceBand = getPriceBand(row.ipo);
                    const date = dateCell(row);
                    const canOpen = riskScore > 0 && !!row.ipo?.slug;
                    return (
                      <tr
                        key={row._id}
                        onClick={() => canOpen && router.push(`/analysis/${row.ipo!.slug}`)}
                        className={`border-b border-border last:border-b-0 transition-colors ${canOpen ? "hover:bg-accent/40 cursor-pointer" : ""}`}
                      >
                        <td className="px-4 py-4">
                          <div className="font-serif font-semibold text-foreground">
                            <IpoTitleLink ipo={row.ipo} hasAnalysis={canOpen} />
                          </div>
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-foreground">{getIpoType(row.ipo)}</td>
                        <td className="px-4 py-4 font-mono text-sm text-foreground">{priceBand ? `₹${priceBand}` : "N/A"}</td>
                        <td className="px-4 py-4 font-mono text-sm text-foreground">{row.ipo?.ipo_size ? `₹${row.ipo.ipo_size}` : "N/A"}</td>
                        <td className="px-4 py-4">
                          <div className="text-xs text-muted-foreground">{date.label}</div>
                          <div className="font-mono text-sm font-semibold text-foreground">{date.value}</div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {riskScore > 0 ? (
                            <span>
                              <span className={`font-serif font-semibold text-lg ${getRiskTextColor(riskScore)}`}>{riskScore}</span>
                              <span className="text-muted-foreground text-xs">/10</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40 text-sm">–/10</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredRows.length)} of {filteredRows.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-sm text-foreground/80 hover:bg-accent disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-sm text-muted-foreground font-mono">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-sm text-foreground/80 hover:bg-accent disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground/70 mt-6">
          This analysis is generated automatically by AI from each company&apos;s RHP/DRHP filing. It is not investment advice, and IPO Milega accepts no responsibility for losses arising from any investment decision.
        </p>
      </div>
    </div>
  );
}

// The table renders from props the server already resolved, so the HTML ships complete --
// no outer Suspense, no spinner, no client fetch of /api/ipo/upcoming on mount.
export default function IposClient(props: IposClientProps) {
  return <IPOsContent {...props} />;
}
