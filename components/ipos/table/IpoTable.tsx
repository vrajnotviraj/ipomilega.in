"use client";

import { useProgressRouter } from "@/components/progress/useProgressRouter";
import { scoreOf } from "@/lib/ipo/score";
import { cn } from "@/lib/utils";
import { ScorePill } from "@/components/ipos/table/ScorePill";
import { gmpOf, hasAnalysis, isListed, isPastBidding, issueSizeOf, listingDateOf, priceBandOf, subscribedOf } from "@/components/ipos/model/cells";
import { VIEWS } from "@/components/ipos/model/views";
import type { Filters, Row, SortBy } from "@/components/ipos/model/types";
import { Company } from "@/components/ipos/table/Company";
import { Figure, Gain, Stage } from "@/components/ipos/table/Figures";
import { SortHeader } from "@/components/ipos/table/SortHeader";

const TH = "px-4 py-3 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground";

/** IPO list: a table on wide screens, stacked rows on phones. Rows with an analysis open it on click, column titles sort. */
export function IpoTable({ rows, filters, onSort }: { rows: Row[]; filters: Filters; onSort: (by: SortBy) => void }) {
  const router = useProgressRouter();
  const { sort } = filters;
  const openAnalysis = (row: Row) => {
    if (hasAnalysis(row)) router.push(`/analysis/${row.ipo.slug}`);
  };
  const showBidding = rows.some((row) => !isPastBidding(row));
  const showListed = rows.some(isListed);
  const onlyListed = rows.every(isListed);
  const header = (by: SortBy, label: string, align?: "right") => <SortHeader by={by} sort={sort} onSort={onSort} align={align}>{label}</SortHeader>;

  return (
    <>
      <table className="hidden w-full lg:table">
        <thead>
          <tr className="border-b border-border text-left">
            <th className={TH}>{header("name", "Company")}</th>
            {showBidding && <th className={TH}>Price band</th>}
            <th className={TH}>{header("size", "Issue size")}</th>
            {showListed && <th className={TH}>{header("listing", "Listed on")}</th>}
            <th className={cn(TH, "text-right")}>{header("subscribed", "Subscribed", "right")}</th>
            <th className={cn(TH, "text-right")}>{header("gmp", "GMP", "right")}</th>
            <th className={cn(TH, "w-[232px]")}>
              {onlyListed ? (
                <div className="grid grid-cols-2 gap-3">
                  {header("listingGain", "Listing day")}
                  {header("heldGain", "Held till today")}
                </div>
              ) : (
                header(VIEWS[filters.status].stageSort, showListed ? "Timeline / gains" : "Timeline")
              )}
            </th>
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
              {showBidding && <td className="px-4 py-4 font-mono text-sm tabular-nums text-foreground">{isPastBidding(row) ? null : priceBandOf(row)}</td>}
              <td className="px-4 py-4 font-mono text-sm tabular-nums text-foreground">{issueSizeOf(row)}</td>
              {showListed && <td className="px-4 py-4 font-mono text-sm tabular-nums text-foreground">{isListed(row) ? listingDateOf(row) : null}</td>}
              <td className="px-4 py-4 text-right font-mono text-sm tabular-nums text-foreground">{subscribedOf(row)}</td>
              <td className="px-4 py-4 text-right"><Gain value={gmpOf(row)} /></td>
              <td className="px-4 py-4"><Stage row={row} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="reveal-stagger divide-y divide-border lg:hidden">
        {rows.map((row) => (
          <li key={row._id} onClick={() => openAnalysis(row)} className={cn("px-4 py-4", hasAnalysis(row) && "cursor-pointer transition-colors duration-150 active:bg-secondary")}>
            <div className="flex items-start justify-between gap-3">
              <Company row={row} />
              {!isPastBidding(row) && <ScorePill value={scoreOf(row)} />}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
              {!isPastBidding(row) && <Figure label="Price band">{priceBandOf(row)}</Figure>}
              <Figure label="Issue size">{issueSizeOf(row)}</Figure>
              <Figure label="Subscribed">{subscribedOf(row)}</Figure>
              <Figure label={isListed(row) ? "GMP before listing" : "GMP"}><Gain value={gmpOf(row)} /></Figure>
              {isListed(row) && <Figure label="Listed on">{listingDateOf(row)}</Figure>}
            </div>
            <div className="mt-3 rounded-lg bg-secondary px-3 py-2.5"><Stage row={row} /></div>
          </li>
        ))}
      </ul>
    </>
  );
}
