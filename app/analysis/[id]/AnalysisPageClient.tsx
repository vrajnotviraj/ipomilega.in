"use client";
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Share2,
  TrendingUp,
  Plus,
  Minus,
  ChevronUp,
  ChevronRight,
  User,
  Users,
  Landmark,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis";
import { Ipo } from "@/types/ipo";
import { toast } from "sonner";
import { cn, getInitials } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useRouter } from "next/navigation";
import {
  getIpoType,
  formatIssueSize,
  isUnfixedValue,
  parseCardDate,
  getScoreTrustLabel,
  getAllotmentProbability,
  getProbabilityColor,
  formatAllotmentOdds,
  ALLOTMENT_CATEGORIES,
  getAllotmentRatio,
  type AllotmentCategoryDef,
} from "@/lib/ipo-format";
import { AllotmentPredictorModal } from "@/components/ipo/AllotmentPredictorModal";
import { GmpTrendChart } from "@/components/charts/GmpTrendChart";
import { buildShareMessage, gmpLine, type ShareFacts } from "@/lib/share";
import { parseEstListingPercent } from "@/lib/ipo-format";

// Same icons as the home-page card, so both allotment rows read as one control.
const ALLOTMENT_ICONS: Record<AllotmentCategoryDef["key"], typeof User> = {
  retail: User,
  shni: Users,
  bhni: Landmark,
};


const RISK_CATEGORY_COLORS: Record<string, string> = {
  market_risks: "text-score-bad",
  financial_risks: "text-score-mid",
  operational_risks: "text-muted-foreground",
  regulatory_risks: "text-primary",
};

interface AnalysisPageClientProps {
  analysis: IpoComprehensiveAnalysis;
  ipo: Ipo;
}

// One color scale for every score on the page.
const SCORE_STYLES = {
  good: { text: "text-score-good", badge: "bg-score-good/15 text-score-good border-score-good/30", bar: "bg-score-good", fill: "var(--score-good)" },
  mid: { text: "text-score-mid", badge: "bg-score-mid/15 text-score-mid border-score-mid/30", bar: "bg-score-mid", fill: "var(--score-mid)" },
  bad: { text: "text-score-bad", badge: "bg-score-bad/15 text-score-bad border-score-bad/30", bar: "bg-score-bad", fill: "var(--score-bad)" },
};

const scoreStyle = (score: number) => SCORE_STYLES[score >= 8 ? "good" : score >= 6 ? "mid" : "bad"];

/** Width of a 0-10 score as a clamped CSS percentage. */
const scoreWidth = (score: number) => `${Math.max(0, Math.min(100, score * 10))}%`;

/** Labelled horizontal bar for a sub-metric score. */
const ScoreBar = ({
  label,
  score,
}: {
  label: string;
  score: number;
}) => (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className={cn("font-mono text-sm font-semibold", scoreStyle(score).text)}>
          {score.toFixed(1)}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", scoreStyle(score).bar)}
          style={{ width: scoreWidth(score) }}
        />
      </div>
    </div>
);

/** Pentagon radar of the section scores, with the overall score inside a gains-potential ring. */
const OverviewRadar = ({
  axes,
  overallScore,
  gainsPotential,
}: {
  axes: { label: string; score: number }[];
  overallScore: number;
  gainsPotential: number;
}) => {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const gridR = 78;
  const ringR = 108;
  const n = axes.length;

  const pointFor = (i: number, r: number) => {
    const angle = -90 + i * (360 / n);
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const gridLevels = [0.33, 0.66, 1];
  const valuePoints = axes.map((a, i) => pointFor(i, gridR * Math.min(a.score, 10) / 10));
  const valuePath = valuePoints.map((p) => `${p.x},${p.y}`).join(" ");

  const gainsPct = Math.max(0, Math.min(100, gainsPotential));
  const ringCircumference = 2 * Math.PI * ringR;
  const ringOffset = ringCircumference * (1 - gainsPct / 100);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={ringR}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={6}
        />
        <circle
          cx={cx}
          cy={cy}
          r={ringR}
          fill="none"
          stroke="var(--score-mid)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={ringCircumference}
          strokeDashoffset={ringOffset}
          style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }}
        />

        {gridLevels.map((lvl) => (
          <polygon
            key={lvl}
            points={axes.map((_, i) => {
              const p = pointFor(i, gridR * lvl);
              return `${p.x},${p.y}`;
            }).join(" ")}
            fill="none"
            stroke="var(--border)"
            strokeWidth={1}
          />
        ))}
        {axes.map((_, i) => {
          const p = pointFor(i, gridR);
          return (
            <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth={1} />
          );
        })}

        <polygon points={valuePath} fill="var(--primary)" fillOpacity={0.18} stroke="var(--primary)" strokeWidth={2} />
        {axes.map((a, i) => (
          <circle key={i} cx={valuePoints[i].x} cy={valuePoints[i].y} r={4} fill={scoreStyle(a.score).fill} stroke="var(--card)" strokeWidth={1.5} />
        ))}

        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10, letterSpacing: 1, fontFamily: "var(--font-mono)" }}>
          OVERALL
        </text>
        <text x={cx} y={cy + 22} textAnchor="middle" fill="var(--foreground)" style={{ fontSize: 34, fontWeight: 600, fontFamily: "var(--font-serif)" }}>
          {overallScore.toFixed(1)}
        </text>
        <text x={cx} y={cy + 36} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}>
          / 10
        </text>
      </svg>
      <p className="text-xs text-muted-foreground text-center mt-2 max-w-[220px] font-sans">
        Approx. gains potential <span className="font-mono font-semibold text-score-mid">{gainsPotential}%</span> (fundamentals only)
      </p>
    </div>
  );
};

const QuotaDonut = ({ data }: { data: { name: string; value: number; color: string }[] }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) {
    return <div className="text-sm text-muted-foreground text-center py-8">Quota data unavailable.</div>;
  }
  // Side by side on mobile, stacked in the narrow desktop column beside the verdict.
  return (
    <div className="h-full flex flex-col">
      <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-3">Quota split</div>
      <div className="flex-1 flex items-center justify-center gap-6 lg:flex-col lg:gap-4">
        <div className="w-[130px] h-[130px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={63}
                stroke="var(--card)"
                strokeWidth={2}
                isAnimationActive
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1.5 lg:space-y-0 lg:flex lg:gap-4">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-foreground font-medium">{d.name}</span>
              <span className="font-mono text-muted-foreground">{d.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/** Open, close, allotment and listing on a rail spaced by date, with a marker for today. */
const AnalysisTimeline = ({
  opening,
  closing,
  allotment,
  listing,
}: {
  opening: string;
  closing: string;
  allotment: string;
  listing: string;
}) => {
  // Read after mount: the page is ISR-cached, so a server-side date would be stale and break hydration.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);

  const parseDate = (s: string) => {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  // Whole IST days, so today's time of day does not push the marker past the station it is on.
  const dayNumber = (d: Date) => {
    const [y, m, day] = d
      .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
      .split("-")
      .map(Number);
    return Date.UTC(y, m - 1, day) / 86_400_000;
  };

  const openD = parseDate(opening);
  const listD = parseDate(listing);

  if (!openD || !listD || dayNumber(listD) <= dayNumber(openD)) {
    return (
      <div className="text-center text-sm text-muted-foreground py-6 font-sans">
        Timeline will be available once opening and listing dates are confirmed.
      </div>
    );
  }

  const openDay = dayNumber(openD);
  const total = dayNumber(listD) - openDay;
  const posOf = (s: string) => {
    const d = parseDate(s);
    if (!d) return 0;
    return Math.max(0, Math.min(100, ((dayNumber(d) - openDay) / total) * 100));
  };

  // Date-proportional positions; "today" is mapped through the same spreading as the stations.
  const truePositions = [0, posOf(closing), posOf(allotment), 100];
  for (let i = 1; i < truePositions.length; i++) {
    truePositions[i] = Math.max(truePositions[i], truePositions[i - 1]);
  }

  // Spread close dates apart so labels do not overlap, keeping Open and Listing at the ends.
  const MIN_GAP = 20;
  const positions = [...truePositions];
  for (let i = 1; i < positions.length; i++) {
    positions[i] = Math.max(positions[i], positions[i - 1] + MIN_GAP);
  }
  for (let i = positions.length - 2; i >= 0; i--) {
    positions[i] = Math.min(positions[i], positions[i + 1] - MIN_GAP);
  }

  // Piecewise-linear map from a date-proportional position to its drawn position.
  const toDisplay = (raw: number) => {
    if (raw <= truePositions[0]) return positions[0];
    for (let i = 1; i < truePositions.length; i++) {
      if (raw <= truePositions[i]) {
        const span = truePositions[i] - truePositions[i - 1];
        const t = span === 0 ? 1 : (raw - truePositions[i - 1]) / span;
        return positions[i - 1] + t * (positions[i] - positions[i - 1]);
      }
    }
    return positions[positions.length - 1];
  };

  const todayRaw = today ? ((dayNumber(today) - openDay) / total) * 100 : 0;
  // How much of the rail is behind us: nothing before the issue opens, all of it once listed.
  const progressPct = !today ? 0 : todayRaw < 0 ? 0 : todayRaw > 100 ? 100 : toDisplay(todayRaw);
  // Keep the marker and its label inside the box at both extremes.
  const todayPos = Math.max(4, Math.min(96, progressPct));

  const stations = [
    { label: "Open", date: opening, pos: positions[0], align: "left" as const },
    { label: "Close", date: closing, pos: positions[1], align: "center" as const },
    { label: "Allotment", date: allotment, pos: positions[2], align: "center" as const },
    { label: "Listing", date: listing, pos: positions[3], align: "right" as const },
  ];

  const fmt = (s: string) => {
    const d = parseDate(s);
    if (!d) return "TBA";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const todayLabel = today ? today.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "";
  const isReached = (date: string) => {
    const d = parseDate(date);
    return !!d && !!today && dayNumber(d) <= dayNumber(today);
  };
  const offsetClass = (align: "left" | "center" | "right") =>
    align === "left" ? "" : align === "right" ? "-translate-x-full" : "-translate-x-1/2";

  return (
    <>
      {/* Narrow screens have no room for four date labels on a rail, so use a list. */}
      <div className="sm:hidden space-y-4">
        {stations.map((s) => {
          const reached = isReached(s.date);
          return (
            <div key={s.label} className="flex items-center gap-3">
              <span
                className={cn(
                  "w-3 h-3 rounded-full border-2 flex-shrink-0",
                  reached ? "bg-score-good border-score-good" : "bg-card border-muted-foreground/40"
                )}
              />
              <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground w-24 flex-shrink-0">{s.label}</div>
              <div className="text-sm font-mono font-semibold text-foreground">{fmt(s.date)}</div>
            </div>
          );
        })}
        {today && (
          <div className="flex items-center gap-3 pt-3 border-t border-dashed border-border">
            <ChevronRight className="w-3 h-3 text-score-good flex-shrink-0" strokeWidth={3} />
            <div className="text-xs font-mono uppercase tracking-wide text-score-good w-24 flex-shrink-0">Today</div>
            <div className="text-sm font-mono font-semibold text-score-good">{todayLabel}</div>
          </div>
        )}
      </div>

      <div className="hidden sm:block pt-2">
        <div className="relative h-5">
          {stations.map((s) => (
            <div
              key={s.label}
              className={cn(
                "absolute top-0 text-xs font-mono uppercase tracking-wide text-muted-foreground whitespace-nowrap",
                offsetClass(s.align)
              )}
              style={{ left: `${s.pos}%` }}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* Grey track, filled green up to today, one dot per station */}
        <div className="relative h-4 my-1.5">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-border" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-score-good transition-[width] duration-500"
            style={{ width: `${progressPct}%` }}
          />
          {stations.map((s) => (
            <span
              key={s.label}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2",
                offsetClass(s.align),
                isReached(s.date) ? "bg-score-good border-score-good" : "bg-card border-muted-foreground/40"
              )}
              style={{ left: `${s.pos}%` }}
            />
          ))}
        </div>

        {/* Fixed height so nothing shifts when the today marker appears. */}
        <div className="relative h-9">
          {today && (
            <div
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${todayPos}%` }}
            >
              <ChevronUp className="w-4 h-4 -mt-1 text-score-good" strokeWidth={2.5} />
              <span className="text-[10px] font-mono uppercase tracking-wide text-score-good whitespace-nowrap">
                Today &middot; {todayLabel}
              </span>
            </div>
          )}
        </div>

        <div className="relative h-5">
          {stations.map((s) => (
            <div
              key={s.label}
              className={cn(
                "absolute top-0 text-sm font-mono font-semibold text-foreground whitespace-nowrap",
                offsetClass(s.align)
              )}
              style={{ left: `${s.pos}%` }}
            >
              {fmt(s.date)}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

const SectionHeading = ({
  num,
  title,
  score,
}: {
  num: string;
  title: string;
  score: number;
}) => (
  <div className="flex items-center justify-between mb-6 gap-3">
    <div className="flex items-baseline gap-3">
      <span className="text-sm italic font-serif text-muted-foreground">{num}</span>
      <h2 className="text-2xl font-semibold font-serif text-foreground">{title}</h2>
    </div>
    <span className={cn("px-2.5 py-1 rounded-full border text-sm font-mono font-semibold flex items-center gap-1", scoreStyle(score).badge)}>
      {score.toFixed(1)}/10
    </span>
  </div>
);

export default function AnalysisPageClient({ analysis, ipo }: AnalysisPageClientProps) {
  const [predictorCategory, setPredictorCategory] = useState<AllotmentCategoryDef["key"] | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  // The URL in the address bar, read on the client so a share carries it.
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  const router = useRouter();

  // Measured, not hardcoded: header heights differ per breakpoint, and anchors must clear
  // the site header plus this page's sticky header and tab bar.
  const chromeRef = useRef<HTMLDivElement | null>(null);
  const [siteHeaderHeight, setSiteHeaderHeight] = useState(64);

  useEffect(() => {
    const siteHeader = document.querySelector("header.fixed");
    const measure = () => {
      const top = siteHeader?.getBoundingClientRect().height ?? 64;
      setSiteHeaderHeight(top);
      // scroll-padding covers every anchor jump, including scrollIntoView.
      document.documentElement.style.scrollPaddingTop = `${top + (chromeRef.current?.offsetHeight ?? 0) + 12}px`;
    };

    measure();
    const observer = new ResizeObserver(measure);
    if (siteHeader) observer.observe(siteHeader);
    if (chromeRef.current) observer.observe(chromeRef.current);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      document.documentElement.style.scrollPaddingTop = "";
    };
  }, []);

  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const sectionRef = (key: string) => (el: HTMLElement | null) => {
    sectionRefs.current[key] = el;
  };

  const fundamentalsScore = analysis.fundamentals?.score ?? 0;
  const riskScore = analysis.risk_meter?.score ?? 0;
  const performanceScore = analysis.performance?.score ?? 0;
  const flexibilityScore = analysis.flexibility?.score ?? 0;
  const timeScore = analysis.time?.score ?? 0;

  const overallScore =
    (fundamentalsScore + riskScore + performanceScore + flexibilityScore + timeScore) / 5;

  const gainsPotential = analysis.ipo_details?.approximate_gains_potential ?? 0;

  const radarAxes = [
    { label: "Financials", score: fundamentalsScore },
    { label: "Performance", score: performanceScore },
    { label: "Flexibility", score: flexibilityScore },
    { label: "Timing", score: timeScore },
    { label: "Risk", score: riskScore },
  ];

  const priceBand = analysis.ipo_details?.price_band;

  // Bands come as "130 - 140", "₹130 to 140 Per Share" or "140"; the cut-off is the last number.
  const priceBandNumbers =
    typeof priceBand === "string" ? priceBand.replace(/,/g, "").match(/\d+(?:\.\d+)?/g) : null;
  const upperPrice = priceBandNumbers?.length ? parseFloat(priceBandNumbers[priceBandNumbers.length - 1]) : null;

  // An unfixed band reads "[●] to [●] Per Share"; a rupee sign would make it look like a price.
  const formattedPriceBand = !priceBand
    ? "N/A"
    : isUnfixedValue(priceBand)
      ? "Price TBA"
      : priceBand.includes("₹")
        ? priceBand
        : `₹${priceBand}`;

  // `shares` is shares per lot and `lot_size` the lot count, so one lot costs price x shares.
  const lotShares = analysis.ipo_details?.shares || analysis.ipo_details?.lot_size;
  const minInvestment = upperPrice && lotShares ? upperPrice * lotShares : null;

  const timelineData = {
    opening: analysis.time?.issue_dates?.opening || "",
    closing: analysis.time?.issue_dates?.closing || "",
    allotment: analysis.time?.allotment_timeline?.date || "",
    listing: analysis.time?.listing_details?.expected_date || "",
  };

  const ipoType = getIpoType(ipo);

  // The same odds the home-page card leads with.
  const allotmentCategories = ALLOTMENT_CATEGORIES.map((cat) => {
    const { lottery } = getAllotmentRatio(ipo, cat);
    return {
      ...cat,
      icon: ALLOTMENT_ICONS[cat.key],
      probability: getAllotmentProbability(lottery),
      odds: formatAllotmentOdds(lottery),
    };
  });

  const getStatusInfo = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const open = parseCardDate(timelineData.opening);
    const close = parseCardDate(timelineData.closing);
    if (!open || !close) return { label: "Status Unknown", cls: "bg-muted text-muted-foreground border-border" };
    open.setHours(0, 0, 0, 0);
    close.setHours(0, 0, 0, 0);
    if (today > close) return { label: "CLOSED", cls: "bg-muted text-muted-foreground border-border" };
    if (today >= open) return { label: "OPEN", cls: "bg-score-good text-primary-foreground border-transparent" };
    return { label: "UPCOMING", cls: "bg-score-mid/15 text-score-mid border-score-mid/30" };
  };
  const statusInfo = getStatusInfo();

  const parsePercentage = (value: string) => {
    const match = value.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const allocation = analysis.ipo_details?.allocation_details;
  const quotaData = [
    { name: "QIB", value: allocation?.qib || parsePercentage(ipo.ipo_details?.qib_quota || "50"), color: "var(--chart-1)" },
    { name: "NII", value: allocation?.nii || parsePercentage(ipo.ipo_details?.nii_quota || "15"), color: "var(--chart-3)" },
    { name: "Retail", value: allocation?.retail || parsePercentage(ipo.ipo_details?.retail_quota || "35"), color: "var(--chart-2)" },
  ];

  const investorTableData =
    analysis.investorSplit?.filter((row) => row.application.toLowerCase() !== "application") || [];

  const strengthsAndConcerns = [
    {
      title: "Strengths",
      items: (analysis.performance?.key_achievements || []).filter((s) => s.trim() !== ""),
      color: "text-score-good",
      Icon: Plus,
      empty: "No highlighted strengths yet.",
    },
    {
      title: "Concerns",
      items: (analysis.risk_meter?.key_risks || []).filter((s) => s.trim() !== ""),
      color: "text-score-bad",
      Icon: Minus,
      empty: "No flagged concerns yet.",
    },
  ];

  const gmpValue = analysis.gmp_price_gain || ipo.gmp_price_gain || "";
  const hasGmp = gmpValue && gmpValue !== "N/A" && gmpValue !== "TBD" && gmpValue !== "TBA";
  // gmpValue is the estimated listing ("360 (31.25%)"), so the GMP tile shows the premium itself,
  // matching the trend chart, and falls back to just the gain when no premium was scraped.
  const gmpPercent = parseEstListingPercent(gmpValue);
  const gmpTile = ipo.gmp_ipo_gmp && !isNaN(parseFloat(ipo.gmp_ipo_gmp))
    ? `₹${ipo.gmp_ipo_gmp}${gmpPercent != null ? ` (${gmpPercent >= 0 ? "+" : ""}${gmpPercent}%)` : ""}`
    : gmpLine(hasGmp ? gmpValue : null)?.replace(/^GMP /, "") ?? "N/A";

  // Built from the values this page renders, so a shared message never drifts from the page.
  const shareFacts: ShareFacts = {
    companyName: analysis.company_name,
    slug: analysis.slug || ipo.slug || "",
    gmp: hasGmp ? gmpValue : null,
    opening: timelineData.opening,
    closing: timelineData.closing,
    businessModel: analysis.fundamentals?.business_model || analysis.fundamentals?.summary || null,
    url: shareUrl,
  };

  /** Open the system share sheet, or copy the message where there is none. */
  const handleShare = async () => {
    const message = buildShareMessage(shareFacts);

    // No `url` field: the message already ends with the link, and WhatsApp would paste it twice.
    if (navigator.share) {
      try {
        await navigator.share({ title: `${analysis.company_name} IPO`, text: message });
      } catch {
        // Share sheet dismissed.
      }
      return;
    }

    await navigator.clipboard.writeText(message);
    toast.success("IPO details copied", { description: "Paste it to whoever you want to send it to." });
  };

  // Timing comes right after the overview: whether to apply now is the first question people bring.
  const sections = [
    { key: "overview", num: "00", label: "Overview" },
    { key: "timing", num: "01", label: "Timing", score: timeScore },
    { key: "financials", num: "02", label: "Financials", score: fundamentalsScore },
    { key: "risk", num: "03", label: "Risk", score: riskScore },
    { key: "performance", num: "04", label: "Performance", score: performanceScore },
    { key: "flexibility", num: "05", label: "Flexibility", score: flexibilityScore },
  ];

  // The scroll spy pauses during a tab's smooth scroll so it does not light up every section it passes.
  const spyPausedUntil = useRef(0);

  const handleTabClick = (key: string) => {
    setActiveTab(key);
    spyPausedUntil.current = Date.now() + 900;
    sectionRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Scroll spy: the active tab follows the section under the sticky header.
  useEffect(() => {
    let frame = 0;
    let resume = 0;
    const update = () => {
      frame = 0;
      const wait = spyPausedUntil.current - Date.now();
      if (wait > 0) {
        // A long jump can outlast the pause; wait for scrolling to go quiet, then read once.
        spyPausedUntil.current = Math.max(spyPausedUntil.current, Date.now() + 150);
        window.clearTimeout(resume);
        resume = window.setTimeout(update, spyPausedUntil.current - Date.now() + 10);
        return;
      }
      const line = (parseFloat(document.documentElement.style.scrollPaddingTop) || 160) + 8;
      const present = sections.filter((s) => sectionRefs.current[s.key]);
      if (!present.length) return;

      // The last sections are often too short to ever reach the line.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current = present[0].key;
      if (atBottom) {
        current = present[present.length - 1].key;
      } else {
        for (const s of present) {
          if (sectionRefs.current[s.key]!.getBoundingClientRect().top <= line) current = s.key;
        }
      }
      setActiveTab(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(resume);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // Section keys are static; refs are read live on every scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the active tab visible by scrolling only the tab bar; scrollIntoView would move the page too.
  const tabBarRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const bar = tabBarRef.current;
    const tab = bar?.querySelector<HTMLElement>(`[data-section="${activeTab}"]`);
    if (!bar || !tab) return;
    const left = tab.offsetLeft - (bar.clientWidth - tab.offsetWidth) / 2;
    bar.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [activeTab]);

  // A shared link often opens in a fresh tab, where history.back() leaves the site.
  // Go back only if we arrived by in-app navigation or from another page of ours; otherwise go home.
  const handleBack = () => {
    const entry = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    const stripHash = (u: string) => u.split("#")[0];

    const arrivedInApp = !!entry?.name && stripHash(entry.name) !== stripHash(window.location.href);

    let cameFromOurSite = false;
    try {
      cameFromOurSite =
        !!document.referrer && new URL(document.referrer).origin === window.location.origin;
    } catch {
      // Unparseable referrer.
    }

    if (arrivedInApp || cameFromOurSite) router.back();
    else router.push("/");
  };

  return (
    <div className="min-h-screen font-sans bg-background pt-16">
      {/* Page header and tab bar share one sticky block so their offsets cannot drift apart. */}
      <div ref={chromeRef} className="sticky z-40" style={{ top: siteHeaderHeight }}>
      <header className="bg-background/90 backdrop-blur border-b border-border">
        <div className="app-container py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleBack}
              className="border border-border hover:bg-accent h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4 text-foreground" />
            </button>
            <Avatar className="w-8 h-8 flex-shrink-0">
              {ipo.image_url?.trim() ? (
                <AvatarImage src={ipo.image_url} alt={`${analysis.company_name} logo`} />
              ) : (
                <AvatarFallback className="text-primary-foreground bg-primary text-[10px] font-medium">
                  {getInitials(analysis.company_name || "")}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-sm font-semibold font-serif text-foreground truncate">
              {analysis.company_name}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="bg-background/95 backdrop-blur border-b border-border">
        <div ref={tabBarRef} className="app-container overflow-x-auto">
          <div className="relative flex items-center gap-1 py-2 min-w-max">
            {sections.map((s) => (
              <button
                key={s.key}
                data-section={s.key}
                aria-current={activeTab === s.key ? "true" : undefined}
                onClick={() => handleTabClick(s.key)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors font-sans",
                  activeTab === s.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <span className={cn("font-mono italic text-xs", activeTab === s.key ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
                  {s.num}
                </span>
                {s.label}
                {s.score !== undefined && (
                  <span
                    className={cn(
                      "text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded-full",
                      activeTab === s.key ? "bg-primary-foreground/15 text-primary-foreground" : scoreStyle(s.score).badge
                    )}
                  >
                    {s.score.toFixed(1)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      </div>

      <div className="app-container py-8 space-y-10">
        {/* 00 Overview */}
        <section
          ref={sectionRef("overview")}
          id="overview"
          className="scroll-mt-40 space-y-8"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="outline" className="rounded-md font-mono uppercase tracking-wide text-[11px]">
                {ipoType}
              </Badge>
              <span className={cn("px-2 py-0.5 rounded-md border text-[11px] font-mono font-semibold uppercase tracking-wide", statusInfo.cls)}>
                {statusInfo.label}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-semibold font-serif text-foreground mb-6">{analysis.company_name}</h1>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-4 mb-8">
              <div>
                <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-1">Price band</div>
                <span className="text-lg font-mono font-semibold text-foreground">{formattedPriceBand}</span>
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-1">Lot size</div>
                <div className="text-lg font-mono font-semibold text-foreground">
                  {lotShares ? `${lotShares} shares` : "N/A"}
                </div>
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-1">Min. investment</div>
                <div className="text-lg font-mono font-semibold text-foreground">
                  {minInvestment ? `₹${minInvestment.toLocaleString("en-IN")}` : "N/A"}
                </div>
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-1">Issue size</div>
                <span className="text-lg font-mono font-semibold text-foreground">{analysis.ipo_details?.issue_size || ""}</span>
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-1">GMP</div>
                <div className="text-lg font-mono font-semibold text-score-good">{gmpTile}</div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-3">
                Allotment chances
              </h3>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {allotmentCategories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setPredictorCategory(cat.key)}
                    className="group relative flex flex-col items-center gap-1 text-center py-3 rounded-xl border border-primary/25 bg-primary/[0.04] hover:border-primary/60 hover:bg-accent active:scale-[0.97] transition-all cursor-pointer"
                    aria-label={`${cat.label} allotment odds ${cat.odds}, tap for details`}
                  >
                    <ChevronRight className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-primary/60 group-hover:text-primary transition-colors" />
                    <cat.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className={cn("font-mono text-lg font-semibold whitespace-nowrap", getProbabilityColor(cat.probability))}>
                      {cat.odds}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground leading-tight">
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Estimated from the current subscription figures. Tap a category to work it out for your application size.
              </p>
            </div>

            <div className={cn("rounded-xl border border-border bg-card px-4 py-3 sm:px-5", hasGmp && "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1")}>
              <h3 className={cn("text-xs font-mono uppercase tracking-wide text-muted-foreground", !hasGmp && "mb-2")}>Estimated listing</h3>
              {hasGmp ? (
                <p className="font-mono text-xl sm:text-2xl font-semibold text-score-good">
                  <span className="font-mono">₹{gmpValue}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Grey market data isn&apos;t available for this issue, so the gains estimate uses fundamentals only and ignores listing-day sentiment.
                </p>
              )}
            </div>

            {/* Fetches its own series client-side, so the ISR cache does not freeze it. */}
            <div className="mt-4">
              <GmpTrendChart ipoId={ipo._id} companyName={analysis.company_name} />
            </div>

          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h3 className="text-sm font-mono uppercase tracking-wide text-muted-foreground mb-2 select-none">Timeline</h3>
            <AnalysisTimeline
              opening={timelineData.opening}
              closing={timelineData.closing}
              allotment={timelineData.allotment}
              listing={timelineData.listing}
            />
          </div>

          {/* Verdict: the overall score next to the section scores behind it. */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 sm:gap-6">
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 sm:gap-8 items-center">
            <div className="flex justify-center">
              <OverviewRadar axes={radarAxes} overallScore={overallScore} gainsPotential={gainsPotential} />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline justify-between mb-3 gap-3">
                <span className="text-xs font-mono uppercase tracking-wide text-muted-foreground">Overall score</span>
                <span className="flex items-baseline gap-2">
                  <span className={cn("font-mono text-sm font-semibold uppercase tracking-wide", scoreStyle(overallScore).text)}>
                    {getScoreTrustLabel(overallScore)}
                  </span>
                  <span className={cn("font-serif text-3xl font-semibold", scoreStyle(overallScore).text)}>
                    {overallScore.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground font-mono">/10</span>
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-5">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", scoreStyle(overallScore).bar)}
                  style={{ width: scoreWidth(overallScore) }}
                />
              </div>
              {/* The radar has no axis labels, so spell out the scores behind it. */}
              <ul className="space-y-2.5">
                {radarAxes.map((a) => (
                  <li key={a.label} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3 text-sm">
                    <span className="text-muted-foreground">{a.label}</span>
                    <span className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <span
                        className={cn("block h-full rounded-full", scoreStyle(a.score).bar)}
                        style={{ width: scoreWidth(a.score) }}
                      />
                    </span>
                    <span className={cn("font-mono text-right font-semibold", scoreStyle(a.score).text)}>{a.score.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
              <QuotaDonut data={quotaData} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {strengthsAndConcerns.map(({ title, items, color, Icon, empty }) => (
              <div key={title}>
                <h3 className={cn("text-xs font-mono uppercase tracking-wide mb-3", color)}>{title}</h3>
                {items.length > 0 ? (
                  <ul className="space-y-3">
                    {items.slice(0, 5).map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <Icon className={cn("h-3.5 w-3.5 mt-0.5 flex-shrink-0", color)} />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">{empty}</p>
                )}
              </div>
            ))}
          </div>

          {investorTableData.length > 0 && (
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-3">Application size</h3>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
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
                    {investorTableData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row.application || "-"}</TableCell>
                        <TableCell>{row.lot_size || "-"}</TableCell>
                        <TableCell>{row.shares || "-"}</TableCell>
                        <TableCell>{row.amount || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </section>

        {/* 01 Timing */}
        {analysis.time && (
          <section
            ref={sectionRef("timing")}
            id="timing"
          >
            <SectionHeading
              num="01"
              title="Timing"
              score={timeScore}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-1">Issue type</div>
                <div className="text-lg font-serif font-semibold text-foreground">{ipoType}</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-1">Issue size</div>
                <div className="text-lg font-serif font-semibold text-foreground">{formatIssueSize(analysis.ipo_details?.issue_size) || "Size TBA"}</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-1">Market timing</div>
                <div className={cn("text-lg font-serif font-semibold", scoreStyle(timeScore).text)}>
                  {timeScore >= 6 ? "Favourable" : timeScore >= 4 ? "Neutral" : "Unfavourable"}
                </div>
              </div>
            </div>

            {analysis.time.market_timing_assessment && (
              <span className="text-base text-foreground whitespace-pre-wrap block leading-relaxed">{analysis.time.market_timing_assessment}</span>
            )}
          </section>
        )}

        {/* 02 Financials */}
        {analysis.fundamentals && (
          <section
            ref={sectionRef("financials")}
            id="financials"
          >
            <SectionHeading
              num="02"
              title="Financials"
              score={fundamentalsScore}
            />
            <span className="text-base text-foreground whitespace-pre-wrap block leading-relaxed">{analysis.fundamentals.summary}</span>

            {/* Debt and offer structure; older analyses do not carry these fields. */}
            {(analysis.fundamentals.debt || analysis.fundamentals.offer_structure) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                {analysis.fundamentals.debt && (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-1">Debt on the company</div>
                    <span className="text-lg font-serif font-semibold text-foreground">{analysis.fundamentals.debt.total_debt || "Not stated"}</span>
                    <span className="mt-2 block text-sm text-muted-foreground whitespace-pre-wrap">{analysis.fundamentals.debt.summary}</span>
                  </div>
                )}
                {analysis.fundamentals.offer_structure && (() => {
                  const offer = analysis.fundamentals.offer_structure;
                  return (
                    <div className="rounded-xl border border-border bg-card p-5">
                      <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-1">Who is selling, and why</div>
                      <div className="flex flex-wrap gap-2 my-2">
                        <span className="px-2 py-0.5 rounded-md border border-border text-[11px] font-mono">
                          Fresh issue: {offer.fresh_issue || "None"}
                        </span>
                        <span className="px-2 py-0.5 rounded-md border border-border text-[11px] font-mono">
                          OFS: {offer.offer_for_sale || "None"}
                        </span>
                        {offer.promoters_selling !== null && (
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-md border text-[11px] font-mono font-semibold",
                              offer.promoters_selling
                                ? "bg-score-bad/15 text-score-bad border-score-bad/30"
                                : "bg-score-good/15 text-score-good border-score-good/30"
                            )}
                          >
                            {offer.promoters_selling ? "Promoters selling" : "Promoters not selling"}
                          </span>
                        )}
                      </div>
                      {offer.selling_shareholders && offer.selling_shareholders !== "None" && (
                        <span className="block mb-2 text-sm text-foreground whitespace-pre-wrap">{offer.selling_shareholders}</span>
                      )}
                      <span className="block text-sm text-muted-foreground whitespace-pre-wrap">{offer.why_selling}</span>
                    </div>
                  );
                })()}
              </div>
            )}

            {analysis.financialReport && analysis.financialReport.length > 0 && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="text-lg font-serif font-semibold">Financial Performance Trend</CardTitle>
                  <i className="text-muted-foreground text-sm not-italic font-mono">(Amount ₹ in Crores)</i>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analysis.financialReport.map((report) => ({
                          year: `FY ${report.period_ended}`,
                          Revenue: parseFloat(report.revenue || "0"),
                          Expense: parseFloat(report.expense || "0"),
                          "Profit After Tax": parseFloat(report.profit_after_tax || "0"),
                        }))}
                        margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="year" tick={{ fontSize: 12, style: { fontFamily: "var(--font-mono)" } }} stroke="var(--muted-foreground)" />
                        <YAxis tick={{ fontSize: 12, style: { fontFamily: "var(--font-mono)" } }} stroke="var(--muted-foreground)" />
                        <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderRadius: 8, border: "1px solid var(--border)", fontFamily: "var(--font-sans)" }} />
                        <Legend wrapperStyle={{ fontFamily: "var(--font-sans)", fontSize: 13 }} />
                        <Bar dataKey="Revenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={1000} />
                        <Bar dataKey="Expense" fill="var(--chart-4)" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={1200} />
                        <Bar dataKey="Profit After Tax" fill="var(--chart-2)" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={1400} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="mt-8">
              <h3 className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-3">Profitability of allotment</h3>
              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-start rounded-xl border border-border bg-card p-5">
                <span className={cn("font-serif text-3xl font-semibold", scoreStyle(analysis.ipo_details?.profitability_of_allotment?.score ?? 0).text)}>{analysis.ipo_details?.profitability_of_allotment?.score ?? 0}/10</span>
                <span className="text-sm text-foreground">{analysis.ipo_details?.profitability_of_allotment?.assessment ?? ""}</span>
              </div>
            </div>
          </section>
        )}

        {/* 03 Risk */}
        {analysis.risk_meter && (
          <section
            ref={sectionRef("risk")}
            id="risk"
          >
            <SectionHeading
              num="03"
              title="Risk"
              score={riskScore}
            />
            <p className="text-xs text-muted-foreground italic mb-4">
              Read this score as a safety rating: 10/10 means the lowest risk, 1/10 the highest.
            </p>
            <span className="mb-8 block text-base text-foreground whitespace-pre-wrap leading-relaxed">{analysis.risk_meter.summary}</span>
            {analysis.risk_meter.risk_categories && (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {Object.entries(analysis.risk_meter.risk_categories).map(([category, risks]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className={cn("capitalize text-base font-serif font-semibold", RISK_CATEGORY_COLORS[category] || "text-muted-foreground")}>
                        {category.replace(/_/g, " ")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-outside space-y-2 pl-5 text-sm">
                        {(risks as string[]).filter((risk) => risk.trim() !== "").map((risk, i) => (
                          <li key={i} className="text-foreground">{risk}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 04 Performance */}
        {analysis.performance && (
          <section
            ref={sectionRef("performance")}
            id="performance"
          >
            <SectionHeading
              num="04"
              title="Performance"
              score={performanceScore}
            />
            <span className="mb-8 block text-base text-foreground whitespace-pre-wrap leading-relaxed">{analysis.performance.summary}</span>

            <div className="space-y-8">
              {analysis.performance.management_quality && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="max-w-xs mb-4">
                    <ScoreBar
                      label="Management quality"
                      score={analysis.performance.management_quality.score || 0}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-1">Experience</div>
                      <span className="text-foreground">{analysis.performance.management_quality.experience || ""}</span>
                    </div>
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-1">Track record</div>
                      <span className="text-foreground">{analysis.performance.management_quality.track_record || ""}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                {analysis.performance.historical_growth?.pattern && (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h4 className="font-serif font-semibold text-foreground mb-1.5">Historical growth</h4>
                    <p className="text-sm text-muted-foreground">
                      {analysis.performance.historical_growth.pattern}
                      {analysis.performance.historical_growth.rate ? ` — ${analysis.performance.historical_growth.rate}` : ""}
                    </p>
                  </div>
                )}
                {analysis.performance.market_comparison && (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h4 className="font-serif font-semibold text-foreground mb-1.5">Market comparison</h4>
                    <span className="text-sm text-muted-foreground whitespace-pre-wrap block">{analysis.performance.market_comparison}</span>
                  </div>
                )}
                {analysis.performance.future_potential?.growth_forecast && (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h4 className="font-serif font-semibold text-foreground mb-1.5">Future potential</h4>
                    <p className="text-sm text-muted-foreground">{analysis.performance.future_potential.growth_forecast}</p>
                  </div>
                )}
                {analysis.performance.consistency_analysis?.rationale && (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h4 className="font-serif font-semibold text-foreground mb-1.5">Operational consistency</h4>
                    <p className="text-sm text-muted-foreground">{analysis.performance.consistency_analysis.rationale}</p>
                  </div>
                )}
              </div>

              {analysis.performance.key_achievements && analysis.performance.key_achievements.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-3">Key achievements</h4>
                  <ul className="space-y-2 text-sm">
                    {analysis.performance.key_achievements.filter((a) => a.trim() !== "").map((achievement, index) => (
                      <li key={index} className="flex items-start gap-2 text-foreground">
                        <TrendingUp className="h-3.5 w-3.5 text-score-good mt-0.5 flex-shrink-0" />
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 05 Flexibility */}
        {analysis.flexibility && (
          <section
            ref={sectionRef("flexibility")}
            id="flexibility"
          >
            <SectionHeading
              num="05"
              title="Flexibility"
              score={flexibilityScore}
            />
            <span className="mb-8 block text-base text-foreground whitespace-pre-wrap leading-relaxed">{analysis.flexibility.summary}</span>

            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5 mb-8">
              {[
                {
                  label: "Market adaptability",
                  metric: analysis.flexibility.market_adaptability,
                },
                {
                  label: "Financial stability",
                  metric: analysis.flexibility.financial_stability,
                },
                {
                  label: "Operational agility",
                  metric: analysis.flexibility.operational_agility,
                },
              ].map(({ label, metric }) => {
                if (!metric || metric.score === null || metric.score === undefined) return null;
                return (
                  <div key={label} className="space-y-1.5">
                    <ScoreBar
                      label={label}
                      score={metric.score}
                    />
                    {metric.description && (
                      <span className="text-sm text-muted-foreground block">{metric.description}</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {analysis.flexibility.product_diversification && (
                <div>
                  <h4 className="font-serif font-semibold text-foreground mb-1.5">Product diversification</h4>
                  <p className="text-sm text-muted-foreground">{analysis.flexibility.product_diversification}</p>
                </div>
              )}
              {analysis.flexibility.future_adaptability_potential && (
                <div>
                  <h4 className="font-serif font-semibold text-foreground mb-1.5">Future adaptability</h4>
                  <p className="text-sm text-muted-foreground">{analysis.flexibility.future_adaptability_potential}</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <AllotmentPredictorModal
        ipo={ipo}
        companyName={analysis.company_name}
        initialCategory={predictorCategory}
        onClose={() => setPredictorCategory(null)}
      />
    </div>
  );
}
