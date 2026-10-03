import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DAY_MS, gainColor } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";
import { formatRupees } from "@/lib/ipo-format";
import { AXIS_TICK, dotFill, formatDay, formatDelta, formatTime, niceAxis, type ChartPoint } from "@/components/analysis/overview/gmp-trend/gmp-history";

function GmpTooltip({ point }: { point: ChartPoint }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-(--shadow-lift)">
      <p className="font-mono text-xs tabular-nums text-muted-foreground">
        {formatDay(point.ts)}
        {point.live && `, live ${formatTime(point.as_of)}`}
      </p>
      <p className="font-mono text-sm font-medium tabular-nums">
        GMP {formatRupees(point.gmp)}
        {point.delta !== null && (
          <span className={cn("ml-1.5 text-xs", gainColor(point.delta))}>{point.delta === 0 ? "no change" : formatDelta(point.delta)}</span>
        )}
      </p>
      {point.est_listing_percent !== null && (
        <p className="font-mono text-xs tabular-nums text-muted-foreground">
          Est. gain {point.est_listing_percent > 0 ? "+" : ""}
          {point.est_listing_percent.toFixed(2)}%
        </p>
      )}
    </div>
  );
}

/** Rupee line with one dot per day. The estimated gain is a different scale, so it stays in the tooltip. */
export function GmpChart({ points }: { points: ChartPoint[] }) {
  const yAxis = niceAxis(points.map((p) => p.gmp));
  // Half a day either side, so the end labels have room and a single day still has an axis.
  const xDomain: [number, number] = [points[0].ts - DAY_MS / 2, points[points.length - 1].ts + DAY_MS / 2];

  return (
    // Height includes the x-axis band, so the tick labels never need a scrollbar.
    <div className="-ml-2 min-h-[220px] flex-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gmpWash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.12} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
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
            tick={AXIS_TICK}
          />
          <YAxis
            domain={yAxis.domain}
            ticks={yAxis.ticks}
            width={48}
            tickFormatter={(v: number) => `₹${Math.round(v)}`}
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
          />
          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
            content={({ active, payload }) => (active && payload?.length ? <GmpTooltip point={payload[0].payload as ChartPoint} /> : null)}
          />
          <Area
            // Straight segments: a smoothed curve would overshoot between days.
            type="linear"
            dataKey="gmp"
            stroke="var(--primary)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#gmpWash)"
            dot={({ cx, cy, index, payload }: { cx?: number; cy?: number; index?: number; payload?: ChartPoint }) => (
              <g key={`gmp-dot-${index}`}>
                {cx != null && cy != null && payload && (
                  <circle cx={cx} cy={cy} r={payload.live ? 5 : 4} fill={dotFill(payload)} stroke="var(--card)" strokeWidth={2} />
                )}
              </g>
            )}
            activeDot={{ r: 5, fill: "var(--primary)", stroke: "var(--card)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
