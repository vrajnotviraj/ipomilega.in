"use client";

// How GMP has moved, one point per IST day: the direction in words on top, the line as evidence below.
// The line is rupees only; the estimated gain percent is a different scale, so it lives in the tooltip.

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

const IST = "Asia/Kolkata";
const DAY_MS = 24 * 60 * 60 * 1000;
const DIRECTION = {
  up: { word: "Up", color: "text-score-good", Icon: ArrowUpRight },
  down: { word: "Down", color: "text-score-bad", Icon: ArrowDownRight },
  flat: { word: "Flat", color: "text-muted-foreground", Icon: ArrowRight },
};

function formatDay(ts: number) {
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: IST });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: IST,
  });
}

function formatRupees(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

/** A signed rupee change, e.g. "+₹10", "-₹4", "₹0". */
function formatDelta(value: number) {
  if (value === 0) return "₹0";
  return `${value > 0 ? "+" : "-"}₹${Math.abs(value).toLocaleString("en-IN")}`;
}

function deltaClass(delta: number | null) {
  if (!delta) return "text-muted-foreground";
  return delta > 0 ? "text-score-good" : "text-score-bad";
}

function dotFill(delta: number | null) {
  if (!delta) return "var(--chart-1)";
  return delta > 0 ? "var(--score-good)" : "var(--score-bad)";
}

export function GmpTrendChart({ ipoId, companyName }: { ipoId: string; companyName?: string }) {
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

  // Ticks land on round numbers: the axis snaps to a 1/2/5 step, not the padded data extremes.
  const { yDomain, yTicks } = useMemo(() => {
    const values = points?.map((p) => p.gmp) ?? [];
    const rawMin = values.length ? Math.min(...values) : 0;
    const rawMax = values.length ? Math.max(...values) : 1;

    // A flat series still needs a band to sit in, or the line lands on the axis.
    const spread = rawMax - rawMin || Math.max(1, Math.abs(rawMax) * 0.1);
    const targetStep = spread / 3;
    const magnitude = 10 ** Math.floor(Math.log10(targetStep));
    const step = [1, 2, 5, 10].find((m) => m * magnitude >= targetStep)! * magnitude;

    // GMP can be quoted negative, so the floor holds at zero only when nothing is below it.
    const floor = Math.floor((rawMin - step / 2) / step) * step;
    const min = rawMin >= 0 ? Math.max(0, floor) : floor;
    const max = Math.ceil((rawMax + step / 2) / step) * step;

    const ticks: number[] = [];
    for (let v = min; v <= max + step / 2; v += step) ticks.push(Number(v.toFixed(4)));
    return { yDomain: [min, max] as [number, number], yTicks: ticks };
  }, [points]);

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

  const first = points[0];
  const last = points[points.length - 1];
  const change = last.gmp - first.gmp;
  const direction = DIRECTION[change > 0 ? "up" : change < 0 ? "down" : "flat"];
  // Half a day either side, so the end dates have room for their labels and a single day still has an axis.
  const xDomain: [number, number] = [first.ts - DAY_MS / 2, last.ts + DAY_MS / 2];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {header}

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
        <span className="font-mono text-2xl font-semibold text-foreground">
          {formatRupees(last.gmp)}
        </span>
        {points.length === 1 ? (
          <span className="text-sm text-muted-foreground">First day, {formatDay(last.ts)}</span>
        ) : (
          <span className={cn("flex items-center gap-1 text-sm font-medium", direction.color)}>
            <direction.Icon className="w-4 h-4" aria-hidden="true" />
            {direction.word}
            {change !== 0 && ` ${formatDelta(change)}`}
            <span className="text-muted-foreground font-normal">since {formatDay(first.ts)}</span>
          </span>
        )}
        {last.live && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-score-good animate-pulse" aria-hidden="true" />
            Live · as of {formatTime(last.as_of)} today
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
        // Height includes the x-axis band, so the card never needs a scrollbar to show its tick labels.
        <div className="h-[220px] -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gmpWash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.16} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />

              <XAxis
                dataKey="ts"
                type="number"
                scale="time"
                domain={xDomain}
                ticks={points.map((p) => p.ts)}
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
                        {point.live && ` · Live, ${formatTime(point.as_of)}`}
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
                // Straight segments: a smoothed curve would overshoot between days.
                type="linear"
                dataKey="gmp"
                stroke="var(--chart-1)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="url(#gmpWash)"
                // One dot per day, coloured by the day-on-day move.
                dot={({ cx, cy, index, payload }: { cx?: number; cy?: number; index?: number; payload?: ChartPoint }) => {
                  const key = `gmp-dot-${index}`;
                  if (cx == null || cy == null || !payload) return <g key={key} />;
                  const fill = dotFill(payload.delta);
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
