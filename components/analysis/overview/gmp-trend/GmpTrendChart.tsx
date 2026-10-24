"use client";
import { useState } from "react";
import { gainColor } from "@/lib/ipo/format";
import { cn } from "@/lib/utils";
import { LiveLabel } from "@/components/ui/LiveLabel";
import dynamic from "next/dynamic";
import { formatRupees } from "@/lib/ipo/format";
import { useT } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/locales";
import { DIRECTION, formatDay, formatDelta, formatTime, useGmpHistory, type ChartPoint } from "@/components/analysis/overview/gmp-trend/gmp-history";

const GmpChart = dynamic(() => import("@/components/analysis/overview/gmp-trend/GmpChart").then((module) => module.GmpChart), {
  ssr: false,
  loading: () => <div className="h-[220px] rounded-lg bg-secondary" />,
});

/** How GMP has moved, one point per IST day: the direction in words, then the line or a table. */
export function GmpTrendChart({
  ipoId,
  companyName,
  todayGmp,
  todayAsOf,
}: {
  ipoId: string;
  companyName?: string;
  todayGmp: number | null;
  todayAsOf?: string;
}) {
  const d = useT().analysis.gmp;
  const history = useGmpHistory(ipoId);
  const noHistory = Array.isArray(history) && history.length === 0;
  const points = noHistory && todayGmp !== null ? [todayPoint(todayGmp, todayAsOf)] : history;
  const [showTable, setShowTable] = useState(false);
  const hasPoints = Array.isArray(points) && points.length > 0;
  const live = hasPoints ? points.find((point) => point.live) : undefined;

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-display text-lg font-bold tracking-[-0.015em] sm:text-xl">{d.title}</h3>
            {live && <LiveLabel />}
          </div>
          <p className="text-xs text-muted-foreground">
            {d.unofficialQuotes}
            {live ? (
              <>
                {d.asOf} <span className="font-mono tabular-nums">{formatTime(live.as_of)}</span> {d.istToday}
              </>
            ) : (
              d.timesInIst
            )}
          </p>
        </div>
        {hasPoints && (
          <button
            type="button"
            onClick={() => setShowTable((shown) => !shown)}
            aria-pressed={showTable}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-secondary active:scale-[0.98]"
          >
            {showTable ? d.chart : d.table}
          </button>
        )}
      </div>

      {points === "failed" && <p className="text-sm text-muted-foreground">{d.loadFailed}</p>}
      {points === null && <div className="h-[268px] rounded-lg bg-secondary" />}
      {Array.isArray(points) && points.length === 0 && <NoGmp />}
      {hasPoints && (
        <>
          <TrendSummary points={points} />
          {/* Grows to the card's height when the card sits beside a taller column. */}
          <div className="flex min-h-[220px] flex-1 flex-col">
            {showTable ? <GmpTable points={points} companyName={companyName} /> : <GmpChart points={points} />}
          </div>
          {points.length === 1 && (
            <p className="mt-3 text-xs text-muted-foreground">{d.firstPointNote}</p>
          )}
        </>
      )}
    </div>
  );
}

/** Today's quote as the first point of the series. */
function todayPoint(gmp: number, asOf = new Date().toISOString()): ChartPoint {
  const now = new Date();
  return { t: now.toISOString(), ts: now.getTime(), date: "", gmp, est_listing_price: null, est_listing_percent: null, as_of: asOf, live: true, delta: null };
}

/** A greyed dashed line where the chart goes, with a note that there is no quote yet. */
function NoGmp() {
  return (
    <div className="relative flex min-h-[220px] flex-1 items-center justify-center">
      <div aria-hidden className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-muted-foreground/30" />
      <p className="relative max-w-xs bg-card px-3 text-center text-sm text-muted-foreground">{useT().analysis.gmp.noQuote}</p>
    </div>
  );
}

function directionOf(change: number): keyof typeof DIRECTION {
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "flat";
}

/** A day's rupee move for the table: "-" for the first day, the no-change word, or a signed amount. */
function deltaLabel(delta: number | null, noChange: string): string {
  if (delta === null) return "-";
  if (delta === 0) return noChange;
  return formatDelta(delta);
}

/** Latest GMP, its move since the first reading, and the live time when today's reading is in. */
function TrendSummary({ points }: { points: ChartPoint[] }) {
  const first = points[0];
  const last = points[points.length - 1];
  const change = last.gmp - first.gmp;
  const direction = DIRECTION[directionOf(change)];
  const d = useT().analysis.gmp;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="font-mono text-2xl font-medium tabular-nums">{formatRupees(last.gmp)}</span>
      {points.length === 1 ? (
        <span className="text-sm text-muted-foreground">
          {d.firstDay} <span className="font-mono tabular-nums">{formatDay(last.ts)}</span>
        </span>
      ) : (
        <span className={cn("flex items-center gap-1 text-sm font-medium", direction.color)}>
          <direction.Icon className="size-4" strokeWidth={2} aria-hidden="true" />
          {d.direction[directionOf(change)]}
          {change !== 0 && <span className="font-mono tabular-nums">{formatDelta(change)}</span>}
          <span className="font-normal text-muted-foreground">
            {d.since} <span className="font-mono tabular-nums">{formatDay(first.ts)}</span>
          </span>
        </span>
      )}
    </div>
  );
}

function GmpTable({ points, companyName }: { points: ChartPoint[]; companyName?: string }) {
  const { common, analysis: { gmp: d } } = useT();
  return (
    <div className="max-h-[260px] overflow-y-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">{fill(d.tableCaption, { company: companyName || d.thisIpo })}</caption>
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
            <th scope="col" className="py-2 text-left font-medium">{d.date}</th>
            <th scope="col" className="py-2 text-right font-medium">GMP</th>
            <th scope="col" className="py-2 text-right font-medium">{d.change}</th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {[...points].reverse().map((point) => (
            <tr key={point.date}>
              <td className="py-1.5 text-muted-foreground">
                {formatDay(point.ts)}
                {point.live && <span className="ml-1.5 font-sans text-xs font-medium uppercase text-score-bad">{common.live}</span>}
              </td>
              <td className="py-1.5 text-right">{formatRupees(point.gmp)}</td>
              <td className={cn("py-1.5 text-right", gainColor(point.delta))}>
                {deltaLabel(point.delta, d.noChange)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
