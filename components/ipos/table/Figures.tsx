import { gainColor, gainMotion, signedPercent } from "@/lib/ipo/format";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { LifecycleTrack } from "@/components/ipo-shared/LifecycleTrack";
import { heldGainOf, isListed, listingGainOf } from "@/components/ipos/model/cells";
import type { Row } from "@/components/ipos/model/types";

/** A gain % in green or red, or "N/A" when unknown. */
export function Gain({ value }: { value: number | null }) {
  const na = useT().common.na;
  return <span className={cn("font-mono text-sm font-medium tabular-nums", gainColor(value), gainMotion(value))}>{value === null ? na : signedPercent(value)}</span>;
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
  const w = useT().ipos.table;
  return (
    <div className="grid grid-cols-2 gap-3">
      <Figure label={w.listingDay}><Gain value={listingGainOf(row)} /></Figure>
      <Figure label={w.heldTillToday}><Gain value={heldGainOf(row)} /></Figure>
    </div>
  );
}

/** Returns once listed, else the lifecycle timeline. */
export const Stage = ({ row }: { row: Row }) => (isListed(row) ? <Returns row={row} /> : <LifecycleTrack steps={row.steps} />);
