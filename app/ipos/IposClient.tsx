"use client";
import { useEffect, useState, useMemo, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { HomePageIpoProps } from "@/types/homepage";
import { useProgressRouter } from "@/hooks/useProgressRouter";
import { useSearchParams } from "next/navigation";
import { getIpoType, getPriceBand, getRiskTextColor, formatShortDate, formatIssueSize } from "@/lib/ipo-format";
import { IpoTitleLink } from "@/components/ipo/IpoTitleLink";
import { IpoLogo } from "@/components/ipo/IpoLogo";

type Status = "Upcoming" | "Open" | "Listed";
type Row = HomePageIpoProps & { status: Status };

const STATUS_STYLES: Record<Status, string> = {
  Upcoming: "bg-secondary text-foreground/70",
  Open: "bg-score-mid/15 text-score-mid",
  Listed: "bg-muted text-muted-foreground",
};

function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-medium ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

// Hidden when the date is unknown, so an unscheduled IPO does not show a row of "TBA"s.
function DateBadge({ label, date }: { label: string; date: string | undefined }) {
  const value = formatShortDate(date);
  if (value === "TBA") return null;
  return (
    <span className="inline-block px-2 py-0.5 rounded border border-border text-[11px] font-mono text-muted-foreground whitespace-nowrap">
      {label} <span className="font-semibold text-foreground">{value}</span>
    </span>
  );
}

const STATUS_BY_FILTER_PARAM: Record<string, Status> = { live: "Open", upcoming: "Upcoming", past: "Listed" };

// Lives behind its own <Suspense> because useSearchParams would otherwise drop the table out of the prerendered HTML.
function FilterFromQuery({ onFilter }: { onFilter: (status: Status) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const status = STATUS_BY_FILTER_PARAM[searchParams.get("filter") ?? ""];
    if (status) onFilter(status);
  }, [searchParams, onFilter]);
  return null;
}

type SortKey = "score-desc" | "score-asc" | "closing" | "name";

const score = (row: Row) => row.analysis?.risk_meter?.score || 0;
const companyName = (row: Row) => row.ipo?.upcoming_ipo_2025 || "";
const closeTime = (row: Row) =>
  row.ipo?.ipo_dates?.ipo_close_date ? new Date(row.ipo.ipo_dates.ipo_close_date).getTime() : Infinity;

const COMPARE: Record<SortKey, (a: Row, b: Row) => number> = {
  "score-desc": (a, b) => score(b) - score(a),
  "score-asc": (a, b) => score(a) - score(b),
  name: (a, b) => companyName(a).localeCompare(companyName(b)),
  closing: (a, b) => closeTime(a) - closeTime(b),
};

const ITEMS_PER_PAGE = 10;
const TH = "text-xs font-mono uppercase tracking-wide text-muted-foreground font-medium px-4 py-3";

export default function IposClient({ upcoming, live, past }: {
  upcoming: HomePageIpoProps[];
  live: HomePageIpoProps[];
  past: HomePageIpoProps[];
}) {
  const router = useProgressRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "Mainboard" | "SME">("all");
  const [sortBy, setSortBy] = useState<SortKey>("score-desc");
  const [currentPage, setCurrentPage] = useState(1);

  const allRows: Row[] = useMemo(() => [
    ...live.map((item) => ({ ...item, status: "Open" as const })),
    ...upcoming.map((item) => ({ ...item, status: "Upcoming" as const })),
    ...past.map((item) => ({ ...item, status: "Listed" as const })),
  ], [live, upcoming, past]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allRows
      .filter((r) => statusFilter === "all" || r.status === statusFilter)
      .filter((r) => typeFilter === "all" || getIpoType(r.ipo) === typeFilter)
      .filter((r) => !query || r.ipo?.upcoming_ipo_2025?.toLowerCase().includes(query))
      .sort(COMPARE[sortBy]);
  }, [allRows, statusFilter, typeFilter, searchQuery, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageRows = filteredRows.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
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
                    <th className={`text-left ${TH}`}>Company</th>
                    <th className={`text-left ${TH}`}>Type</th>
                    <th className={`text-left ${TH}`}>Price band</th>
                    <th className={`text-left ${TH}`}>Issue size</th>
                    <th className={`text-left ${TH}`}>Dates</th>
                    <th className={`text-right ${TH}`}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => {
                    const riskScore = row.analysis?.risk_meter?.score || 0;
                    const priceBand = getPriceBand(row.ipo);
                    const issueSizeValue = formatIssueSize(row.ipo?.ipo_size);
                    // ipo_size can be a share count instead of an amount, and a share count gets no ₹.
                    const issueSize =
                      issueSizeValue && /^[\d.]/.test(issueSizeValue) && !/share/i.test(issueSizeValue)
                        ? `₹${issueSizeValue}`
                        : issueSizeValue;
                    const date = dateCell(row);
                    const canOpen = riskScore > 0 && !!row.ipo?.slug;
                    return (
                      <tr
                        key={row._id}
                        onClick={() => canOpen && router.push(`/analysis/${row.ipo!.slug}`)}
                        className={`border-b border-border last:border-b-0 transition-colors ${canOpen ? "hover:bg-accent/40 cursor-pointer" : ""}`}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <IpoLogo src={row.ipo?.image_url} name={row.ipo?.upcoming_ipo_2025} />
                            <div className="min-w-0">
                              <div className="font-serif font-semibold text-foreground">
                                <IpoTitleLink ipo={row.ipo} hasAnalysis={canOpen} />
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <StatusBadge status={row.status} />
                                <DateBadge label="Allot" date={row.ipo?.ipo_dates?.basis_of_allotment} />
                                <DateBadge label="Lists" date={row.ipo?.ipo_dates?.ipo_listing_date} />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-foreground">{getIpoType(row.ipo)}</td>
                        <td className="px-4 py-4 font-mono text-sm text-foreground">{priceBand ? `₹${priceBand}` : "N/A"}</td>
                        <td className="px-4 py-4 font-mono text-sm text-foreground">{issueSize || "Size TBA"}</td>
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
                Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filteredRows.length)} of {filteredRows.length}
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
