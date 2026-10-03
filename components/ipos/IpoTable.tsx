"use client";

import { IpoLogo } from "@/components/ipo-shared/IpoLogo";
import { IpoTitleLink } from "@/components/ipo-shared/IpoTitleLink";
import { useProgressRouter } from "@/components/progress/useProgressRouter";
import { formatGmp, gainColor, gainMotion, getIpoType, lastListing, scoreOf } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";
import { LifecycleTrack } from "@/components/ipo-shared/LifecycleTrack";
import { ScorePill } from "@/components/ipos/ScorePill";
import { Row, Status, gainOf, hasAnalysis, issueSizeOf, priceBandOf } from "@/components/ipos/rows";

const TH = "px-4 py-3 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground";

function StatusChip({ status }: { status: Status }) {
  if (status === "Open") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs font-medium text-score-bad">
        <span aria-hidden className="size-1.5 rounded-full bg-score-bad" />
        Open
      </span>
    );
  }
  const style = status === "Upcoming" ? "border border-border text-foreground" : "bg-secondary text-muted-foreground";
  return <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs font-medium", style)}>{status}</span>;
}

/** Logo, name, status chip and board label. */
function Company({ row }: { row: Row }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <IpoLogo src={row.ipo?.image_url} name={row.ipo?.upcoming_ipo_2025} />
      <div className="min-w-0">
        <div className="font-display font-bold tracking-[-0.015em] text-foreground">
          <IpoTitleLink ipo={row.ipo} hasAnalysis={hasAnalysis(row)} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <StatusChip status={row.status} />
          <span className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">{getIpoType(row.ipo)}</span>
        </div>
      </div>
    </div>
  );
}

/** Actual listing gain for listed IPOs, else the GMP estimate. Listed rows say which one it is, then the gain at the last close. */
function Gain({ row }: { row: Row }) {
  const { value, isActual } = gainOf(row);
  const now = row.status === "Listed" ? lastListing(row.ipo).gain : null;
  return (
    <span className="inline-flex flex-col">
      <span className={cn("font-mono text-sm font-medium tabular-nums", gainColor(value), gainMotion(value))}>{formatGmp(value)}</span>
      {row.status === "Listed" && <span className="font-sans text-xs font-normal text-muted-foreground">{isActual ? "Listed" : "Est."}</span>}
      {now !== null && (
        <span className="font-sans text-xs font-normal text-muted-foreground">
          Now <span className={cn("font-mono", gainColor(now))}>{formatGmp(now)}</span>
        </span>
      )}
    </span>
  );
}

function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="whitespace-nowrap font-mono text-sm font-medium tabular-nums text-foreground">{children}</div>
    </div>
  );
}

/** IPO list: a table on wide screens, stacked rows on phones. Rows with an analysis open it on click. */
export function IpoTable({ rows }: { rows: Row[] }) {
  const router = useProgressRouter();
  const openAnalysis = (row: Row) => {
    if (hasAnalysis(row)) router.push(`/analysis/${row.ipo.slug}`);
  };

  return (
    <>
      <table className="hidden w-full lg:table">
        <thead>
          <tr className="border-b border-border text-left">
            <th className={TH}>Company</th>
            <th className={TH}>Price band</th>
            <th className={TH}>Issue size</th>
            <th className={cn(TH, "text-right")}>GMP / listing</th>
            <th className={cn(TH, "w-[232px]")}>Timeline</th>
            <th className={cn(TH, "text-right")}>Score</th>
          </tr>
        </thead>
        <tbody className="reveal-stagger">
          {rows.map((row) => (
            <tr
              key={row._id}
              onClick={() => openAnalysis(row)}
              className={cn("border-b border-border last:border-b-0", hasAnalysis(row) && "cursor-pointer transition-colors duration-150 hover:bg-secondary/60")}
            >
              <td className="px-4 py-4"><Company row={row} /></td>
              <td className="px-4 py-4 font-mono text-sm tabular-nums text-foreground">{priceBandOf(row)}</td>
              <td className="px-4 py-4 font-mono text-sm tabular-nums text-foreground">{issueSizeOf(row)}</td>
              <td className="px-4 py-4 text-right"><Gain row={row} /></td>
              <td className="px-4 py-4"><LifecycleTrack steps={row.steps} /></td>
              <td className="px-4 py-4 text-right"><ScorePill value={scoreOf(row)} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="reveal-stagger divide-y divide-border lg:hidden">
        {rows.map((row) => (
          <li key={row._id} onClick={() => openAnalysis(row)} className={cn("px-4 py-4", hasAnalysis(row) && "cursor-pointer transition-colors duration-150 active:bg-secondary")}>
            <div className="flex items-start justify-between gap-3">
              <Company row={row} />
              <ScorePill value={scoreOf(row)} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
              <Figure label="Price band">{priceBandOf(row)}</Figure>
              <Figure label="Issue size">{issueSizeOf(row)}</Figure>
              <Figure label={row.status === "Listed" ? "Listing" : "GMP"}><Gain row={row} /></Figure>
            </div>
            <LifecycleTrack steps={row.steps} className="mt-3 rounded-lg bg-secondary px-3 py-2.5" />
          </li>
        ))}
      </ul>
    </>
  );
}
