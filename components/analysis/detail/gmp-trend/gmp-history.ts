import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

export interface GmpDay {
  t: string;
  date: string;
  gmp: number;
  est_listing_price: number | null;
  est_listing_percent: number | null;
  as_of: string;
  live: boolean;
}

export interface ChartPoint extends GmpDay {
  ts: number;
  /** Rupee move from the previous day; null for the first day. */
  delta: number | null;
}

const IST = "Asia/Kolkata";
export const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)" };

export const DIRECTION = {
  up: { word: "Up", color: "text-score-good", Icon: ArrowUpRight },
  down: { word: "Down", color: "text-score-bad", Icon: ArrowDownRight },
  flat: { word: "Flat", color: "text-muted-foreground", Icon: ArrowRight },
};

export const formatDay = (ts: number) => new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: IST });

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: IST });

export const formatRupees = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/** A signed rupee change: "+₹10", "-₹4", "₹0". */
export function formatDelta(value: number) {
  if (value === 0) return "₹0";
  return `${value > 0 ? "+" : "-"}₹${Math.abs(value).toLocaleString("en-IN")}`;
}

/** Dot colour for a day: marigold for today's live reading, else gain or loss against the day before. */
export function dotFill(point: ChartPoint) {
  if (point.live) return "var(--brand-accent)";
  if (!point.delta) return "var(--primary)";
  return point.delta > 0 ? "var(--score-good)" : "var(--score-bad)";
}

/** A y-axis on round 1/2/5 steps around the values, holding at zero unless GMP went negative. */
export function niceAxis(values: number[]) {
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  // A flat series still needs a band to sit in, or the line lands on the axis.
  const spread = rawMax - rawMin || Math.max(1, Math.abs(rawMax) * 0.1);
  const targetStep = spread / 3;
  const magnitude = 10 ** Math.floor(Math.log10(targetStep));
  const step = [1, 2, 5, 10].find((m) => m * magnitude >= targetStep)! * magnitude;

  const floor = Math.floor((rawMin - step / 2) / step) * step;
  const min = rawMin >= 0 ? Math.max(0, floor) : floor;
  const max = Math.ceil((rawMax + step / 2) / step) * step;

  const ticks: number[] = [];
  for (let v = min; v <= max + step / 2; v += step) ticks.push(Number(v.toFixed(4)));
  return { domain: [min, max] as [number, number], ticks };
}

/** Loads the day-by-day GMP series, or null while loading and "failed" on error. */
export function useGmpHistory(ipoId: string) {
  const [points, setPoints] = useState<ChartPoint[] | null | "failed">(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ipo/${ipoId}/gmp-history`)
      .then((res) => res.json())
      .then((data) => {
        if (!data?.success) throw new Error(data?.message || "Request failed");
        const series: GmpDay[] = Array.isArray(data.series) ? data.series : [];
        const withDeltas = series.map((day, i) => ({
          ...day,
          ts: new Date(day.t).getTime(),
          delta: i === 0 ? null : day.gmp - series[i - 1].gmp,
        }));
        if (!cancelled) setPoints(withDeltas);
      })
      .catch(() => {
        if (!cancelled) setPoints("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [ipoId]);

  return points;
}
