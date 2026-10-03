"use client";

import { IpoLogo } from "@/components/ipo-shared/IpoLogo";
import { IpoTitleLink } from "@/components/ipo-shared/IpoTitleLink";
import { useProgressRouter } from "@/components/progress/useProgressRouter";
import { formatGmp, gainColor, gainMotion, getIpoType, lastListing, parseEstListingPercent, parseGainValue, scoreOf } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";
import { LifecycleTrack } from "@/components/ipo-shared/LifecycleTrack";
import { ScorePill } from "@/components/ipos/ScorePill";
import { Row, Status, hasAnalysis, isPastBidding, issueSizeOf, priceBandOf, subscribedText } from "@/components/ipos/rows";

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

/** A gain % in green or red, or "N/A" when unknown. */
function Gain({ value }: { value: number | null }) {
  return <span className={cn("font-mono text-sm font-medium tabular-nums", gainColor(value), gainMotion(value))}>{formatGmp(value)}</span>;
}

/** Last GMP quote; for a listed IPO that is the GMP before it listed. */
const gmpOf = (row: Row) => parseEstListingPercent(row.ipo?.gmp_price_gain);

const subscribedOf = (row: Row) => subscribedText(parseGainValue(row.ipo?.total_sr));

/** Listed IPOs: the gain on listing day and at the last close, in place of the finished timeline. */
function Returns({ row }: { row: Row }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Figure label="Listing day"><Gain value={parseEstListingPercent(row.ipo?.listing_gain)} /></Figure>
      <Figure label="Held till today"><Gain value={lastListing(row.ipo).gain} /></Figure>
    </div>
  );
}

const Progress = ({ row }: { row: Row }) => (row.status === "Listed" ? <Returns row={row} /> : <LifecycleTrack steps={row.steps} />);

function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="whitespace-nowrap font-mono text-sm font-medium tabular-nums text-foreground">{children}</div>
    </div>
  );
}

/** IPO list: a table on wide screens, stacked rows on phones. Rows with an analysis open it on click.
 * Price band and score only matter while bidding, so closed and listed rows leave them out, and the columns go when no row needs them. */
export function IpoTable({ rows }: { rows: Row[] }) {
  const router = useProgressRouter();
  const openAnalysis = (row: Row) => {
    if (hasAnalysis(row)) router.push(`/analysis/${row.ipo.slug}`);
  };
  const showBidding = rows.some((row) => !isPastBidding(row));
  const onlyListed = rows.every((row) => row.status === "Listed");

  return (
    <>
      <table className="hidden w-full lg:table">
        <thead>
          <tr className="border-b border-border text-left">
            <th className={TH}>Company</th>
            {showBidding && <th className={TH}>Price band</th>}
            <th className={TH}>Issue size</th>
            <th className={cn(TH, "text-right")}>Subscribed</th>
            <th className={cn(TH, "text-right")}>GMP</th>
            <th className={cn(TH, "w-[232px]")}>{onlyListed ? "Returns" : "Timeline"}</th>
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
              <td className="px-4 py-4 text-right font-mono text-sm tabular-nums text-foreground">{subscribedOf(row)}</td>
              <td className="px-4 py-4 text-right"><Gain value={gmpOf(row)} /></td>
              <td className="px-4 py-4"><Progress row={row} /></td>
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
              <Figure label={row.status === "Listed" ? "GMP before listing" : "GMP"}><Gain value={gmpOf(row)} /></Figure>
            </div>
            <div className="mt-3 rounded-lg bg-secondary px-3 py-2.5"><Progress row={row} /></div>
          </li>
        ))}
      </ul>
    </>
  );
}
