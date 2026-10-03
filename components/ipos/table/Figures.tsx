import { formatGmp, gainColor, gainMotion, lastListing, parseEstListingPercent } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";
import { LifecycleTrack } from "@/components/ipo-shared/LifecycleTrack";
import { lifecycleCaption } from "@/components/ipo-shared/lifecycle";
import { Row } from "@/components/ipos/rows";

/** A gain % in green or red, or "N/A" when unknown. */
export function Gain({ value }: { value: number | null }) {
  return <span className={cn("font-mono text-sm font-medium tabular-nums", gainColor(value), gainMotion(value))}>{formatGmp(value)}</span>;
}

/** A small label above a figure. */
export function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="whitespace-nowrap font-mono text-sm font-medium tabular-nums text-foreground">{children}</div>
    </div>
  );
}

/** Listing date, then the listing-day gain and the gain at the last close. */
function Returns({ row }: { row: Row }) {
  return (
    <div>
      <p className="text-xs font-medium text-foreground">{lifecycleCaption(row.steps)}</p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <Figure label="Listing day"><Gain value={parseEstListingPercent(row.ipo?.listing_gain)} /></Figure>
        <Figure label="Held till today"><Gain value={lastListing(row.ipo).gain} /></Figure>
      </div>
    </div>
  );
}

/** Returns once listed, else the lifecycle timeline. */
export const Stage = ({ row }: { row: Row }) => (row.status === "Listed" ? <Returns row={row} /> : <LifecycleTrack steps={row.steps} />);
