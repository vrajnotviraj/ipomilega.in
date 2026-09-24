"use client";
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Share2,
  Loader2,
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
import { IpoComprehensiveAnalysis } from "@/app/models/ipo_comprehensive_analysis";
import { Ipo } from "@/app/models/ipo";
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
  parseGainValue,
  ALLOTMENT_CATEGORIES,
} from "@/components/Home/ipoFormat";
import { AllotmentPredictorModal } from "@/components/Home/AllotmentPredictorModal";
import { GmpTrendChart } from "@/components/charts/GmpTrendChart";
import { buildShareMessage, type ShareFacts } from "@/lib/share";
import { AllotmentCategoryDef } from "@/components/Home/ipoFormat";

// Same iconography as the home-page card, so the two allotment rows read as the
// same control in both places.
const ALLOTMENT_ICONS: Record<AllotmentCategoryDef["key"], typeof User> = {
  retail: User,
  shni: Users,
  bhni: Landmark,
};

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

// --- Score color helpers (single consistent scale used across the whole page) ---
const scoreTextClass = (score: number) => {
  if (score >= 8) return "text-score-good";
  if (score >= 6) return "text-score-mid";
  return "text-score-bad";
};

const scoreBgClass = (score: number) => {
  if (score >= 8) return "bg-score-good/15 text-score-good border-score-good/30";
  if (score >= 6) return "bg-score-mid/15 text-score-mid border-score-mid/30";
  return "bg-score-bad/15 text-score-bad border-score-bad/30";
};

const scoreBarClass = (score: number) => {
  if (score >= 8) return "bg-score-good";
  if (score >= 6) return "bg-score-mid";
  return "bg-score-bad";
};

// --- Inline Editable Field Component ---
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
            "w-full p-2 border-2 border-primary rounded-md text-sm bg-card font-sans text-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-md min-h-[70px]",
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
          "px-2 py-1 border-2 border-primary rounded-md text-sm bg-card font-sans text-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-sm w-full",
          inputClassName
        )}
      />
    );
  }

  const displayContent = renderText
    ? renderText(localVal)
    : (localVal || <span className="text-muted-foreground italic">{placeholder}</span>);

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
          ? "cursor-pointer hover:bg-primary/5 hover:outline-primary/40 hover:outline hover:outline-1 hover:outline-dashed rounded transition-colors duration-150 inline-block px-1"
          : "",
        className
      )}
      title={isAdmin ? "Double-click to edit field" : undefined}
    >
      <span className={textClassName}>{displayContent}</span>
    </span>
  );
};

// --- Horizontal score bar (used for Performance / Flexibility sub-metrics) ---
const ScoreBar = ({
  label,
  score,
  onSaveScore,
  isAdmin = false,
}: {
  label: string;
  score: number;
  onSaveScore?: (val: string) => void;
  isAdmin?: boolean;
}) => {
  const pct = Math.max(0, Math.min(100, (score / 10) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {isAdmin && onSaveScore ? (
          <EditableText
            value={score}
            onSave={onSaveScore}
            type="number"
            isAdmin={isAdmin}
            inputClassName="w-14 text-right font-mono font-semibold text-xs p-0.5 rounded border border-primary bg-card"
            textClassName={cn("font-mono text-sm font-semibold", scoreTextClass(score))}
            renderText={(val) => <span>{val}</span>}
          />
        ) : (
          <span className={cn("font-mono text-sm font-semibold", scoreTextClass(score))}>
            {score.toFixed(1)}
          </span>
        )}
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", scoreBarClass(score))}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// --- Small pentagon radar (5 section scores) with overall score + gains-potential ring ---
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
        {/* gains-potential progress ring */}
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

        {/* grid pentagons */}
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
        {/* spokes */}
        {axes.map((_, i) => {
          const p = pointFor(i, gridR);
          return (
            <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth={1} />
          );
        })}

        {/* value polygon */}
        <polygon points={valuePath} fill="var(--primary)" fillOpacity={0.18} stroke="var(--primary)" strokeWidth={2} />
        {axes.map((a, i) => {
          const p = valuePoints[i];
          const color =
            a.score >= 8 ? "var(--score-good)" : a.score >= 6 ? "var(--score-mid)" : "var(--score-bad)";
          return <circle key={i} cx={p.x} cy={p.y} r={4} fill={color} stroke="var(--card)" strokeWidth={1.5} />;
        })}

        {/* center score */}
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10, letterSpacing: 1, fontFamily: "IBM Plex Mono, monospace" }}>
          OVERALL
        </text>
        <text x={cx} y={cy + 22} textAnchor="middle" fill="var(--foreground)" style={{ fontSize: 34, fontWeight: 600, fontFamily: "Newsreader, serif" }}>
          {overallScore.toFixed(1)}
        </text>
        <text x={cx} y={cy + 36} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace" }}>
          / 10
        </text>
      </svg>
      <p className="text-xs text-muted-foreground text-center mt-2 max-w-[220px] font-sans">
        Approx. gains potential <span className="font-mono font-semibold text-score-mid">{gainsPotential}%</span> — fundamentals
      </p>
    </div>
  );
};

// --- Quota split donut ---
const QuotaDonut = ({ data }: { data: { name: string; value: number; color: string }[] }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) {
    return <div className="text-sm text-muted-foreground text-center py-8">Quota data unavailable.</div>;
  }
  return (
    <div className="flex items-center gap-4">
      <div className="w-[120px] h-[120px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={58}
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
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground mb-1">
          Quota split
        </div>
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-foreground font-medium">{d.name}</span>
            <span className="font-mono text-muted-foreground">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Timeline (proportional to actual dates, dot + line stepper) ---
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
  // "Today" is resolved after mount, never during render: this page is ISR-cached (and
  // prerendered at build time), so a server-side `new Date()` would be whatever moment filled
  // the cache, and it would hydrate against a different value in the browser. Until the effect
  // runs the rail is drawn empty, then the fill animates out to the real position.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);

  const parseDate = (s: string) => {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  // Every position on this rail is measured in whole IST days. The stations are
  // calendar dates with no time on them, while "today" is the current instant --
  // comparing the two directly drifts the marker by however far into the day it
  // is, which on the closing day itself lands it visibly past the Close dot.
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

  // True, date-proportional positions. Kept around because the displayed positions below get
  // pushed apart for legibility -- "today" has to be mapped through the same distortion, or the
  // marker would not line up with the stations it sits between.
  const truePositions = [0, posOf(closing), posOf(allotment), 100];
  for (let i = 1; i < truePositions.length; i++) {
    truePositions[i] = Math.max(truePositions[i], truePositions[i - 1]);
  }

  // Dates can land close together (or coincide), which would overlap the labels below --
  // spread stations apart with a minimum gap while keeping Open/Listing anchored at the ends.
  const MIN_GAP = 20;
  const positions = [...truePositions];
  for (let i = 1; i < positions.length; i++) {
    positions[i] = Math.max(positions[i], positions[i - 1] + MIN_GAP);
  }
  for (let i = positions.length - 2; i >= 0; i--) {
    positions[i] = Math.min(positions[i], positions[i + 1] - MIN_GAP);
  }

  // Piecewise-linear map from a date-proportional position to where it is actually drawn.
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
      {/* Narrow screens: the proportional layout below has no room for four date labels
          without overlapping, so fall back to a plain vertical list. */}
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
        {/* Station names */}
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

        {/* The rail: grey track, filled green up to today, one dot per station */}
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

        {/* Today marker, pointing back up at the rail. The row keeps its height before the
            marker resolves so nothing below it shifts. */}
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

        {/* Dates */}
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

// --- Section marker heading used for every §NN block ---
const SectionHeading = ({
  num,
  title,
  score,
  onSaveScore,
  isAdmin,
}: {
  num: string;
  title: string;
  score?: number;
  onSaveScore?: (val: string) => void;
  isAdmin?: boolean;
}) => (
  <div className="flex items-center justify-between mb-6 gap-3">
    <div className="flex items-baseline gap-3">
      <span className="text-sm italic font-serif text-muted-foreground">{num}</span>
      <h2 className="text-2xl font-semibold font-serif text-foreground">{title}</h2>
    </div>
    {score !== undefined && (
      <span className={cn("px-2.5 py-1 rounded-full border text-sm font-mono font-semibold flex items-center gap-1", scoreBgClass(score))}>
        {isAdmin && onSaveScore ? (
          <EditableText
            value={score}
            onSave={onSaveScore}
            type="number"
            isAdmin={isAdmin}
            inputClassName="w-10 text-center font-bold text-xs p-0.5 rounded border border-primary bg-card"
            textClassName="font-mono font-semibold"
            renderText={(val) => <span>{val}/10</span>}
          />
        ) : (
          <>{score.toFixed(1)}/10</>
        )}
      </span>
    )}
  </div>
);

const getInitials = (name: string) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((word: string) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function AnalysisPageClient({ analysis, ipo }: AnalysisPageClientProps) {
  const [editedAnalysis, setEditedAnalysis] = useState<IpoComprehensiveAnalysis>(analysis);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingTimeline, setIsEditingTimeline] = useState(false);
  const [predictorCategory, setPredictorCategory] = useState<AllotmentCategoryDef["key"] | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  // Resolved on the client so a share carries the URL actually in the address
  // bar; falls back to the canonical analysis URL until it is.
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  const router = useRouter();

  // The page header and the tab bar stack underneath the fixed site header, and
  // anchors have to clear all three. Measuring beats hardcoded offsets: the
  // heights differ between breakpoints, and a stale number leaves the tab bar
  // sitting on top of the header it is supposed to sit below.
  const chromeRef = useRef<HTMLDivElement | null>(null);
  const [siteHeaderHeight, setSiteHeaderHeight] = useState(64);

  useEffect(() => {
    const siteHeader = document.querySelector("header.fixed");
    const measure = () => {
      const top = siteHeader?.getBoundingClientRect().height ?? 64;
      setSiteHeaderHeight(top);
      // scroll-padding on the scroller handles every anchor jump at once,
      // including scrollIntoView, so sections need no scroll-margin of their own.
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

  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const riskCategoryColors: { [key: string]: string } = {
    market_risks: "text-score-bad",
    financial_risks: "text-score-mid",
    operational_risks: "text-muted-foreground",
    regulatory_risks: "text-primary",
    default: "text-muted-foreground",
  };

  const fundamentalsScore = editedAnalysis.fundamentals?.score ?? 0;
  const riskScore = editedAnalysis.risk_meter?.score ?? 0;
  const performanceScore = editedAnalysis.performance?.score ?? 0;
  const flexibilityScore = editedAnalysis.flexibility?.score ?? 0;
  const timeScore = editedAnalysis.time?.score ?? 0;

  const overallScore =
    (fundamentalsScore + riskScore + performanceScore + flexibilityScore + timeScore) / 5;

  const gainsPotential = editedAnalysis.ipo_details?.approximate_gains_potential ?? 0;

  const radarAxes = [
    { label: "Financials", score: fundamentalsScore },
    { label: "Performance", score: performanceScore },
    { label: "Flexibility", score: flexibilityScore },
    { label: "Timing", score: timeScore },
    { label: "Risk", score: riskScore },
  ];

  // Bands are stored in several shapes -- "130 - 140", "₹130 to 140 Per Share",
  // or a single "140". The cut-off price is always the last number in the string.
  const getUpperPrice = () => {
    const priceBand = editedAnalysis.ipo_details?.price_band;
    if (!priceBand || typeof priceBand !== "string") return null;
    const numbers = priceBand.replace(/,/g, "").match(/\d+(?:\.\d+)?/g);
    if (!numbers?.length) return null;
    const upperPrice = parseFloat(numbers[numbers.length - 1]);
    return isNaN(upperPrice) ? null : upperPrice;
  };

  const formatPriceBand = () => {
    const priceBand = editedAnalysis.ipo_details?.price_band;
    if (!priceBand) return "N/A";
    // The same RHP placeholder the issue size carries. A band that has not been
    // fixed prints as "[●] to [●] Per Share", and a rupee sign in front of it
    // makes it read like a price rather than a blank.
    if (isUnfixedValue(priceBand)) return "Price TBA";
    return priceBand.includes("₹") ? priceBand : `₹${priceBand}`;
  };

  const upperPrice = getUpperPrice();
  const lotSize = editedAnalysis.ipo_details?.lot_size;
  // `shares` is shares per lot and `lot_size` the lot count (1 for a retail
  // minimum), so one lot costs cut-off price x shares -- not x lot_size.
  const lotShares = editedAnalysis.ipo_details?.shares || lotSize;
  const minInvestment = upperPrice && lotShares ? upperPrice * lotShares : null;

  const timelineData = {
    opening: editedAnalysis.time?.issue_dates?.opening || "",
    closing: editedAnalysis.time?.issue_dates?.closing || "",
    allotment: editedAnalysis.time?.allotment_timeline?.date || "",
    listing: editedAnalysis.time?.listing_details?.expected_date || "",
  };

  const ipoType = getIpoType(ipo);

  // The same odds the home-page card leads with. They were only reachable here
  // through a button two screens down, so someone who arrived from a card lost
  // the one number they came for.
  const allotmentCategories = ALLOTMENT_CATEGORIES.map((cat) => {
    const ratio = parseGainValue(ipo?.[cat.ratioField]);
    return {
      ...cat,
      icon: ALLOTMENT_ICONS[cat.key],
      probability: getAllotmentProbability(ratio),
      odds: formatAllotmentOdds(ratio),
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
    if (today >= open && today <= close) return { label: "OPEN", cls: "bg-score-good text-primary-foreground border-transparent" };
    return { label: "UPCOMING", cls: "bg-score-mid/15 text-score-mid border-score-mid/30" };
  };
  const statusInfo = getStatusInfo();

  const parsePercentage = (value: string): number => {
    if (!value) return 0;
    const match = value.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const quotaData = [
    {
      name: "QIB",
      value: editedAnalysis.ipo_details?.allocation_details?.qib || parsePercentage(ipo.ipo_details?.qib_quota || "50"),
      color: "var(--chart-1)",
    },
    {
      name: "NII",
      value: editedAnalysis.ipo_details?.allocation_details?.nii || parsePercentage(ipo.ipo_details?.nii_quota || "15"),
      color: "var(--chart-3)",
    },
    {
      name: "Retail",
      value: editedAnalysis.ipo_details?.allocation_details?.retail || parsePercentage(ipo.ipo_details?.retail_quota || "35"),
      color: "var(--chart-2)",
    },
  ];

  const investorTableData =
    editedAnalysis.investorSplit?.filter((row) => row.application.toLowerCase() !== "application") || [];

  const strengths = (editedAnalysis.performance?.key_achievements || []).filter((s) => s.trim() !== "");
  const concerns = (editedAnalysis.risk_meter?.key_risks || []).filter((s) => s.trim() !== "");

  const gmpValue = editedAnalysis.gmp_price_gain || ipo.gmp_price_gain || "";
  const hasGmp = gmpValue && gmpValue !== "N/A" && gmpValue !== "TBD" && gmpValue !== "TBA";

  // What the share message carries, read off the same values this page renders,
  // so a forwarded IPO and the page never drift apart.
  const shareFacts: ShareFacts = {
    companyName: editedAnalysis.company_name,
    slug: editedAnalysis.slug || ipo.slug || "",
    gmp: hasGmp ? gmpValue : null,
    opening: timelineData.opening,
    closing: timelineData.closing,
    businessModel: editedAnalysis.fundamentals?.business_model || editedAnalysis.fundamentals?.summary || null,
    url: shareUrl,
  };

  // One tap, one message. The system share sheet is the only step, and picking
  // the recipient there is the only decision the sharer makes -- there is no
  // channel list to work through and no draft to edit.
  const handleShare = async () => {
    const message = buildShareMessage(shareFacts);

    // `url` is deliberately left off: the message already ends with the link, and
    // passing both makes WhatsApp and friends paste it twice.
    if (navigator.share) {
      try {
        await navigator.share({ title: `${editedAnalysis.company_name} IPO`, text: message });
      } catch {
        // The person dismissed the share sheet; nothing to report.
      }
      return;
    }

    // Desktop browsers without a share sheet: hand them the same text to paste.
    await navigator.clipboard.writeText(message);
    toast.success("IPO details copied", { description: "Paste it to whoever you want to send it to." });
  };

  const sections = [
    { key: "overview", num: "§00", label: "Overview" },
    { key: "financials", num: "§01", label: "Financials", score: fundamentalsScore },
    { key: "risk", num: "§02", label: "Risk", score: riskScore },
    { key: "performance", num: "§03", label: "Performance", score: performanceScore },
    { key: "flexibility", num: "§04", label: "Flexibility", score: flexibilityScore },
    { key: "timing", num: "§05", label: "Timing", score: timeScore },
  ];

  const handleTabClick = (key: string) => {
    setActiveTab(key);
    const section = sectionRefs.current[key];
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // A shared analysis usually opens in a fresh tab, where history.back() lands on
  // about:blank or walks straight out of the site -- which is what people were
  // hitting. Step back only when there is provably an IPO Milega page behind us.
  //
  // Two ways that is true: we arrived by client-side navigation (the tab's entry
  // document is some other URL, so the router pushed an entry to get here), or
  // this page was loaded outright from another page of ours. Anything else --
  // opened from WhatsApp, pasted into the address bar -- goes home instead.
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
      cameFromOurSite = false;
    }

    if (arrivedInApp || cameFromOurSite) router.back();
    else router.push("/");
  };

  return (
    <div className="min-h-screen font-sans bg-background pt-16">
      {/* Page header and tab bar travel as one sticky block: separate offsets drift
          apart whenever the site header's height changes with the breakpoint. */}
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
                <AvatarImage src={ipo.image_url} alt={`${editedAnalysis.company_name} logo`} />
              ) : (
                <AvatarFallback className="text-primary-foreground bg-primary text-[10px] font-medium">
                  {getInitials(editedAnalysis.company_name || "")}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-sm font-semibold font-serif text-foreground truncate">
              {editedAnalysis.company_name}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isAdmin && (
              <div className="hidden sm:flex px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-score-good/15 border border-score-good/30 text-score-good items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-score-good animate-pulse" />
                Admin
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Section tab nav */}
      <div className="bg-background/95 backdrop-blur border-b border-border">
        <div className="app-container overflow-x-auto">
          <div className="flex items-center gap-1 py-2 min-w-max">
            {sections.map((s) => (
              <button
                key={s.key}
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
                      activeTab === s.key ? "bg-primary-foreground/15 text-primary-foreground" : scoreBgClass(s.score)
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
        {/* §00 Overview */}
        <section
          ref={(el) => {
            sectionRefs.current["overview"] = el;
          }}
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

            <h1 className="text-3xl sm:text-4xl font-semibold font-serif text-foreground mb-6">
              <EditableText
                value={editedAnalysis.company_name || ""}
                onSave={(val) => handleInlineSave("company_name", val)}
                isAdmin={isAdmin}
                textClassName="font-serif"
              />
            </h1>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-4 mb-8">
              <div>
                <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-1">Price band</div>
                <EditableText
                  value={formatPriceBand()}
                  onSave={(val) => handleInlineSave("ipo_details.price_band", val)}
                  isAdmin={isAdmin}
                  textClassName="text-lg font-mono font-semibold text-foreground"
                />
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
                <EditableText
                  value={editedAnalysis.ipo_details?.issue_size || ""}
                  onSave={(val) => handleInlineSave("ipo_details.issue_size", val)}
                  isAdmin={isAdmin}
                  textClassName="text-lg font-mono font-semibold text-foreground"
                />
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-1">GMP</div>
                <EditableText
                  value={gmpValue}
                  onSave={(val) => handleInlineSave("gmp_price_gain", val)}
                  isAdmin={isAdmin}
                  textClassName="text-lg font-mono font-semibold text-score-good"
                  renderText={(val) => <span>{val ? `₹${val}` : "N/A"}</span>}
                />
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
                    aria-label={`${cat.label} allotment odds ${cat.odds} — tap for details`}
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

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2">Estimated listing</h3>
              {hasGmp ? (
                <p className="font-mono text-2xl font-semibold text-score-good">
                  <EditableText
                    value={gmpValue}
                    onSave={(val) => handleInlineSave("gmp_price_gain", val)}
                    isAdmin={isAdmin}
                    textClassName="font-mono"
                    renderText={(val) => <span>₹{val}</span>}
                  />
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Grey market data isn&apos;t available for this issue. The gains estimate is fundamentals-only — it does not factor in listing-day sentiment.
                </p>
              )}
            </div>

            {/* The trend behind the single GMP figure above: which way it has
                been moving, and how far. Reads its own series client-side, so
                it is not frozen by this page's five-minute ISR cache. */}
            <div className="mt-4">
              <GmpTrendChart ipoId={ipo._id} companyName={editedAnalysis.company_name} />
            </div>

          </div>

          {/* Timeline */}
          <div
            className="rounded-xl border border-border bg-card p-5 sm:p-6"
            onDoubleClick={(e) => {
              if (isAdmin && !isEditingTimeline) {
                const target = e.target as HTMLElement;
                if (target.closest("button") || target.closest("a") || target.closest("input")) return;
                setIsEditingTimeline(true);
                toast.info("Timeline editor active", { description: "Move the mouse away from the panel to close." });
              }
            }}
          >
            <h3 className="text-sm font-mono uppercase tracking-wide text-muted-foreground mb-2 select-none">
              Timeline {isAdmin && <span className="normal-case text-primary">(double-click to edit dates)</span>}
            </h3>
            {isAdmin && isEditingTimeline && (
              <div
                className="bg-accent border border-border p-4 rounded-lg mb-4 grid grid-cols-2 md:grid-cols-5 gap-4"
                onMouseLeave={() => setIsEditingTimeline(false)}
              >
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-mono text-muted-foreground">Opening</label>
                  <input
                    type="date"
                    value={timelineData.opening ? timelineData.opening.split("T")[0] : ""}
                    onChange={(e) => handleInlineSave("time.issue_dates.opening", e.target.value)}
                    className="bg-card border border-border rounded px-2 py-1 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-mono text-muted-foreground">Closing</label>
                  <input
                    type="date"
                    value={timelineData.closing ? timelineData.closing.split("T")[0] : ""}
                    onChange={(e) => handleInlineSave("time.issue_dates.closing", e.target.value)}
                    className="bg-card border border-border rounded px-2 py-1 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-mono text-muted-foreground">Allotment</label>
                  <input
                    type="date"
                    value={timelineData.allotment ? timelineData.allotment.split("T")[0] : ""}
                    onChange={(e) => handleInlineSave("time.allotment_timeline.date", e.target.value)}
                    className="bg-card border border-border rounded px-2 py-1 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-mono text-muted-foreground">Listing</label>
                  <input
                    type="date"
                    value={timelineData.listing ? timelineData.listing.split("T")[0] : ""}
                    onChange={(e) => handleInlineSave("time.listing_details.expected_date", e.target.value)}
                    className="bg-card border border-border rounded px-2 py-1 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-mono text-muted-foreground">Timing score</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editedAnalysis.time?.score ?? 5}
                    onChange={(e) => handleInlineSave("time.score", parseInt(e.target.value) || 0)}
                    className="bg-card border border-border rounded px-2 py-1 text-sm outline-none focus:border-primary font-bold"
                  />
                </div>
              </div>
            )}
            <AnalysisTimeline
              opening={timelineData.opening}
              closing={timelineData.closing}
              allotment={timelineData.allotment}
              listing={timelineData.listing}
            />
          </div>

          {/* Verdict: the aggregate score next to the per-section breakdown behind it.
              These used to sit four blocks apart, so the radar read as decoration rather
              than as the working behind the number. */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-stretch">
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6 flex flex-col justify-center">
            <div className="flex items-baseline justify-between mb-3 gap-3">
              <span className="text-xs font-mono uppercase tracking-wide text-muted-foreground">Overall score</span>
              <span className="flex items-baseline gap-2">
                <span className={cn("font-mono text-sm font-semibold uppercase tracking-wide", scoreTextClass(overallScore))}>
                  {getScoreTrustLabel(overallScore)}
                </span>
                <span className={cn("font-serif text-3xl font-semibold", scoreTextClass(overallScore))}>
                  {overallScore.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground font-mono">/10</span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", scoreBarClass(overallScore))}
                style={{ width: `${Math.max(0, Math.min(100, (overallScore / 10) * 100))}%` }}
              />
            </div>
          </div>
            <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-center">
              <OverviewRadar axes={radarAxes} overallScore={overallScore} gainsPotential={gainsPotential} />
            </div>
          </div>

          {/* Strengths / Concerns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wide text-score-good mb-3">Strengths</h3>
              {strengths.length > 0 ? (
                <ul className="space-y-3">
                  {strengths.slice(0, 5).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <Plus className="h-3.5 w-3.5 text-score-good mt-0.5 flex-shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">No highlighted strengths yet.</p>
              )}
            </div>
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wide text-score-bad mb-3">Concerns</h3>
              {concerns.length > 0 ? (
                <ul className="space-y-3">
                  {concerns.slice(0, 5).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <Minus className="h-3.5 w-3.5 text-score-bad mt-0.5 flex-shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">No flagged concerns yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <QuotaDonut data={quotaData} />
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
              </div>
            </div>
          )}
        </section>

        {/* §01 Financials */}
        {editedAnalysis.fundamentals && (
          <section
            ref={(el) => {
              sectionRefs.current["financials"] = el;
            }}
            id="financials"
          >
            <SectionHeading
              num="§01"
              title="Financials"
              score={fundamentalsScore}
              isAdmin={isAdmin}
              onSaveScore={(val) => handleInlineSave("fundamentals.score", parseInt(val) || 0)}
            />
            <EditableText
              value={editedAnalysis.fundamentals.summary}
              onSave={(val) => handleInlineSave("fundamentals.summary", val)}
              type="textarea"
              isAdmin={isAdmin}
              textClassName="text-base text-foreground whitespace-pre-wrap block leading-relaxed"
            />

            {editedAnalysis.financialReport && editedAnalysis.financialReport.length > 0 && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="text-lg font-serif font-semibold">Financial Performance Trend</CardTitle>
                  <i className="text-muted-foreground text-sm not-italic font-mono">(Amount ₹ in Crores)</i>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={editedAnalysis.financialReport.map((report) => ({
                          year: `FY ${report.period_ended}`,
                          Revenue: parseFloat(report.revenue || "0"),
                          Expense: parseFloat(report.expense || "0"),
                          "Profit After Tax": parseFloat(report.profit_after_tax || "0"),
                        }))}
                        margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="year" tick={{ fontSize: 12, fontFamily: "IBM Plex Mono, monospace" }} stroke="var(--muted-foreground)" />
                        <YAxis tick={{ fontSize: 12, fontFamily: "IBM Plex Mono, monospace" }} stroke="var(--muted-foreground)" />
                        <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderRadius: 8, border: "1px solid var(--border)", fontFamily: "IBM Plex Sans, sans-serif" }} />
                        <Legend wrapperStyle={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 13 }} />
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
                <EditableText
                  value={editedAnalysis.ipo_details?.profitability_of_allotment?.score ?? 0}
                  onSave={(val) => handleInlineSave("ipo_details.profitability_of_allotment.score", parseInt(val) || 0)}
                  type="number"
                  isAdmin={isAdmin}
                  textClassName={cn("font-serif text-3xl font-semibold", scoreTextClass(editedAnalysis.ipo_details?.profitability_of_allotment?.score ?? 0))}
                  renderText={(val) => <span>{val}/10</span>}
                />
                <EditableText
                  value={editedAnalysis.ipo_details?.profitability_of_allotment?.assessment ?? ""}
                  onSave={(val) => handleInlineSave("ipo_details.profitability_of_allotment.assessment", val)}
                  type="textarea"
                  isAdmin={isAdmin}
                  textClassName="text-sm text-foreground"
                />
              </div>
            </div>
          </section>
        )}

        {/* §02 Risk */}
        {editedAnalysis.risk_meter && (
          <section
            ref={(el) => {
              sectionRefs.current["risk"] = el;
            }}
            id="risk"
          >
            <SectionHeading
              num="§02"
              title="Risk"
              score={riskScore}
              isAdmin={isAdmin}
              onSaveScore={(val) => handleInlineSave("risk_meter.score", parseInt(val) || 0)}
            />
            <p className="text-xs text-muted-foreground italic mb-4">
              This score reads like a safety rating, not a risk gauge: 10/10 means the lowest risk, 1/10 means the highest risk.
            </p>
            <EditableText
              value={editedAnalysis.risk_meter.summary}
              onSave={(val) => handleInlineSave("risk_meter.summary", val)}
              type="textarea"
              isAdmin={isAdmin}
              className="mb-8 block"
              textClassName="text-base text-foreground whitespace-pre-wrap block leading-relaxed"
            />
            {editedAnalysis.risk_meter.risk_categories && (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {Object.entries(editedAnalysis.risk_meter.risk_categories).map(([category, risks]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className={cn("capitalize text-base font-serif font-semibold", riskCategoryColors[category] || riskCategoryColors.default)}>
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
                          <ul className="list-disc list-outside space-y-2 pl-5 text-sm">
                            {val.split("\n").filter((a) => a.trim() !== "").map((risk, i) => (
                              <li key={i} className="text-foreground">{risk}</li>
                            ))}
                          </ul>
                        )}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {/* §03 Performance */}
        {editedAnalysis.performance && (
          <section
            ref={(el) => {
              sectionRefs.current["performance"] = el;
            }}
            id="performance"
          >
            <SectionHeading
              num="§03"
              title="Performance"
              score={performanceScore}
              isAdmin={isAdmin}
              onSaveScore={(val) => handleInlineSave("performance.score", parseInt(val) || 0)}
            />
            <EditableText
              value={editedAnalysis.performance.summary}
              onSave={(val) => handleInlineSave("performance.summary", val)}
              type="textarea"
              isAdmin={isAdmin}
              className="mb-8 block"
              textClassName="text-base text-foreground whitespace-pre-wrap block leading-relaxed"
            />

            <div className="space-y-8">
              {editedAnalysis.performance.management_quality && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="max-w-xs mb-4">
                    <ScoreBar
                      label="Management quality"
                      score={editedAnalysis.performance.management_quality.score || 0}
                      isAdmin={isAdmin}
                      onSaveScore={(val) => handleInlineSave("performance.management_quality.score", parseInt(val) || 0)}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-1">Experience</div>
                      <EditableText
                        value={editedAnalysis.performance.management_quality.experience || ""}
                        onSave={(val) => handleInlineSave("performance.management_quality.experience", val)}
                        type="textarea"
                        isAdmin={isAdmin}
                        textClassName="text-foreground"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-1">Track record</div>
                      <EditableText
                        value={editedAnalysis.performance.management_quality.track_record || ""}
                        onSave={(val) => handleInlineSave("performance.management_quality.track_record", val)}
                        type="textarea"
                        isAdmin={isAdmin}
                        textClassName="text-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                {editedAnalysis.performance.historical_growth?.pattern && (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h4 className="font-serif font-semibold text-foreground mb-1.5">Historical growth</h4>
                    <p className="text-sm text-muted-foreground">
                      {editedAnalysis.performance.historical_growth.pattern}
                      {editedAnalysis.performance.historical_growth.rate ? ` — ${editedAnalysis.performance.historical_growth.rate}` : ""}
                    </p>
                  </div>
                )}
                {editedAnalysis.performance.market_comparison && (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h4 className="font-serif font-semibold text-foreground mb-1.5">Market comparison</h4>
                    <EditableText
                      value={editedAnalysis.performance.market_comparison}
                      onSave={(val) => handleInlineSave("performance.market_comparison", val)}
                      type="textarea"
                      isAdmin={isAdmin}
                      textClassName="text-sm text-muted-foreground whitespace-pre-wrap block"
                    />
                  </div>
                )}
                {editedAnalysis.performance.future_potential?.growth_forecast && (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h4 className="font-serif font-semibold text-foreground mb-1.5">Future potential</h4>
                    <p className="text-sm text-muted-foreground">{editedAnalysis.performance.future_potential.growth_forecast}</p>
                  </div>
                )}
                {editedAnalysis.performance.consistency_analysis?.rationale && (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h4 className="font-serif font-semibold text-foreground mb-1.5">Operational consistency</h4>
                    <p className="text-sm text-muted-foreground">{editedAnalysis.performance.consistency_analysis.rationale}</p>
                  </div>
                )}
              </div>

              {editedAnalysis.performance.key_achievements && editedAnalysis.performance.key_achievements.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-3">Key achievements</h4>
                  <EditableText
                    value={editedAnalysis.performance.key_achievements.join("\n")}
                    onSave={(val) => handleInlineArraySave("performance.key_achievements", val)}
                    type="textarea"
                    isAdmin={isAdmin}
                    renderText={(val) => (
                      <ul className="space-y-2 text-sm">
                        {val.split("\n").filter((a) => a.trim() !== "").map((achievement, index) => (
                          <li key={index} className="flex items-start gap-2 text-foreground">
                            <TrendingUp className="h-3.5 w-3.5 text-score-good mt-0.5 flex-shrink-0" />
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* §04 Flexibility */}
        {editedAnalysis.flexibility && (
          <section
            ref={(el) => {
              sectionRefs.current["flexibility"] = el;
            }}
            id="flexibility"
          >
            <SectionHeading
              num="§04"
              title="Flexibility"
              score={flexibilityScore}
              isAdmin={isAdmin}
              onSaveScore={(val) => handleInlineSave("flexibility.score", parseInt(val) || 0)}
            />
            <EditableText
              value={editedAnalysis.flexibility.summary}
              onSave={(val) => handleInlineSave("flexibility.summary", val)}
              type="textarea"
              isAdmin={isAdmin}
              className="mb-8 block"
              textClassName="text-base text-foreground whitespace-pre-wrap block leading-relaxed"
            />

            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5 mb-8">
              {[
                {
                  label: "Market adaptability",
                  metric: editedAnalysis.flexibility.market_adaptability,
                  path: "flexibility.market_adaptability",
                },
                {
                  label: "Financial stability",
                  metric: editedAnalysis.flexibility.financial_stability,
                  path: "flexibility.financial_stability",
                },
                {
                  label: "Operational agility",
                  metric: editedAnalysis.flexibility.operational_agility,
                  path: "flexibility.operational_agility",
                },
              ].map(({ label, metric, path }) => {
                if (!metric || metric.score === null || metric.score === undefined) return null;
                return (
                  <div key={label} className="space-y-1.5">
                    <ScoreBar
                      label={label}
                      score={metric.score}
                      isAdmin={isAdmin}
                      onSaveScore={(val) => handleInlineSave(`${path}.score`, parseInt(val) || 0)}
                    />
                    {metric.description && (
                      <EditableText
                        value={metric.description}
                        onSave={(val) => handleInlineSave(`${path}.description`, val)}
                        type="textarea"
                        isAdmin={isAdmin}
                        textClassName="text-sm text-muted-foreground block"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {editedAnalysis.flexibility.product_diversification && (
                <div>
                  <h4 className="font-serif font-semibold text-foreground mb-1.5">Product diversification</h4>
                  <p className="text-sm text-muted-foreground">{editedAnalysis.flexibility.product_diversification}</p>
                </div>
              )}
              {editedAnalysis.flexibility.future_adaptability_potential && (
                <div>
                  <h4 className="font-serif font-semibold text-foreground mb-1.5">Future adaptability</h4>
                  <p className="text-sm text-muted-foreground">{editedAnalysis.flexibility.future_adaptability_potential}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* §05 Timing */}
        {editedAnalysis.time && (
          <section
            ref={(el) => {
              sectionRefs.current["timing"] = el;
            }}
            id="timing"
          >
            <SectionHeading
              num="§05"
              title="Timing"
              score={timeScore}
              isAdmin={isAdmin}
              onSaveScore={(val) => handleInlineSave("time.score", parseInt(val) || 0)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-1">Issue type</div>
                <div className="text-lg font-serif font-semibold text-foreground">{ipoType}</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-1">Issue size</div>
                <div className="text-lg font-serif font-semibold text-foreground">{formatIssueSize(editedAnalysis.ipo_details?.issue_size) || "Size TBA"}</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-1">Market timing</div>
                <div className={cn("text-lg font-serif font-semibold", scoreTextClass(timeScore))}>
                  {timeScore >= 6 ? "Favourable" : timeScore >= 4 ? "Neutral" : "Unfavourable"}
                </div>
              </div>
            </div>

            {editedAnalysis.time.market_timing_assessment && (
              <EditableText
                value={editedAnalysis.time.market_timing_assessment}
                onSave={(val) => handleInlineSave("time.market_timing_assessment", val)}
                type="textarea"
                isAdmin={isAdmin}
                textClassName="text-base text-foreground whitespace-pre-wrap block leading-relaxed"
              />
            )}
          </section>
        )}
      </div>

      <AllotmentPredictorModal
        ipo={ipo}
        companyName={editedAnalysis.company_name}
        initialCategory={predictorCategory}
        onClose={() => setPredictorCategory(null)}
      />

      {/* Floating Admin Status Bar */}
      {isAdmin && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 bg-card border border-border p-4 rounded-xl shadow-2xl">
          <div className="flex items-center gap-3">
            {isSaving ? (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-score-good/10 flex items-center justify-center border border-score-good/20">
                <span className="h-2 w-2 rounded-full bg-score-good animate-pulse" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-mono uppercase tracking-wide text-muted-foreground">Admin</span>
              <span className="text-sm font-semibold text-foreground">
                {isSaving ? "Saving changes..." : "Inline editing active"}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">Double-click any field to edit</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
