import { getRiskTextColor } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";

/** Analysis score as a pill tinted with its band colour, or a muted "–" when there is no analysis. */
export function ScorePill({ value }: { value: number }) {
  if (value <= 0) {
    return <span className="inline-block shrink-0 px-2.5 font-display text-lg font-bold text-muted-foreground" title="No analysis yet">–</span>;
  }
  return (
    <span
      title="Analysis score"
      className={cn(
        "inline-flex shrink-0 items-baseline whitespace-nowrap rounded-full bg-[color-mix(in_srgb,currentColor_11%,transparent)] px-2.5 py-1",
        getRiskTextColor(value)
      )}
    >
      <span className="font-mono text-sm font-medium tabular-nums">{value}</span>
      <span className="font-mono text-[11px] tabular-nums">/10</span>
    </span>
  );
}
