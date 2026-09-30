import { getRiskTextColor } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";

const SIZES = { lg: "text-lg", xl: "text-xl", "3xl": "text-3xl" } as const;

/** An analysis score out of 10, coloured by band, or a muted "–" when the IPO has no analysis. */
export function Score({ value, size = "xl", title = "Analysis score" }: { value: number; size?: keyof typeof SIZES; title?: string }) {
  if (value <= 0) {
    return <span className={cn("shrink-0 font-display font-bold text-muted-foreground", SIZES[size])} title="No analysis yet">–</span>;
  }
  return (
    <span className="shrink-0 whitespace-nowrap" title={title}>
      <span className={cn("font-display font-bold tabular-nums", SIZES[size], getRiskTextColor(value))}>{value}</span>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">/10</span>
    </span>
  );
}
