"use client";
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeftCircle, Share2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IpoComprehensiveAnalysis } from "@/app/models/ipo_comprehensive_analysis";
import { Ipo } from "@/app/models/ipo";
import "@/app/styles/analysis.css";
import { InvestorSplitPieChart } from "@/components/charts/InvestorSplitPieChart";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AnalysisPageClientProps {
  analysis: IpoComprehensiveAnalysis;
  ipo: Ipo;
}

interface IPOInvestorSplit {
  application: string;
  lot_size: string;
  shares: string;
  amount: string;
}

// Inline Editable Field Component (Clean & Seamless)
interface EditableTextProps {
  value: string | number;
  onSave: (val: string) => void;
  isAdmin?: boolean;
  type?: "text" | "textarea" | "number" | "date";
  className?: string;
  textClassName?: string;
  inputClassName?: string;
  renderText?: (val: string) => React.ReactNode;
  placeholder?: string;
}

const EditableText = ({
  value,
  onSave,
  isAdmin = false,
  type = "text",
  className = "",
  textClassName = "",
  inputClassName = "",
  renderText,
  placeholder = "Double-click to edit...",
}: EditableTextProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localVal, setLocalVal] = useState(String(value ?? ""));

  useEffect(() => {
    setLocalVal(String(value ?? ""));
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localVal !== String(value ?? "")) {
      onSave(localVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && type !== "textarea") {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === "Escape") {
      setLocalVal(String(value ?? ""));
      setIsEditing(false);
    }
  };

  if (isAdmin && isEditing) {
    if (type === "textarea") {
      return (
        <textarea
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className={cn(
            "w-full p-2 border-2 border-blue-500 rounded-md text-sm bg-white font-ibm-plex text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md min-h-[70px]",
            inputClassName
          )}
        />
      );
    }
    return (
      <input
        type={type}
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className={cn(
          "px-2 py-1 border-2 border-blue-500 rounded-md text-sm bg-white font-ibm-plex text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm w-full",
          inputClassName
        )}
      />
    );
  }

  const displayContent = renderText
    ? renderText(localVal)
    : (localVal || <span className="text-gray-400 italic">{placeholder}</span>);

  return (
    <span
      onDoubleClick={(e) => {
        if (isAdmin) {
          e.stopPropagation();
          setIsEditing(true);
        }
      }}
      className={cn(
        isAdmin
          ? "cursor-pointer hover:bg-blue-50/70 hover:outline-blue-300 hover:outline hover:outline-1 hover:outline-dashed rounded transition-colors duration-150 inline-block px-1"
          : "",
        className
      )}
      title={isAdmin ? "Double-click to edit field" : undefined}
    >
      <span className={textClassName}>{displayContent}</span>
    </span>
  );
};

// Helper component for timeline markers
const TimelineMarker = ({
  label,
  date,
  position,
  alignment = "center",
}: {
  label: string;
  date: string;
  position: string;
  alignment?: "left" | "center" | "right";
}) => {
  let alignmentClass = "items-center text-center -translate-x-1/2";
  if (alignment === "left") alignmentClass = "items-start text-left";
  if (alignment === "right")
    alignmentClass = "items-end text-right -translate-x-full";

  const formattedDate = new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className={`absolute top-0 h-full flex flex-col justify-between ${alignmentClass}`}
      style={{ left: position }}
    >
      <p className="text-lg font-medium -translate-y-8 font-ibm-plex">
        {label}
      </p>
      <p className="text-lg font-semibold translate-y-8 font-ibm-plex">
        {formattedDate}
      </p>
    </div>
  );
};

// Helper component for circular progress indicators
const ProgressCircle = ({
  label,
  value,
  description,
  onSaveScore,
  onSaveDescription,
  isAdmin = false,
}: {
  label: string;
  value: number;
  description?: string;
  onSaveScore?: (val: string) => void;
  onSaveDescription?: (val: string) => void;
  isAdmin?: boolean;
}) => {
  const cappedValue = Math.min(value, 100);
  const strokeWidth = 4;
  const progressRadius = 16;
  const innerRadius = progressRadius - strokeWidth / 2;
  const circumference = 2 * Math.PI * progressRadius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (cappedValue / 10) * circumference;

  return (
    <div className="flex flex-col items-center text-center">
      <h4 className="progress-circle-label mb-2 sm:mb-4 text-base font-semibold font-ibm-plex">
        {label}
      </h4>
      <div className="relative w-20 h-20 sm:w-24 sm:h-24">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 36 36"
          className="w-full h-full"
        >
          <circle cx="18" cy="18" r={innerRadius} fill="#2563eb" />
          <circle
            cx="18"
            cy="18"
            r={progressRadius}
            fill="none"
            stroke="#93c5fd"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "18px 18px",
              transition: "stroke-dashoffset 0.5s ease-in-out"
            }}
          />
          {!isAdmin && (
            <text
              x="18"
              y="21"
              textAnchor="middle"
              fill="white"
              fontSize="8"
              fontWeight="bold"
              fontFamily="IBM Plex Sans, sans-serif"
            >
              {cappedValue.toFixed(0)}
            </text>
          )}
        </svg>
        {isAdmin && onSaveScore && (
          <div className="absolute inset-0 flex items-center justify-center">
            <EditableText
              value={cappedValue}
              onSave={onSaveScore}
              type="number"
              isAdmin={isAdmin}
              inputClassName="w-10 text-center font-bold text-xs p-0.5 rounded border border-blue-500 bg-white"
              textClassName="text-white text-base font-bold cursor-pointer"
              renderText={(val) => <span>{val}</span>}
            />
          </div>
        )}
      </div>
      {description !== undefined && (
        <div className="mt-2 sm:mt-4 max-w-[290px] sm:max-w-[200px]">
          {isAdmin && onSaveDescription ? (
            <EditableText
              value={description}
              onSave={onSaveDescription}
              type="textarea"
              isAdmin={isAdmin}
              textClassName="text-sm font-ibm-plex text-body-sm block"
              inputClassName="w-full text-xs text-gray-800 bg-white"
            />
          ) : (
            <p className="text-sm font-ibm-plex text-body-sm">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to get initials from a company name
const getInitials = (name: string) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((word: string) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function AnalysisPageClient({
  analysis,
  ipo,
}: AnalysisPageClientProps) {
  const [editedAnalysis, setEditedAnalysis] = useState<IpoComprehensiveAnalysis>(analysis);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingTimeline, setIsEditingTimeline] = useState(false);

  const session = useSession();
  const isAdmin = ["admin@gmail.com", "snehshah7634@gmail.com", "shahvraj114@gmail.com", "devanshisoni2004@gmail.com", "devanshisoni2311@gmail.com"].includes(
    session?.data?.user?.email || ""
  );

  const handleInlineSave = (path: string, newValue: unknown) => {
    setEditedAnalysis((prev) => {
      const copy = { ...prev };
      const parts = path.split(".");
      let current = copy as unknown as Record<string, unknown>;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current[parts[i]] = { ...(current[parts[i]] as Record<string, unknown>) };
        current = current[parts[i]] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = newValue;
      saveAnalysis(copy);
      return copy;
    });
  };

  const handleInlineArraySave = (path: string, newlineString: string) => {
    const arr = newlineString.split("\n").filter((item) => item.trim() !== "");
    handleInlineSave(path, arr);
  };

  const saveAnalysis = async (newAnalysis: IpoComprehensiveAnalysis) => {
    setIsSaving(true);
    const fundamentalsScore = Number(newAnalysis.fundamentals?.score ?? 0);
    const performanceScore = Number(newAnalysis.performance?.score ?? 0);
    const riskScore = Number(newAnalysis.risk_meter?.score ?? 0);
    const flexibilityScore = Number(newAnalysis.flexibility?.score ?? 0);
    const timeScore = Number(newAnalysis.time?.score ?? 0);
    const gainsPotential = Number(newAnalysis.ipo_details?.approximate_gains_potential ?? 0);
    const allotmentScore = Number(newAnalysis.ipo_details?.profitability_of_allotment?.score ?? 0);
    const totalRevenue = Number(newAnalysis.fundamentals?.revenue_details?.total_revenue ?? 0);
    const netProfit = Number(newAnalysis.fundamentals?.profit_analysis?.net_profit ?? 0);
    const totalAssets = Number(newAnalysis.fundamentals?.assets_and_liabilities?.total_assets ?? 0);

    const payload = {
      ipo_table_id: newAnalysis.ipo_table_id,
      company_name: newAnalysis.company_name,
      slug: newAnalysis.slug,
      image_url: newAnalysis.image_url || ipo.image_url || "",
      investorSplit: newAnalysis.investorSplit || [],
      financialReport: newAnalysis.financialReport || [],
      gmp_price_gain: newAnalysis.gmp_price_gain || ipo.gmp_price_gain || "",
      fundamentals: newAnalysis.fundamentals,
      risk_meter: newAnalysis.risk_meter,
      flexibility: newAnalysis.flexibility,
      time: newAnalysis.time,
      performance: newAnalysis.performance,
      ipo_details: newAnalysis.ipo_details,
      summary_metrics: {
        fundamentals_score: fundamentalsScore,
        risk_meter: riskScore,
        flexibility_score: flexibilityScore,
        time_score: timeScore,
        performance_score: performanceScore,
        approximate_gains_potential: gainsPotential,
        profitability_of_allotment: allotmentScore,
        total_revenue: totalRevenue,
        net_profit: netProfit,
        total_assets: totalAssets,
      },
    };

    const toastId = toast.loading("Saving changes...");
    try {
      const response = await fetch("/api/analysis/manipulate-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to save analysis");

      toast.success("Saved successfully!", { id: toastId });
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error instanceof Error ? error.message : "Error saving updates", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const [activeTab, setActiveTab] = useState("performance");
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    "performance",
    "fundamentals",
    "risk",
    "flexibility",
  ]);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const riskCategoryColors: { [key: string]: string } = {
    market_risks: "text-red-600",
    financial_risks: "text-orange-500",
    operational_risks: "text-gray-600",
    regulatory_risks: "text-blue-600",
    default: "text-gray-600",
  };

  const overallScore =
    ((editedAnalysis.fundamentals?.score ?? 0) +
      (editedAnalysis.performance?.score ?? 0)) /
    2;

  const getDisplayPrice = () => {
    const priceBand = editedAnalysis.ipo_details?.price_band;
    if (
      priceBand &&
      typeof priceBand === "string" &&
      priceBand.includes(" - ")
    ) {
      const parts = priceBand.split(" - ");
      const upperPrice = parts[1]?.trim();
      if (upperPrice && !isNaN(parseFloat(upperPrice))) return `₹${upperPrice}`;
    }
    return "N/A";
  };

  const timelineData = {
    opening: editedAnalysis.time?.issue_dates?.opening || "",
    closing: editedAnalysis.time?.issue_dates?.closing || "",
    allotment: editedAnalysis.time?.allotment_timeline?.date || "",
    today: new Date().toISOString().split("T")[0],
    listing: editedAnalysis.time?.listing_details?.expected_date || "",
  };

  const parseDate = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  const openingDate = parseDate(timelineData.opening);
  const listingDate = parseDate(timelineData.listing);

  let isTimelineValid = false;
  let positions = {
    opening: 0,
    closing: 0,
    allotment: 0,
    today: 0,
    listing: 100,
  };
  let gradientStyle = {};

  if (openingDate && listingDate) {
    const openingTime = openingDate.getTime();
    const listingTime = listingDate.getTime();
    const totalDuration = listingTime - openingTime;

    if (totalDuration > 0) {
      isTimelineValid = true;

      const calculatePosition = (dateString: string): number => {
        const date = parseDate(dateString);
        if (!date) return 0;
        const position = ((date.getTime() - openingTime) / totalDuration) * 100;
        return Math.max(0, Math.min(100, position));
      };

      positions = {
        opening: 0,
        closing: calculatePosition(timelineData.closing),
        allotment: calculatePosition(timelineData.allotment),
        today: calculatePosition(timelineData.today),
        listing: 100,
      };

      const openingColor = "#00914D";
      const subscriptionColor = "#B4292E";
      const processingColor = "#E4CA28";
      const listingColor = "#0073E6";

      gradientStyle = {
        background: `linear-gradient(to right,
          ${openingColor} ${positions.opening}%,
          ${subscriptionColor} ${positions.closing}%,
          ${processingColor} ${positions.allotment}%,
          ${listingColor} ${positions.listing}%
        )`,
      };
    }
  }

  const displayPrice = getDisplayPrice();
  const showPriceBox = displayPrice !== "N/A";
  const priceBoxPosition = `${(positions.opening + positions.closing) / 2}%`;

  const parsePercentage = (value: string): number => {
    if (!value) return 0;
    const match = value.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const investorData = [
    {
      label: "Retail Investor",
      value: editedAnalysis.ipo_details?.allocation_details?.retail || parsePercentage(ipo.ipo_details?.retail_quota || "35"),
    },
    {
      label: "NII",
      value: editedAnalysis.ipo_details?.allocation_details?.nii || parsePercentage(ipo.ipo_details?.nii_quota || "15"),
    },
    {
      label: "QIB",
      value: editedAnalysis.ipo_details?.allocation_details?.qib || parsePercentage(ipo.ipo_details?.qib_quota || "50"),
    },
    {
      label: "Total",
      value: 100,
    },
  ];

  const pieChartData = investorData
    .filter((d) => d.label !== "Total")
    .map((item) => ({
      name: item.label,
      value: item.value,
    }));

  const investorTableData = editedAnalysis.investorSplit?.filter(
    (row) => row.application.toLowerCase() !== "application"
  ) || [];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${editedAnalysis.company_name} IPO Analysis`,
          text: `Check out this comprehensive IPO analysis of ${editedAnalysis.company_name
            }. Score: ${overallScore.toFixed(1)}/10`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const handleTabClick = (value: string) => {
    setActiveTab(value);
    setSectionOrder((prev) => [value, ...prev.filter((tab) => tab !== value)]);
    setTimeout(() => {
      const section = sectionRefs.current[value];
      if (section)
        section.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  return (
    <div className="min-h-screen font-ibm-plex pt-[89px]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 w-full">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.history.back()}
                  className="border border-primary/20 hover:bg-primary/10 h-10 w-10 rounded-md flex items-center justify-center"
                  aria-label="Go back"
                >
                  <ArrowLeftCircle className="h-5 w-5 text-primary" />
                </button>
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                  {ipo.image_url?.trim() ? (
                    <AvatarImage
                      src={ipo.image_url}
                      alt={`${editedAnalysis.company_name} logo`}
                    />
                  ) : (
                    <AvatarFallback className="text-white bg-black border-black border-2 text-xs font-medium">
                      {getInitials(editedAnalysis.company_name || "")}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="heading-main text-lg md:text-xl lg:text-2xl text-primary truncate">
                  <EditableText
                    value={editedAnalysis.company_name || ""}
                    onSave={(val) => handleInlineSave("company_name", val)}
                    isAdmin={isAdmin}
                    textClassName="heading-main text-lg md:text-xl lg:text-2xl text-primary truncate"
                  /> IPO Analysis
                </h1>
                <p className="text-sm text-muted-foreground font-ibm-plex">
                  Comprehensive Investment Review
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isAdmin && (
                <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 border border-green-200 text-green-750 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Admin Mode Active
                </div>
              )}
              <button
                onClick={handleShare}
                className="border border-primary/20 hover:bg-primary/10 px-3 py-2 rounded-md text-sm flex items-center justify-center w-full sm:w-auto font-ibm-plex"
                aria-label="Share analysis"
              >
                <Share2 className="h-4 w-4 mr-2 text-primary" />
                Share
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Section 1: Key Metrics & Timeline */}
      <section className="main-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
          {/* Key Metrics */}
          <section aria-labelledby="key-metrics-heading">
            <h2 id="key-metrics-heading" className="sr-only">
              Key Investment Metrics
            </h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Overall Score",
                  value: `${overallScore.toFixed(1)}/10`,
                  color: getScoreColor(overallScore),
                  description: "Combined rating",
                  isScore: true,
                },
                {
                  label: "Issue Size",
                  value: editedAnalysis.ipo_details?.issue_size || "N/A",
                  color: "text-foreground",
                  description: "Total offering amount",
                  path: "ipo_details.issue_size",
                },
                {
                  label: "Price Band",
                  value: editedAnalysis.ipo_details?.price_band
                    ? editedAnalysis.ipo_details.price_band.includes("₹")
                      ? editedAnalysis.ipo_details.price_band
                      : "₹" + editedAnalysis.ipo_details.price_band
                    : "N/A",
                  color: "text-foreground",
                  description: "Price per share",
                  path: "ipo_details.price_band",
                },
                {
                  label: "GMP (Potential Gain)",
                  value: editedAnalysis.gmp_price_gain
                    ? `₹${editedAnalysis.gmp_price_gain}`
                    : ipo.gmp_price_gain
                      ? `₹${ipo.gmp_price_gain}`
                      : "N/A",
                  color: "text-emerald-600 dark:text-emerald-400",
                  description: "Grey Market Premium",
                  path: "gmp_price_gain",
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="bg-white/70 backdrop-blur-sm border p-4 sm:p-6 text-center rounded-lg flex flex-col justify-center min-h-[120px]"
                >
                  <p className="metric-card-label mb-2 text-base font-ibm-plex">
                    {metric.label}
                  </p>
                  {metric.isScore ? (
                    <p className={`metric-card-value ${metric.color} text-xl font-ibm-plex font-bold`}>
                      {metric.value}
                    </p>
                  ) : (
                    <EditableText
                      value={metric.path ? ((metric.path.split('.').reduce<unknown>((obj, key) => (obj as Record<string, unknown>)?.[key], editedAnalysis) as string | number | undefined) || "") : ""}
                      onSave={(val) => metric.path && handleInlineSave(metric.path, val)}
                      isAdmin={isAdmin}
                      textClassName={`metric-card-value ${metric.color} text-xl font-ibm-plex font-bold`}
                    />
                  )}
                  <p className="metric-card-description mt-1 text-sm font-ibm-plex text-gray-500">
                    {metric.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Timeline */}
          <section
            className="p-4 sm:p-6 bg-white/50 backdrop-blur-sm border rounded-xl"
            onDoubleClick={(e) => {
              if (isAdmin && !isEditingTimeline) {
                const target = e.target as HTMLElement;
                if (target.closest("button") || target.closest("a") || target.closest("input")) return;
                setIsEditingTimeline(true);
                toast.info("Timeline Editor Active", {
                  description: "Move mouse away from the editor panel to close.",
                });
              }
            }}
          >
            <h2 className="heading-section text-gray-800 mb-12 text-center sm:text-left select-none">
              Timeline {isAdmin && <span className="text-xs font-normal text-blue-500 ml-2">(Double-click here to edit dates)</span>}
            </h2>
            <div className="w-full mb-16">
              {isAdmin && isEditingTimeline && (
                <div
                  className="bg-blue-50/50 border border-blue-200 p-4 rounded-xl mb-6 grid grid-cols-2 md:grid-cols-5 gap-4 animate-in fade-in duration-200"
                  onMouseLeave={() => setIsEditingTimeline(false)}
                >
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-600">Opening Date</label>
                    <input
                      type="date"
                      value={timelineData.opening ? timelineData.opening.split('T')[0] : ""}
                      onChange={(e) => handleInlineSave("time.issue_dates.opening", e.target.value)}
                      className="bg-white border rounded px-2 py-1 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-600">Closing Date</label>
                    <input
                      type="date"
                      value={timelineData.closing ? timelineData.closing.split('T')[0] : ""}
                      onChange={(e) => handleInlineSave("time.issue_dates.closing", e.target.value)}
                      className="bg-white border rounded px-2 py-1 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-600">Allotment Date</label>
                    <input
                      type="date"
                      value={timelineData.allotment ? timelineData.allotment.split('T')[0] : ""}
                      onChange={(e) => handleInlineSave("time.allotment_timeline.date", e.target.value)}
                      className="bg-white border rounded px-2 py-1 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-600">Listing Date</label>
                    <input
                      type="date"
                      value={timelineData.listing ? timelineData.listing.split('T')[0] : ""}
                      onChange={(e) => handleInlineSave("time.listing_details.expected_date", e.target.value)}
                      className="bg-white border rounded px-2 py-1 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-600">Timing Score (1-10)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={editedAnalysis.time?.score ?? 5}
                      onChange={(e) => handleInlineSave("time.score", parseInt(e.target.value) || 0)}
                      className="bg-white border rounded px-2 py-1 text-sm outline-none focus:border-blue-500 font-bold"
                    />
                  </div>
                </div>
              )}
              {isTimelineValid ? (
                <div className="relative h-24 sm:h-12">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-full h-3 rounded-full"
                    style={gradientStyle}
                  />
                  <div
                    className="absolute top-1/2 h-8 w-1 bg-gray-800 rounded-full -translate-y-1/2 -translate-x-1/2"
                    style={{ left: `${positions.today}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-bold whitespace-nowrap">
                      Today
                    </div>
                  </div>
                  {showPriceBox && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-[#B4292E] text-white font-semibold text-sm px-3 py-1 rounded-md shadow-lg z-10 font-ibm-plex"
                      style={{ left: priceBoxPosition }}
                    >
                      {displayPrice}
                    </div>
                  )}
                  <div className="absolute inset-0">
                    <TimelineMarker
                      label="Opening"
                      date={timelineData.opening}
                      position={`${positions.opening}%`}
                      alignment="left"
                    />
                    <TimelineMarker
                      label="Closing"
                      date={timelineData.closing}
                      position={`${positions.closing}%`}
                      alignment="center"
                    />
                    <TimelineMarker
                      label="Allotment"
                      date={timelineData.allotment}
                      position={`${positions.allotment}%`}
                      alignment="center"
                    />
                    <TimelineMarker
                      label="Listing"
                      date={timelineData.listing}
                      position={`${positions.listing}%`}
                      alignment="right"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground font-ibm-plex py-8">
                  IPO timeline will be displayed once opening and listing dates are available.
                </div>
              )}
            </div>
          </section>

          {/* Investor Split & Application Details */}
          <section className="p-4 sm:p-6 bg-white/70 backdrop-blur-sm border rounded-xl shadow-sm">
            <h2 className="heading-section text-blue-600 mb-6 text-center sm:text-left">
              Investor Split & Application Details
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="w-full h-full">
                <h4 className="heading-subsection text-center mb-4">
                  Allocation Quota
                </h4>
                <InvestorSplitPieChart data={pieChartData} />
              </div>

              <div className="w-full">
                <h4 className="heading-subsection text-center mb-4">
                  Application Size
                </h4>
                {investorTableData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Application</TableHead>
                        <TableHead>Lot Size</TableHead>
                        <TableHead>Shares</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {investorTableData.map((row: IPOInvestorSplit, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{row.application || "-"}</TableCell>
                          <TableCell>{row.lot_size || "-"}</TableCell>
                          <TableCell>{row.shares || "-"}</TableCell>
                          <TableCell>{row.amount || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground mt-8">
                    Application details are not available.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      </section>

      {/* Financial Performance Trend Chart */}
      <section className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="backdrop-blur-sm border shadow-lg">
            <CardHeader>
              <CardTitle className="heading-card-title text-foreground pt-4 text-2xl sm:text-lg font-ibm-plex">
                Financial Performance Trend
              </CardTitle>
              <i className="text-muted-foreground text-sm">(Amount ₹ in Crores)</i>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={editedAnalysis.financialReport?.map(report => ({
                      year: `FY ${report.period_ended}`,
                      Revenue: parseFloat(report.revenue || "0"),
                      Expense: parseFloat(report.expense || "0"),
                      "Profit After Tax": parseFloat(report.profit_after_tax || "0")
                    })) || []}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" className="font-ibm-plex text-sm" />
                    <YAxis
                      className="font-ibm-plex text-sm"
                      label={{ value: "Amount (CR)", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip contentStyle={{ backgroundColor: "white", borderRadius: "8px" }} />
                    <Legend wrapperStyle={{ fontFamily: "IBM Plex Sans, sans-serif" }} />

                    <Bar
                      dataKey="Revenue"
                      fill="#0073E6"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    />
                    <Bar
                      dataKey="Expense"
                      fill="#B4292E"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    />
                    <Bar
                      dataKey="Profit After Tax"
                      fill="#00914D"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1400}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 3: Investment Summary */}
      <section className="main-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-white/80 backdrop-blur-sm border shadow-lg">
            <CardHeader>
              <CardTitle className="heading-card-title text-foreground pt-4 text-2xl sm:text-lg font-ibm-plex">
                Investment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 grid-cols-2 sm:grid-cols-2 text-center px-6">
              <div>
                <p className="summary-score-label mb-2 text-base font-ibm-plex">
                  Profitability Score
                </p>
                <EditableText
                  value={editedAnalysis.ipo_details?.profitability_of_allotment?.score ?? 0}
                  onSave={(val) => handleInlineSave("ipo_details.profitability_of_allotment.score", parseInt(val) || 0)}
                  type="number"
                  isAdmin={isAdmin}
                  textClassName={`summary-score-value text-xl font-bold font-ibm-plex ${getScoreColor(editedAnalysis.ipo_details?.profitability_of_allotment?.score ?? 0)}`}
                  renderText={(val) => <span>{val}/10</span>}
                />
              </div>
              <div>
                <p className="summary-score-label mb-2 text-base font-ibm-plex">
                  Assessment
                </p>
                <EditableText
                  value={editedAnalysis.ipo_details?.profitability_of_allotment?.assessment ?? ""}
                  onSave={(val) => handleInlineSave("ipo_details.profitability_of_allotment.assessment", val)}
                  type="textarea"
                  isAdmin={isAdmin}
                  textClassName={`summary-assessment-text text-sm font-ibm-plex ${getScoreColor(editedAnalysis.ipo_details?.profitability_of_allotment?.score ?? 0)} block`}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 2: Analysis Sections */}
      <section className="main-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Sticky Navigation */}
          <div className="sticky top-[89px] z-40 py-6">
            <div className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-[#E6F4FE] backdrop-blur-sm rounded-full border border-gray-200">
              {[
                "performance",
                "fundamentals",
                "risk",
                "flexibility",
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  className={`sticky-tab-button text-sm py-2 px-2 sm:px-3 transition-colors capitalize font-medium font-ibm-plex ${activeTab === tab
                    ? "bg-[#99CCFF] text-[#0073E6] shadow-md"
                    : "hover:bg-[#99CCFF]/50 text-[#0073E6]"
                    }`}
                >
                  {tab.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Analysis Content */}
          <div className="pb-8">
            <section aria-labelledby="analysis-sections-heading">
              <h2 id="analysis-sections-heading" className="sr-only">
                Detailed Analysis Sections
              </h2>
              {sectionOrder.map((tab) => (
                <div
                  key={tab}
                  ref={(el) => {
                    sectionRefs.current[tab] = el;
                  }}
                  id={tab}
                  className="scroll-mt-[300px] sm:scroll-mt-[150px] mb-8"
                >
                  {tab === "performance" && editedAnalysis.performance && (
                    <div className="p-4 sm:p-6 bg-white/70 backdrop-blur-sm border rounded-xl">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <h3 className="heading-section text-blue-600">
                            Performance
                          </h3>
                          <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                            Score:{" "}
                            <EditableText
                              value={editedAnalysis.performance?.score ?? 0}
                              onSave={(val) => handleInlineSave("performance.score", parseInt(val) || 0)}
                              type="number"
                              isAdmin={isAdmin}
                              inputClassName="w-10 text-center font-bold text-xs p-0.5 rounded border border-blue-500 bg-white"
                              textClassName="text-sm font-bold text-blue-700 cursor-pointer"
                              renderText={(val) => <span>{val}/10</span>}
                            />
                          </span>
                        </div>
                      </div>
                      <ul className="space-y-6 list-disc list-outside pl-5">
                        <li>
                          <h4 className="heading-subsection">
                            Company Performance
                          </h4>
                          <EditableText
                            value={editedAnalysis.performance.summary}
                            onSave={(val) => handleInlineSave("performance.summary", val)}
                            type="textarea"
                            isAdmin={isAdmin}
                            textClassName="text-body whitespace-pre-wrap block"
                          />
                        </li>
                        {editedAnalysis.performance.management_quality && (
                          <li>
                            <h4 className="heading-subsection">
                              Management Quality
                            </h4>
                            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full">
                              <div className="flex-shrink-0">
                                <ProgressCircle
                                  label="Mgmt Score"
                                  value={editedAnalysis.performance.management_quality.score || 0}
                                  onSaveScore={(val) => handleInlineSave("performance.management_quality.score", parseInt(val) || 0)}
                                  isAdmin={isAdmin}
                                />
                              </div>
                              <div className="flex-1 space-y-2 text-body-sm w-full">
                                <div>
                                  <strong>Experience:</strong>{" "}
                                  <EditableText
                                    value={editedAnalysis.performance.management_quality.experience || ""}
                                    onSave={(val) => handleInlineSave("performance.management_quality.experience", val)}
                                    type="textarea"
                                    isAdmin={isAdmin}
                                    textClassName="text-gray-800"
                                  />
                                </div>
                                <div>
                                  <strong>Track Record:</strong>{" "}
                                  <EditableText
                                    value={editedAnalysis.performance.management_quality.track_record || ""}
                                    onSave={(val) => handleInlineSave("performance.management_quality.track_record", val)}
                                    type="textarea"
                                    isAdmin={isAdmin}
                                    textClassName="text-gray-800"
                                  />
                                </div>
                              </div>
                            </div>
                          </li>
                        )}
                        {editedAnalysis.performance.key_achievements && (
                          <li>
                            <h4 className="heading-subsection">
                              Key Achievements
                            </h4>
                            <EditableText
                              value={editedAnalysis.performance.key_achievements.join("\n")}
                              onSave={(val) => handleInlineArraySave("performance.key_achievements", val)}
                              type="textarea"
                              isAdmin={isAdmin}
                              renderText={(val) => (
                                <div className="space-y-1 text-body-sm">
                                  {val.split("\n").filter(a => a.trim() !== "").map((achievement, index) => (
                                    <p key={index} className="text-gray-800">• {achievement}</p>
                                  ))}
                                </div>
                              )}
                            />
                          </li>
                        )}
                        {editedAnalysis.performance.market_comparison && (
                          <li>
                            <h4 className="heading-subsection">
                              Market Comparison
                            </h4>
                            <EditableText
                              value={editedAnalysis.performance.market_comparison}
                              onSave={(val) => handleInlineSave("performance.market_comparison", val)}
                              type="textarea"
                              isAdmin={isAdmin}
                              textClassName="text-body whitespace-pre-wrap block"
                            />
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {tab === "fundamentals" && editedAnalysis.fundamentals && (
                    <div className="p-4 sm:p-6 bg-white/70 backdrop-blur-sm border rounded-xl">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <h3 className="heading-section text-blue-600">
                            Fundamentals
                          </h3>
                          <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                            Score:{" "}
                            <EditableText
                              value={editedAnalysis.fundamentals?.score ?? 0}
                              onSave={(val) => handleInlineSave("fundamentals.score", parseInt(val) || 0)}
                              type="number"
                              isAdmin={isAdmin}
                              inputClassName="w-10 text-center font-bold text-xs p-0.5 rounded border border-blue-500 bg-white"
                              textClassName="text-sm font-bold text-blue-700 cursor-pointer"
                              renderText={(val) => <span>{val}/10</span>}
                            />
                          </span>
                        </div>
                      </div>
                      <ul className="space-y-6 list-disc list-outside pl-5">
                        <li>
                          <h4 className="heading-subsection">
                            Financial Fundamentals
                          </h4>
                          <EditableText
                            value={editedAnalysis.fundamentals.summary}
                            onSave={(val) => handleInlineSave("fundamentals.summary", val)}
                            type="textarea"
                            isAdmin={isAdmin}
                            textClassName="text-body whitespace-pre-wrap block"
                          />
                        </li>
                      </ul>
                    </div>
                  )}

                  {tab === "risk" && editedAnalysis.risk_meter && (
                    <div className="p-4 sm:p-6 bg-white/70 backdrop-blur-sm border rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h3 className="heading-section text-blue-600">
                            Risk Assessment
                          </h3>
                          <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                            Score:{" "}
                            <EditableText
                              value={editedAnalysis.risk_meter?.score ?? 0}
                              onSave={(val) => handleInlineSave("risk_meter.score", parseInt(val) || 0)}
                              type="number"
                              isAdmin={isAdmin}
                              inputClassName="w-10 text-center font-bold text-xs p-0.5 rounded border border-blue-500 bg-white"
                              textClassName="text-sm font-bold text-blue-700 cursor-pointer"
                              renderText={(val) => <span>{val}/10</span>}
                            />
                          </span>
                        </div>
                      </div>
                      <EditableText
                        value={editedAnalysis.risk_meter.summary}
                        onSave={(val) => handleInlineSave("risk_meter.summary", val)}
                        type="textarea"
                        isAdmin={isAdmin}
                        className="mb-8 block"
                        textClassName="text-body whitespace-pre-wrap block"
                      />
                      {editedAnalysis.risk_meter.risk_categories && (
                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
                          {Object.entries(editedAnalysis.risk_meter.risk_categories).map(
                            ([category, risks]) => (
                              <Card key={category}>
                                <CardHeader>
                                  <CardTitle
                                    className={`capitalize text-xl font-semibold font-ibm-plex ${riskCategoryColors[category] || riskCategoryColors.default
                                      }`}
                                  >
                                    {category.replace(/_/g, " ")}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <EditableText
                                    value={(risks as string[]).join("\n")}
                                    onSave={(val) => handleInlineArraySave(`risk_meter.risk_categories.${category}`, val)}
                                    type="textarea"
                                    isAdmin={isAdmin}
                                    renderText={(val) => (
                                      <ul className="list-disc list-outside space-y-2 pl-5 text-body-sm">
                                        {val.split("\n").filter(a => a.trim() !== "").map((risk, i) => (
                                          <li key={i} className="text-gray-800">
                                            {risk}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  />
                                </CardContent>
                              </Card>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {tab === "flexibility" && editedAnalysis.flexibility && (
                    <div className="p-4 sm:p-6 bg-white/70 backdrop-blur-sm border rounded-xl">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <h3 className="heading-section text-blue-600">
                            Business Flexibility & Adaptability
                          </h3>
                          <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                            Score:{" "}
                            <EditableText
                              value={editedAnalysis.flexibility?.score ?? 0}
                              onSave={(val) => handleInlineSave("flexibility.score", parseInt(val) || 0)}
                              type="number"
                              isAdmin={isAdmin}
                              inputClassName="w-10 text-center font-bold text-xs p-0.5 rounded border border-blue-500 bg-white"
                              textClassName="text-sm font-bold text-blue-700 cursor-pointer"
                              renderText={(val) => <span>{val}/10</span>}
                            />
                          </span>
                        </div>
                      </div>
                      <div className="mb-12">
                        <ul className="space-y-6 list-disc list-outside pl-5">
                          <li>
                            <h4 className="heading-subsection">
                              Flexibility and Adaptability Insights
                            </h4>
                            <EditableText
                              value={editedAnalysis.flexibility.summary}
                              onSave={(val) => handleInlineSave("flexibility.summary", val)}
                              type="textarea"
                              isAdmin={isAdmin}
                              textClassName="text-body whitespace-pre-wrap block"
                            />
                          </li>
                        </ul>
                      </div>
                      <div className="grid gap-8 grid-cols-1 sm:grid-cols-3 justify-items-center">
                        {[
                          {
                            label: "Market Adaptability",
                            metric: editedAnalysis.flexibility.market_adaptability,
                            path: "flexibility.market_adaptability",
                          },
                          {
                            label: "Financial Stability",
                            metric: editedAnalysis.flexibility.financial_stability,
                            path: "flexibility.financial_stability",
                          },
                          {
                            label: "Operational Agility",
                            metric: editedAnalysis.flexibility.operational_agility,
                            path: "flexibility.operational_agility",
                          },
                        ].map(({ label, metric, path }) => {
                          if (!metric) return null;
                          return (
                            <ProgressCircle
                              key={label}
                              label={label}
                              value={metric.score || 0}
                              description={metric.description || ""}
                              onSaveScore={(val) => handleInlineSave(`${path}.score`, parseInt(val) || 0)}
                              onSaveDescription={(val) => handleInlineSave(`${path}.description`, val)}
                              isAdmin={isAdmin}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </section>
          </div>
        </div>
      </section>

      {/* Floating Admin Status Bar */}
      {isAdmin && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 bg-white/95 backdrop-blur-md border border-blue-200 p-4 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3">
            {isSaving ? (
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center border border-green-150">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-500">Administrative Dashboard</span>
              <span className="text-sm font-semibold text-gray-800">
                {isSaving ? "Saving changes..." : "Direct Inline Field Editing Active"}
              </span>
              <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                Double-click any text or score to edit then & there
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}