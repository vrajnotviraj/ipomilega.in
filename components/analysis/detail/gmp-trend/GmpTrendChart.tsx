"use client";
import { useState } from "react";
import { gainColor } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";
import { LiveLabel } from "@/components/ui/LiveLabel";
import dynamic from "next/dynamic";
import { DIRECTION, formatDay, formatDelta, formatRupees, formatTime, useGmpHistory, type ChartPoint } from "./gmp-history";

const GmpChart = dynamic(() => import("./GmpChart").then((module) => module.GmpChart), {
  ssr: false,
  loading: () => <div className="h-[220px] rounded-lg bg-secondary" />,
});

/** How GMP has moved, one point per IST day: the direction in words, then the line or a table. */
export function GmpTrendChart({ ipoId, companyName }: { ipoId: string; companyName?: string }) {
  const points = useGmpHistory(ipoId);
  const [showTable, setShowTable] = useState(false);
  const hasPoints = Array.isArray(points) && points.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold tracking-[-0.015em] sm:text-xl">GMP trend</h3>
          <p className="text-xs text-muted-foreground">Unofficial grey market quotes, times in IST</p>
        </div>
        {hasPoints && (
          <button
            type="button"
            onClick={() => setShowTable((shown) => !shown)}
            aria-pressed={showTable}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-secondary active:scale-[0.98]"
          >
            {showTable ? "Chart" : "Table"}
          </button>
        )}
      </div>

      {points === "failed" && <p className="text-sm text-muted-foreground">GMP history couldn&apos;t be loaded right now.</p>}
      {points === null && <div className="h-[268px] rounded-lg bg-secondary" />}
      {Array.isArray(points) && points.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No GMP readings recorded for this issue yet. The trend appears once the grey market has been quoted on more than one day.
        </p>
      )}
      {hasPoints && (
        <>
          <TrendSummary points={points} />
          {showTable ? <GmpTable points={points} companyName={companyName} /> : <GmpChart points={points} />}
          {points.length === 1 && (
            <p className="mt-3 text-xs text-muted-foreground">The line builds from here: one point per day, showing that day&apos;s latest GMP.</p>
          )}
        </>
      )}
    </div>
  );
}

function directionOf(change: number): keyof typeof DIRECTION {
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "flat";
}

/** A day's rupee move for the table: "-" for the first day, "No change", or a signed amount. */
function deltaLabel(delta: number | null): string {
  if (delta === null) return "-";
  if (delta === 0) return "No change";
  return formatDelta(delta);
}

/** Latest GMP, its move since the first reading, and the live time when today's reading is in. */
function TrendSummary({ points }: { points: ChartPoint[] }) {
  const first = points[0];
  const last = points[points.length - 1];
  const change = last.gmp - first.gmp;
  const direction = DIRECTION[directionOf(change)];

  return (
    <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="font-mono text-2xl font-medium tabular-nums">{formatRupees(last.gmp)}</span>
      {points.length === 1 ? (
        <span className="text-sm text-muted-foreground">
          First day, <span className="font-mono tabular-nums">{formatDay(last.ts)}</span>
        </span>
      ) : (
        <span className={cn("flex items-center gap-1 text-sm font-medium", direction.color)}>
          <direction.Icon className="size-4" strokeWidth={2} aria-hidden="true" />
          {direction.word}
          {change !== 0 && <span className="font-mono tabular-nums">{formatDelta(change)}</span>}
          <span className="font-normal text-muted-foreground">
            since <span className="font-mono tabular-nums">{formatDay(first.ts)}</span>
          </span>
        </span>
      )}
      {last.live && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <LiveLabel />
          as of <span className="font-mono tabular-nums">{formatTime(last.as_of)}</span> today
        </span>
      )}
    </div>
  );
}

function GmpTable({ points, companyName }: { points: ChartPoint[]; companyName?: string }) {
  return (
    <div className="max-h-[260px] overflow-y-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Daily GMP for {companyName || "this IPO"}, newest first</caption>
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
            <th scope="col" className="py-2 text-left font-medium">Date</th>
            <th scope="col" className="py-2 text-right font-medium">GMP</th>
            <th scope="col" className="py-2 text-right font-medium">Change</th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {[...points].reverse().map((point) => (
            <tr key={point.date}>
              <td className="py-1.5 text-muted-foreground">
                {formatDay(point.ts)}
                {point.live && <span className="ml-1.5 font-sans text-xs font-medium uppercase text-score-bad">Live</span>}
              </td>
              <td className="py-1.5 text-right">{formatRupees(point.gmp)}</td>
              <td className={cn("py-1.5 text-right", gainColor(point.delta))}>
                {deltaLabel(point.delta)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
