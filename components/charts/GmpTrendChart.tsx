"use client";

/**
 * How the grey-market premium has moved, one point per date.
 *
 * The question this answers is "is GMP going up or down", so the direction is
 * stated in words at the top and the line is the evidence for it, not the other
 * way round. A reader who only looks at the first line has their answer.
 *
 * Three things about the data shape drive the design:
 *
 *   1. One point per IST day, showing that day's latest GMP. The capture runs
 *      hourly and each new quote replaces the day's value. A flat day still
 *      gets its point -- 14 on the 24th and still 14 on the 25th is two points.
 *   2. Dots are coloured by the day-on-day move.
 *   3. GMP in rupees and the estimated gain in percent are two scales. They
 *      share a card but never a plot: the line is rupees, on one axis, and the
 *      percentage lives in the tooltip and the table.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowRight, ArrowUpRight, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

interface GmpDay {
  t: string;
  date: string;
  gmp: number;
  est_listing_price: number | null;
  est_listing_percent: number | null;
  as_of: string;
  live: boolean;
}

interface ChartPoint extends GmpDay {
  ts: number;
  /** Rupee move from the previous day's close; null for the first day. */
  delta: number | null;
}

interface GmpTrendChartProps {
  ipoId: string;
  /** Rendered above the chart so the card explains itself without a legend. */
  companyName?: string;
}

const IST = "Asia/Kolkata";
const DAY_MS = 24 * 60 * 60 * 1000;

function formatDay(ts: number) {
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: IST });
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: IST,
  });
}

function formatRupees(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

/** A signed rupee delta, e.g. "+₹10" / "-₹4" / "₹0". */
function formatDelta(value: number) {
  if (value === 0) return "₹0";
  return `${value > 0 ? "+" : "-"}₹${Math.abs(value).toLocaleString("en-IN")}`;
}

function deltaClass(delta: number | null) {
  if (!delta) return "text-muted-foreground";
  return delta > 0 ? "text-score-good" : "text-score-bad";
}

export function GmpTrendChart({ ipoId, companyName }: GmpTrendChartProps) {
  const [points, setPoints] = useState<ChartPoint[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/ipo/${ipoId}/gmp-history`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data?.success) throw new Error(data?.message || "Request failed");
        const series: GmpDay[] = Array.isArray(data.series) ? data.series : [];
        setPoints(
          series.map((p, i) => ({
            ...p,
            ts: new Date(p.t).getTime(),
            delta: i === 0 ? null : p.gmp - series[i - 1].gmp,
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [ipoId]);

  const summary = useMemo(() => {
    if (!points || points.length === 0) return null;
    const first = points[0];
    const last = points[points.length - 1];
    const change = last.gmp - first.gmp;
    return {
      first,
      last,
      change,
      // "Flat" is a real answer and deserves its own wording. A grey market
      // that has not moved in three days is telling you something.
      direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
    };
  }, [points]);

  // Ticks have to land on round numbers, so the axis is snapped to a 1/2/5 step
  // rather than to the padded extremes of the data.
  const { yDomain, yTicks } = useMemo(() => {
    const values = points?.map((p) => p.gmp) ?? [];
    const rawMin = values.length ? Math.min(...values) : 0;
    const rawMax = values.length ? Math.max(...values) : 1;

    // A flat series still needs a band to sit in, or the line lands on the axis.
    const spread = rawMax - rawMin || Math.max(1, Math.abs(rawMax) * 0.1);
    const targetStep = spread / 3;
    const magnitude = 10 ** Math.floor(Math.log10(targetStep));
    const step = [1, 2, 5, 10].find((m) => m * magnitude >= targetStep)! * magnitude;

    // GMP floors at zero in practice but can be quoted negative, so the floor is
    // only held at zero when nothing in the series is below it.
    const floor = Math.floor((rawMin - step / 2) / step) * step;
    const min = rawMin >= 0 ? Math.max(0, floor) : floor;
    const max = Math.ceil((rawMax + step / 2) / step) * step;

    const ticks: number[] = [];
    for (let v = min; v <= max + step / 2; v += step) ticks.push(Number(v.toFixed(4)));
    return { yDomain: [min, max] as [number, number], yTicks: ticks };
  }, [points]);

  // Half a day either side, so the first and last dates sit inside the plot
  // with room for their labels -- and a single day has an axis at all.
  const xDomain = useMemo((): [number, number] => {
    if (!points || points.length === 0) return [0, 1];
    return [points[0].ts - DAY_MS / 2, points[points.length - 1].ts + DAY_MS / 2];
  }, [points]);

  const xTicks = useMemo(() => points?.map((p) => p.ts) ?? [], [points]);

  const header = (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h3 className="text-xs font-mono uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
        <TrendingUp className="w-3.5 h-3.5" />
        GMP trend
      </h3>
      {points && points.length > 0 && (
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-pressed={showTable}
        >
          {showTable ? "Chart" : "Table"}
        </button>
      )}
    </div>
  );

  if (failed) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        {header}
        <p className="text-sm text-muted-foreground">GMP history couldn&apos;t be loaded right now.</p>
      </div>
    );
  }

  if (!points) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        {header}
        <div className="h-[200px] rounded-lg bg-muted/40 animate-pulse" />
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        {header}
        <p className="text-sm text-muted-foreground">
          No GMP readings recorded for this issue yet. The trend appears once the grey market
          has been quoted on more than one day.
        </p>
      </div>
    );
  }

  const last = points[points.length - 1];

  const directionColor =
    summary!.direction === "up"
      ? "text-score-good"
      : summary!.direction === "down"
        ? "text-score-bad"
        : "text-muted-foreground";

  const DirectionIcon =
    summary!.direction === "up" ? ArrowUpRight : summary!.direction === "down" ? ArrowDownRight : ArrowRight;

  const directionWord =
    summary!.direction === "up" ? "Up" : summary!.direction === "down" ? "Down" : "Flat";

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {header}

      {/* The answer, in words, before the evidence. */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
        <span className="font-mono text-2xl font-semibold text-foreground">
          {formatRupees(last.gmp)}
        </span>
        {points.length === 1 ? (
          // A direction needs two days. Until there are, the card says what it
          // has rather than implying a trend it cannot see yet.
          <span className="text-sm text-muted-foreground">First day, {formatDay(last.ts)}</span>
        ) : (
          <span className={cn("flex items-center gap-1 text-sm font-medium", directionColor)}>
            <DirectionIcon className="w-4 h-4" aria-hidden="true" />
            {directionWord}
            {summary!.change !== 0 && ` ${formatDelta(summary!.change)}`}
            <span className="text-muted-foreground font-normal">since {formatDay(summary!.first.ts)}</span>
          </span>
        )}
        {last.live && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-score-good animate-pulse" aria-hidden="true" />
            Live · as of {formatTime(new Date(last.as_of).getTime())} today
          </span>
        )}
      </div>

      {showTable ? (
        <div className="max-h-[220px] overflow-y-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Daily GMP for {companyName || "this IPO"}, newest first
            </caption>
            <thead>
              <tr className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="text-left font-medium py-1.5">Date</th>
                <th scope="col" className="text-right font-medium py-1.5">GMP</th>
                <th scope="col" className="text-right font-medium py-1.5">Change</th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((p) => (
                <tr key={p.date} className="border-t border-border">
                  <td className="py-1.5 text-muted-foreground">
                    {formatDay(p.ts)}
                    {p.live && (
                      <span className="ml-1.5 text-[10px] font-mono uppercase text-score-good">Live</span>
                    )}
                  </td>
                  <td className="py-1.5 text-right font-mono tabular-nums text-foreground">
                    {formatRupees(p.gmp)}
                  </td>
                  <td className={cn("py-1.5 text-right font-mono tabular-nums", deltaClass(p.delta))}>
                    {p.delta === null ? "—" : p.delta === 0 ? "No change" : formatDelta(p.delta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Height covers the plot AND the x-axis band, so the card never grows a
        // nested scrollbar to reach its own tick labels.
        <div className="h-[220px] -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gmpWash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.16} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Hairline, solid, one step off the surface. */}
              <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />

              <XAxis
                dataKey="ts"
                type="number"
                scale="time"
                domain={xDomain}
                ticks={xTicks}
                interval="preserveStartEnd"
                tickFormatter={formatDay}
                tickLine={false}
                axisLine={false}
                minTickGap={16}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <YAxis
                domain={yDomain}
                ticks={yTicks}
                width={48}
                tickFormatter={(v: number) => `₹${Math.round(v)}`}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />

              <Tooltip
                cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const point = payload[0].payload as ChartPoint;
                  return (
                    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-lg">
                      <p className="text-xs text-muted-foreground">
                        {formatDay(point.ts)}
                        {point.live && ` · Live, ${formatTime(new Date(point.as_of).getTime())}`}
                      </p>
                      <p className="font-mono text-sm font-semibold text-foreground">
                        GMP {formatRupees(point.gmp)}
                        {point.delta !== null && (
                          <span className={cn("ml-1.5 text-xs", deltaClass(point.delta))}>
                            {point.delta === 0 ? "no change" : formatDelta(point.delta)}
                          </span>
                        )}
                      </p>
                      {point.est_listing_percent !== null && (
                        <p className="font-mono text-xs text-muted-foreground">
                          Est. gain {point.est_listing_percent.toFixed(2)}%
                        </p>
                      )}
                    </div>
                  );
                }}
              />

              <Area
                // Straight segments: a quote jumps rather than glides, and a
                // smoothed curve would overshoot between days.
                type="linear"
                dataKey="gmp"
                stroke="var(--chart-1)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="url(#gmpWash)"
                // One dot per date, coloured by the day-on-day move.
                dot={(props: { cx?: number; cy?: number; index?: number; payload?: ChartPoint }) => {
                  const { cx, cy, index, payload } = props;
                  const key = `gmp-dot-${index}`;
                  if (cx == null || cy == null || !payload) return <g key={key} />;
                  const fill =
                    payload.delta && payload.delta > 0
                      ? "var(--score-good)"
                      : payload.delta && payload.delta < 0
                        ? "var(--score-bad)"
                        : "var(--chart-1)";
                  return (
                    <g key={key}>
                      {payload.live && <circle cx={cx} cy={cy} r={8} fill={fill} opacity={0.25} />}
                      <circle cx={cx} cy={cy} r={4} fill={fill} stroke="var(--card)" strokeWidth={2} />
                    </g>
                  );
                }}
                activeDot={{ r: 5, fill: "var(--chart-1)", stroke: "var(--card)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {points.length === 1 && (
        <p className="mt-3 text-xs text-muted-foreground">
          The line builds from here: one point per day, showing that day&apos;s latest GMP.
        </p>
      )}
    </div>
  );
}
