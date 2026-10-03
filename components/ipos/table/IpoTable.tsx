"use client";

import { useProgressRouter } from "@/components/progress/useProgressRouter";
import { scoreOf } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";
import { ScorePill } from "@/components/ipos/ScorePill";
import { Row, gmpOf, hasAnalysis, isPastBidding, issueSizeOf, listingDateOf, priceBandOf, subscribedOf } from "@/components/ipos/rows";
import { Company } from "@/components/ipos/table/Company";
import { Figure, Gain, Stage } from "@/components/ipos/table/Figures";

const isListed = (row: Row) => row.status === "Listed";

const TH = "px-4 py-3 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground";

/** IPO list: a table on wide screens, stacked rows on phones. Rows with an analysis open it on click.
 * Closed and listed rows skip price band and score, other rows skip the listing date; each column hides when no row has it. */
export function IpoTable({ rows }: { rows: Row[] }) {
  const router = useProgressRouter();
  const openAnalysis = (row: Row) => {
    if (hasAnalysis(row)) router.push(`/analysis/${row.ipo.slug}`);
  };
  const showBidding = rows.some((row) => !isPastBidding(row));
  const showListed = rows.some(isListed);
  const stageHeader = rows.every(isListed) ? "Gains" : showListed ? "Timeline / gains" : "Timeline";

  return (
    <>
      <table className="hidden w-full lg:table">
        <thead>
          <tr className="border-b border-border text-left">
            <th className={TH}>Company</th>
            {showBidding && <th className={TH}>Price band</th>}
            <th className={TH}>Issue size</th>
            {showListed && <th className={TH}>Listed on</th>}
            <th className={cn(TH, "text-right")}>Subscribed</th>
            <th className={cn(TH, "text-right")}>GMP</th>
            <th className={cn(TH, "w-[232px]")}>{stageHeader}</th>
            {showBidding && <th className={cn(TH, "text-right")}>Score</th>}
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
              {showBidding && <td className="px-4 py-4 text-right">{isPastBidding(row) ? null : <ScorePill value={scoreOf(row)} />}</td>}
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
