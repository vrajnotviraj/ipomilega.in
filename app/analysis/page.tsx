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

import { IpoComprehensiveAnalysis } from "@/app/models/ipo_comprehensive_analysis";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type FilterType = "all" | "live" | "upcoming" | "past";

// Utility function to format date to "10 August 2025" format
const formatDateToReadable = (dateInput: string | undefined | null): string => {
  if (!dateInput || dateInput === "TBD" || dateInput === "N/A") return "TBD";

  try {
    let date = new Date(dateInput);

    if (isNaN(date.getTime())) {
      const cleanedInput = dateInput.trim();
      const ddmmyyyyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
      const ddmmyyyyMatch = cleanedInput.match(ddmmyyyyRegex);
      if (ddmmyyyyMatch) {
        const [, day, month, year] = ddmmyyyyMatch;
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        return dateInput;
      }
    }

    if (isNaN(date.getTime())) {
      return dateInput;
    }

    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
    };

    return date.toLocaleDateString("en-GB", options);
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateInput;
  }
};

// Utility function to parse date for calculations (returns Date object or null)
const parseDate = (dateInput: string | undefined | null): Date | null => {
  if (!dateInput || dateInput === "TBD" || dateInput === "N/A") return null;

  try {
    let date = new Date(dateInput);

    if (isNaN(date.getTime())) {
      const cleanedInput = dateInput.trim();
      const ddmmyyyyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
      const ddmmyyyyMatch = cleanedInput.match(ddmmyyyyRegex);

      if (ddmmyyyyMatch) {
        const [, day, month, year] = ddmmyyyyMatch;
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    }

    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }
};

export default function AllIPOsPage() {
  const [ipos, setIpos] = useState<IpoComprehensiveAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter, search & pagination states
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAllIPOs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/analysis`, {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
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

  const getRiskColor = (score: number) => {
    if (score > 7) return "text-red-600 dark:text-red-400";
    if (score > 6) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const getStatusBadge = (ipo: IpoComprehensiveAnalysis) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const openingDate = parseDate(ipo.time?.issue_dates?.opening);
    const closingDate = parseDate(ipo.time?.issue_dates?.closing);

    if (!openingDate || !closingDate) {
      return <Badge variant="secondary">Status Unknown</Badge>;
    }

    openingDate.setHours(0, 0, 0, 0);
    closingDate.setHours(0, 0, 0, 0);

    if (today > closingDate) {
      return <Badge variant="secondary">Closed</Badge>;
    }
    if (today >= openingDate && today <= closingDate) {
      if (today.getTime() === closingDate.getTime()) {
        return (
          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20 animate-pulse">
            Closing Today
          </Badge>
        );
      }
      const daysLeft = Math.ceil((closingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
    if (today < openingDate) {
      const daysToOpen = Math.ceil((openingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysToOpen === 0) {
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20 animate-pulse">
            Opening Today
          </Badge>
        );
      }
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

    return <Badge variant="secondary">Status Unknown</Badge>;
  };

  // Classify IPOs and sort them by opening and closing dates
  const { categorizedIpos, counts } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const live: IpoComprehensiveAnalysis[] = [];
    const upcoming: IpoComprehensiveAnalysis[] = [];
    const past: IpoComprehensiveAnalysis[] = [];

    ipos.forEach((ipo) => {
      const open = parseDate(ipo.time?.issue_dates?.opening);
      const close = parseDate(ipo.time?.issue_dates?.closing);

      if (!open || !close) {
        past.push(ipo);
        return;
      }

      open.setHours(0, 0, 0, 0);
      close.setHours(0, 0, 0, 0);

      if (today >= open && today <= close) {
        live.push(ipo);
      } else if (today < open) {
        upcoming.push(ipo);
      } else {
        past.push(ipo);
      }
    });

    // Sort live by closing date ascending (closing soonest first)
    live.sort((a, b) => {
      const aClose = parseDate(a.time?.issue_dates?.closing)?.getTime() || Infinity;
      const bClose = parseDate(b.time?.issue_dates?.closing)?.getTime() || Infinity;
      return aClose - bClose;
    });

    // Sort upcoming by opening date ascending (opening soonest first)
    upcoming.sort((a, b) => {
      const aOpen = parseDate(a.time?.issue_dates?.opening)?.getTime() || Infinity;
      const bOpen = parseDate(b.time?.issue_dates?.opening)?.getTime() || Infinity;
      return aOpen - bOpen;
    });

    // Sort past by closing date descending (most recently closed first)
    past.sort((a, b) => {
      const aClose = parseDate(a.time?.issue_dates?.closing)?.getTime() || 0;
      const bClose = parseDate(b.time?.issue_dates?.closing)?.getTime() || 0;
      return bClose - aClose;
    });

    // Combined all list: Live first, then Upcoming, then Past
    const all = [...live, ...upcoming, ...past];

    return {
      categorizedIpos: { all, live, upcoming, past },
      counts: {
        all: all.length,
        live: live.length,
        upcoming: upcoming.length,
        past: past.length,
      },
    };
  }, [ipos]);

  // Filtered and searched list
  const filteredIpos = useMemo(() => {
    const list = categorizedIpos[activeFilter] || categorizedIpos.all;
    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (ipo) =>
        ipo.company_name?.toLowerCase().includes(q) ||
        ipo.slug?.toLowerCase().includes(q)
    );
  }, [categorizedIpos, activeFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredIpos.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentIpos = filteredIpos.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleGoToPage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const pageNum = parseInt(e.currentTarget.value);
      if (pageNum >= 1 && pageNum <= totalPages) {
        setCurrentPage(pageNum);
      } else {
        e.currentTarget.value = currentPage.toString();
      }
    }
  };

  const filterTabs: { value: FilterType; label: string; count: number; icon: typeof Building2 }[] = [
    { value: "all", label: "All Analysis", count: counts.all, icon: Building2 },
    { value: "live", label: "Live", count: counts.live, icon: Activity },
    { value: "upcoming", label: "Upcoming", count: counts.upcoming, icon: Calendar },
    { value: "past", label: "Closed", count: counts.past, icon: Clock },
  ];

  const formatGmpDisplay = (ipo: IpoComprehensiveAnalysis) => {
    const val = ipo.gmp_price_gain || "";
    if (!val || val === "N/A" || val === "TBD" || val === "TBA") return "N/A";
    return val.includes("₹") ? val : `₹${val}`;
  };

  const formatPriceBand = (priceBand: string | undefined) => {
    if (!priceBand || priceBand === "N/A") return "N/A";
    return priceBand.includes("₹") ? priceBand : `₹${priceBand}`;
  };

  if (isLoading) {
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
                    <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-20 bg-muted/50" /></th>
                    <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-16 bg-muted/50" /></th>
                    <th className="px-4 py-3 text-center"><Skeleton className="h-4 w-20 bg-muted/50" /></th>
                    <th className="px-4 py-3 text-center"><Skeleton className="h-4 w-20 bg-muted/50" /></th>
                    <th className="px-4 py-3 text-center"><Skeleton className="h-4 w-24 bg-muted/50" /></th>
                    <th className="px-4 py-3 text-center"><Skeleton className="h-4 w-20 bg-muted/50" /></th>
                    <th className="px-4 py-3 text-center"><Skeleton className="h-4 w-16 bg-muted/50" /></th>
                    <th className="px-4 py-3 text-center"><Skeleton className="h-4 w-16 bg-muted/50" /></th>
                    <th className="px-4 py-3 text-center"><Skeleton className="h-4 w-16 bg-muted/50" /></th>
                  </tr>
                </thead>
                <tbody>
                  {Array(8).fill(0).map((_, index) => (
                    <tr key={index} className="border-b border-muted/20">
                      <td className="px-4 py-4"><div className="flex items-center space-x-3"><Skeleton className="h-10 w-10 rounded-full bg-muted/50" /><Skeleton className="h-5 w-32 bg-muted/50" /></div></td>
                      <td className="px-4 py-4"><Skeleton className="h-4 w-16 bg-muted/50" /></td>
                      <td className="px-4 py-4 text-center"><Skeleton className="h-4 w-20 bg-muted/50 mx-auto" /></td>
                      <td className="px-4 py-4 text-center"><Skeleton className="h-4 w-20 bg-muted/50 mx-auto" /></td>
                      <td className="px-4 py-4 text-center"><Skeleton className="h-4 w-16 bg-muted/50 mx-auto" /></td>
                      <td className="px-4 py-4 text-center"><Skeleton className="h-4 w-16 bg-muted/50 mx-auto" /></td>
                      <td className="px-4 py-4 text-center"><Skeleton className="h-6 w-20 bg-muted/50 mx-auto" /></td>
                      <td className="px-4 py-4 text-center"><Skeleton className="h-6 w-16 bg-muted/50 mx-auto" /></td>
                      <td className="px-4 py-4 text-center"><Skeleton className="h-8 w-16 bg-muted/50 mx-auto" /></td>
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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-ibm-plex">
        <div className="app-container py-8 text-center">
          <Card className="max-w-2xl mx-auto bg-background/60 backdrop-blur-sm border border-destructive/50">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400 flex items-center justify-center gap-2">
                <FileText className="h-5 w-5" />
                Failed to Load Data
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
    <div className="min-h-screen bg-background font-ibm-plex app-container pt-24 pb-16">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="py-3 sm:py-4 lg:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary truncate">
                All IPO Analysis
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground hidden sm:block">
                Comprehensive fundamentals, risk assessment, timeline, and listing gain insights
              </p>
            </div>
            {/* Search Input */}
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
                className="pl-9 bg-card border-border text-sm h-9 rounded-lg font-ibm-plex"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="py-4 sm:py-6 lg:py-8 space-y-6">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.value;
            return (
              <Button
                key={tab.value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveFilter(tab.value);
                  setCurrentPage(1);
                }}
                className={cn(
                  "font-bold font-ibm-plex h-9 px-3.5 rounded-lg flex items-center gap-2 transition-all",
                  isActive
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                    : "bg-card hover:bg-accent border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs px-1.5 py-0.2 rounded-full",
                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {tab.count}
                </Badge>
              </Button>
            );
          })}
        </div>

        {filteredIpos.length === 0 ? (
          <Card className="max-w-2xl mx-auto bg-background/60 backdrop-blur-sm border border-muted/50 text-center p-8">
            <CardHeader>
              <CardTitle className="text-foreground">No Analysis Found</CardTitle>
              <CardDescription className="text-muted-foreground">
                {searchQuery
                  ? `No analysis matching "${searchQuery}".`
                  : "There are currently no IPOs with analysis in this category."}
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
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/20 border-b border-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Company</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Issue Size</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Opening Date</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Closing Date</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Price Band</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">GMP (Gain)</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Risk Score</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Action</th>
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
                          <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                            <AvatarImage
                              src={ipo.image_url}
                              alt={`${ipo.company_name || "Company"} logo`}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                              <Building2 className="h-5 w-5 text-primary" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-foreground truncate">
                              {ipo.company_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-foreground">
                          {ipo.ipo_details?.issue_size || "N/A"}
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
                        <div
                          className={cn(
                            "text-sm font-bold",
                            getRiskColor(ipo.summary_metrics?.risk_meter || 0)
                          )}
                        >
                          {ipo.summary_metrics?.risk_meter
                            ? `${ipo.summary_metrics.risk_meter}/10`
                            : "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">{getStatusBadge(ipo)}</td>
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

            {/* Mobile Cards */}
            <div className="lg:hidden p-3 sm:p-4 space-y-3">
              {currentIpos.map((ipo) => (
                <div
                  key={ipo._id}
                  className="bg-card border border-border rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10 ring-2 ring-primary/10 flex-shrink-0">
                        <AvatarImage
                          src={ipo.image_url}
                          alt={`${ipo.company_name || "Company"} logo`}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {ipo.company_name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {ipo.ipo_details?.issue_size || "N/A"}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(ipo)}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs mb-3 bg-muted/40 p-2.5 rounded-lg border border-border">
                    <div>
                      <div className="text-muted-foreground mb-0.5">Opening</div>
                      <div className="font-semibold text-foreground">
                        {formatDateToReadable(ipo.time?.issue_dates?.opening)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-0.5">Closing</div>
                      <div className="font-semibold text-foreground">
                        {formatDateToReadable(ipo.time?.issue_dates?.closing)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-0.5">Price Band</div>
                      <div className="font-semibold text-foreground">
                        {formatPriceBand(ipo.ipo_details?.price_band)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-0.5">GMP (Gain)</div>
                      <div className="font-bold text-emerald-600">
                        {formatGmpDisplay(ipo)}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <Link href={`/analysis/${ipo?.slug}`} className="block">
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

            {/* Pagination Controls */}
            <CardContent className="p-4 sm:p-6 border-t border-border">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground font-medium font-ibm-plex">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredIpos.length)} of{" "}
                  {filteredIpos.length} Analysis
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 sm:h-9 px-3 border-border hover:bg-accent font-bold font-ibm-plex"
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
                      className="w-16 h-8 sm:h-9 text-center border-border font-medium font-ibm-plex"
                    />
                    <span className="text-sm text-muted-foreground font-medium font-ibm-plex">
                      of {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 sm:h-9 px-3 border-border hover:bg-accent font-bold font-ibm-plex"
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