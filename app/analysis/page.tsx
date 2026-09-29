"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Eye,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Activity,
  Calendar,
  Clock,
  RefreshCw,
} from "lucide-react";

import { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIssueSize } from "@/lib/ipo-format";
import { gmpLine } from "@/lib/share";

type FilterType = "all" | "live" | "upcoming" | "past";

const ITEMS_PER_PAGE = 10;
const DAY_MS = 1000 * 60 * 60 * 24;

/** Parses an ISO-ish date or a DD/MM/YYYY one; null when missing or unreadable. */
function parseDate(dateInput: string | undefined | null): Date | null {
  if (!dateInput || dateInput === "TBD" || dateInput === "N/A") return null;

  const date = new Date(dateInput);
  if (!isNaN(date.getTime())) return date;

  const ddmmyyyy = dateInput.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (!ddmmyyyy) return null;
  const [, day, month, year] = ddmmyyyy;
  const parsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return isNaN(parsed.getTime()) ? null : parsed;
}

/** Midnight local time of the parsed date, for whole-day comparisons. */
function parseDay(dateInput: string | undefined | null): Date | null {
  const date = parseDate(dateInput);
  date?.setHours(0, 0, 0, 0);
  return date;
}

/** "10 Aug 2025", "TBD" when missing, or the raw text when it does not parse. */
function formatDateToReadable(dateInput: string | undefined | null): string {
  if (!dateInput || dateInput === "TBD" || dateInput === "N/A") return "TBD";
  const date = parseDate(dateInput);
  return date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : dateInput;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

const dateMs = (dateInput: string | undefined) => parseDate(dateInput)?.getTime();

function getRiskColor(score: number) {
  if (score > 7) return "text-red-600 dark:text-red-400";
  if (score > 6) return "text-yellow-600 dark:text-yellow-400";
  return "text-green-600 dark:text-green-400";
}

function formatGmpDisplay(ipo: IpoComprehensiveAnalysis) {
  // gmp_price_gain holds the estimated listing ("360 (31.25%)"), so the GMP column shows the gain only.
  return gmpLine(ipo.gmp_price_gain)?.replace(/^GMP /, "") ?? "N/A";
}

function formatPriceBand(priceBand: string | undefined) {
  if (!priceBand || priceBand === "N/A") return "N/A";
  return priceBand.includes("₹") ? priceBand : `₹${priceBand}`;
}

function StatusBadge({ ipo }: { ipo: IpoComprehensiveAnalysis }) {
  const today = startOfToday();
  const openingDate = parseDay(ipo.time?.issue_dates?.opening);
  const closingDate = parseDay(ipo.time?.issue_dates?.closing);

  if (!openingDate || !closingDate) return <Badge variant="secondary">Status Unknown</Badge>;
  if (today > closingDate) return <Badge variant="secondary">Closed</Badge>;

  if (today < openingDate) {
    const daysToOpen = Math.ceil((openingDate.getTime() - today.getTime()) / DAY_MS);
    if (daysToOpen === 1) {
      return (
        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20">
          Opening Tomorrow
        </Badge>
      );
    }
    return (
      <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20">
        {`Upcoming in ${daysToOpen}d`}
      </Badge>
    );
  }

  const daysLeft = Math.ceil((closingDate.getTime() - today.getTime()) / DAY_MS);
  if (daysLeft === 0) {
    return (
      <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20 animate-pulse">
        Closing Today
      </Badge>
    );
  }
  if (daysLeft === 1) {
    return (
      <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20">
        Closing Tomorrow
      </Badge>
    );
  }
  return (
    <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20">
      {`Open (${daysLeft}d left)`}
    </Badge>
  );
}

function CompanyAvatar({ ipo, className }: { ipo: IpoComprehensiveAnalysis; className?: string }) {
  return (
    <Avatar className={cn("h-10 w-10 ring-2 ring-primary/10", className)}>
      <AvatarImage src={ipo.image_url} alt={`${ipo.company_name || "Company"} logo`} className="object-cover" />
      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
        <Building2 className="h-5 w-5 text-primary" />
      </AvatarFallback>
    </Avatar>
  );
}

const FILTER_TABS: { value: FilterType; label: string; icon: typeof Building2 }[] = [
  { value: "all", label: "All Analysis", icon: Building2 },
  { value: "live", label: "Live", icon: Activity },
  { value: "upcoming", label: "Upcoming", icon: Calendar },
  { value: "past", label: "Closed", icon: Clock },
];

const TABLE_COLUMNS = [
  "Company",
  "Issue Size",
  "Opening Date",
  "Closing Date",
  "Price Band",
  "GMP (Gain)",
  "Risk Score",
  "Status",
  "Action",
];
// The first two columns are left-aligned, the rest centred.
const columnAlign = (i: number) => (i < 2 ? "text-left" : "text-center");

const SKELETON_HEADER_WIDTHS = ["w-20", "w-16", "w-20", "w-20", "w-24", "w-20", "w-16", "w-16", "w-16"];
const SKELETON_CELLS = ["h-4 w-20", "h-4 w-20", "h-4 w-16", "h-4 w-16", "h-6 w-20", "h-6 w-16", "h-8 w-16"];

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="app-container pt-24 pb-16">
        <div className="mb-8 sm:mb-12">
          <Skeleton className="h-8 sm:h-10 w-40 sm:w-48 bg-muted/50 mb-2" />
          <Skeleton className="h-5 sm:h-6 w-80 sm:w-96 bg-muted/50" />
        </div>
        <div className="hidden lg:block bg-background/60 backdrop-blur-sm border border-muted/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/20 border-b border-muted/50">
                <tr>
                  {SKELETON_HEADER_WIDTHS.map((width, i) => (
                    <th key={i} className={cn("px-4 py-3", columnAlign(i))}>
                      <Skeleton className={cn("h-4 bg-muted/50", width)} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }, (_, index) => (
                  <tr key={index} className="border-b border-muted/20">
                    <td className="px-4 py-4"><div className="flex items-center space-x-3"><Skeleton className="h-10 w-10 rounded-full bg-muted/50" /><Skeleton className="h-5 w-32 bg-muted/50" /></div></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-16 bg-muted/50" /></td>
                    {SKELETON_CELLS.map((size, i) => (
                      <td key={i} className="px-4 py-4 text-center"><Skeleton className={cn(size, "bg-muted/50 mx-auto")} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AllIPOsPage() {
  const [ipos, setIpos] = useState<IpoComprehensiveAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAllIPOs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/analysis`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setIpos(data.ipos_analysis || []);
    } catch (err) {
      console.error("Error fetching IPOs:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllIPOs();
  }, []);

  // Live closing soonest first, upcoming opening soonest first, past most recently closed first.
  const categorizedIpos = useMemo(() => {
    const today = startOfToday();
    const live: IpoComprehensiveAnalysis[] = [];
    const upcoming: IpoComprehensiveAnalysis[] = [];
    const past: IpoComprehensiveAnalysis[] = [];

    for (const ipo of ipos) {
      const open = parseDay(ipo.time?.issue_dates?.opening);
      const close = parseDay(ipo.time?.issue_dates?.closing);
      if (open && close && today >= open && today <= close) live.push(ipo);
      else if (open && close && today < open) upcoming.push(ipo);
      else past.push(ipo);
    }

    live.sort((a, b) => (dateMs(a.time?.issue_dates?.closing) || Infinity) - (dateMs(b.time?.issue_dates?.closing) || Infinity));
    upcoming.sort((a, b) => (dateMs(a.time?.issue_dates?.opening) || Infinity) - (dateMs(b.time?.issue_dates?.opening) || Infinity));
    past.sort((a, b) => (dateMs(b.time?.issue_dates?.closing) || 0) - (dateMs(a.time?.issue_dates?.closing) || 0));

    return { all: [...live, ...upcoming, ...past], live, upcoming, past };
  }, [ipos]);

  const filteredIpos = useMemo(() => {
    const list = categorizedIpos[activeFilter];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter((ipo) => ipo.company_name?.toLowerCase().includes(q) || ipo.slug?.toLowerCase().includes(q));
  }, [categorizedIpos, activeFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredIpos.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentIpos = filteredIpos.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGoToPage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const pageNum = parseInt(e.currentTarget.value);
    if (pageNum >= 1 && pageNum <= totalPages) setCurrentPage(pageNum);
    else e.currentTarget.value = currentPage.toString();
  };

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-sans">
        <div className="app-container py-8 text-center">
          <Card className="max-w-2xl mx-auto bg-background/60 backdrop-blur-sm border border-destructive/50">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400 flex items-center justify-center gap-2">
                <FileText className="h-5 w-5" />
                Couldn&apos;t load the data
              </CardTitle>
              <CardDescription className="text-muted-foreground">{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => fetchAllIPOs()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans app-container pt-24 pb-16">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="py-3 sm:py-4 lg:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary truncate">
                All IPO Analysis
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground hidden sm:block">
                Fundamentals, risks, key dates and listing-gain estimates for every IPO we&apos;ve scored
              </p>
            </div>
            <div className="w-full sm:w-72 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search analysis..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 bg-card border-border text-sm h-9 rounded-lg font-sans"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="py-4 sm:py-6 lg:py-8 space-y-6">
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          {FILTER_TABS.map(({ value, label, icon: Icon }) => {
            const isActive = activeFilter === value;
            return (
              <Button
                key={value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveFilter(value);
                  setCurrentPage(1);
                }}
                className={cn(
                  "font-bold font-sans h-9 px-3.5 rounded-lg flex items-center gap-2 transition-all",
                  isActive
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                    : "bg-card hover:bg-accent border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs px-1.5 py-0.2 rounded-full",
                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {categorizedIpos[value].length}
                </Badge>
              </Button>
            );
          })}
        </div>

        {filteredIpos.length === 0 ? (
          <Card className="max-w-2xl mx-auto bg-background/60 backdrop-blur-sm border border-muted/50 text-center p-8">
            <CardHeader>
              <CardTitle className="text-foreground">No analysis found</CardTitle>
              <CardDescription className="text-muted-foreground">
                {searchQuery
                  ? `No analysis matching "${searchQuery}".`
                  : "No IPO in this category has an analysis yet."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searchQuery ? (
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link href="/">Back to Home</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-background/95 backdrop-blur-sm border border-muted/50 rounded-xl overflow-hidden shadow-sm">
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/20 border-b border-muted/50">
                  <tr>
                    {TABLE_COLUMNS.map((column, i) => (
                      <th key={column} className={cn("px-4 py-3 text-sm font-semibold text-foreground", columnAlign(i))}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentIpos.map((ipo, index) => (
                    <tr
                      key={ipo._id}
                      className={cn(
                        "border-b border-muted/20 hover:bg-muted/10 transition-colors duration-200",
                        index % 2 === 0 ? "bg-background/50" : "bg-background/30"
                      )}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          <CompanyAvatar ipo={ipo} />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-foreground truncate">
                              {ipo.company_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-foreground">
                          {formatIssueSize(ipo.ipo_details?.issue_size) || "Size TBA"}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-sm text-foreground">
                          {formatDateToReadable(ipo.time?.issue_dates?.opening)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-sm text-foreground">
                          {formatDateToReadable(ipo.time?.issue_dates?.closing)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-sm text-foreground">
                          {formatPriceBand(ipo.ipo_details?.price_band)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-sm font-bold text-emerald-600">
                          {formatGmpDisplay(ipo)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className={cn("text-sm font-bold", getRiskColor(ipo.summary_metrics?.risk_meter || 0))}>
                          {ipo.summary_metrics?.risk_meter ? `${ipo.summary_metrics.risk_meter}/10` : "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center"><StatusBadge ipo={ipo} /></td>
                      <td className="px-4 py-4 text-center">
                        <Link href={`/analysis/${ipo.slug}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-primary/20 hover:bg-primary/10 text-primary hover:border-primary/40 transition-all duration-200 font-bold"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden p-3 sm:p-4 space-y-3">
              {currentIpos.map((ipo) => (
                <div key={ipo._id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <CompanyAvatar ipo={ipo} className="flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {ipo.company_name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {formatIssueSize(ipo.ipo_details?.issue_size) || "Size TBA"}
                        </p>
                      </div>
                    </div>
                    <StatusBadge ipo={ipo} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs mb-3 bg-muted/40 p-2.5 rounded-lg border border-border">
                    {[
                      ["Opening", formatDateToReadable(ipo.time?.issue_dates?.opening), "font-semibold text-foreground"],
                      ["Closing", formatDateToReadable(ipo.time?.issue_dates?.closing), "font-semibold text-foreground"],
                      ["Price Band", formatPriceBand(ipo.ipo_details?.price_band), "font-semibold text-foreground"],
                      ["GMP (Gain)", formatGmpDisplay(ipo), "font-bold text-emerald-600"],
                    ].map(([label, value, valueClass]) => (
                      <div key={label}>
                        <div className="text-muted-foreground mb-0.5">{label}</div>
                        <div className={valueClass}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-border">
                    <Link href={`/analysis/${ipo.slug}`} className="block">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-primary/20 hover:bg-primary/10 text-primary hover:border-primary/40 font-bold"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Analysis
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <CardContent className="p-4 sm:p-6 border-t border-border">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground font-medium font-sans">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredIpos.length)} of{" "}
                  {filteredIpos.length} Analysis
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 sm:h-9 px-3 border-border hover:bg-accent font-bold font-sans"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max={totalPages}
                      defaultValue={currentPage}
                      key={currentPage}
                      onKeyDown={handleGoToPage}
                      className="w-16 h-8 sm:h-9 text-center border-border font-medium font-sans"
                    />
                    <span className="text-sm text-muted-foreground font-medium font-sans">
                      of {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 sm:h-9 px-3 border-border hover:bg-accent font-bold font-sans"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
