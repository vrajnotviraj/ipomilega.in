import { formatGmp, gainColor, gainMotion } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";
import { LifecycleTrack } from "@/components/ipo-shared/LifecycleTrack";
import { heldGainOf, isListed, listingGainOf } from "@/components/ipos/model/cells";
import type { Row } from "@/components/ipos/model/types";

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

/** Listing-day gain and gain at the last close. */
function Returns({ row }: { row: Row }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Figure label="Listing day"><Gain value={listingGainOf(row)} /></Figure>
      <Figure label="Held till today"><Gain value={heldGainOf(row)} /></Figure>
    </div>
  );
}

/** Returns once listed, else the lifecycle timeline. */
export const Stage = ({ row }: { row: Row }) => (isListed(row) ? <Returns row={row} /> : <LifecycleTrack steps={row.steps} />);
