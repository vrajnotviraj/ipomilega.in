import { getRiskTextColor } from "@/lib/ipo-score";
import { cn } from "@/lib/utils";

/** An analysis score out of 10, coloured by band, or a muted "–" when the IPO has no analysis. */
export function Score({ value, title = "Analysis score" }: { value: number; title?: string }) {
  if (value <= 0) {
    return <span className="shrink-0 font-display text-xl font-bold text-muted-foreground" title="No analysis yet">–</span>;
  }
  return (
    <span className="shrink-0 whitespace-nowrap" title={title}>
      <span className={cn("font-display text-xl font-bold tabular-nums", getRiskTextColor(value))}>{value}</span>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">/10</span>
    </span>
  );
}
