import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/locales";
import type { LapsedStage, QuotaStage } from "@/lib/queries/shareholder-quota";

// Weakest stage first, the order the stage track runs in.
const TRACK: QuotaStage[] = ["announced", "filed", "approved", "dates"];

/**
 * The four stages as dots on a line: passed in ink, current in marigold, the rest hollow.
 * A lapsed draft or approval stops the track there with a red crossed ring and a "lapsed" label instead of a current dot.
 */
export function StageTrack({ stage, lapsed, className }: { stage: QuotaStage; lapsed?: LapsedStage | null; className?: string }) {
  const d = t().quota;
  const current = TRACK.indexOf(lapsed ?? stage);
  const label = lapsed
    ? fill(d.lapsedLabel, { name: d.lapsed[lapsed], step: current + 1, total: TRACK.length })
    : fill(d.stageLabel, { name: d.stages[stage], step: current + 1, total: TRACK.length });
  return (
    <ol aria-label={label} className={cn("grid grid-cols-4", className)}>
      {TRACK.map((step, index) => (
        <li key={step} className="relative flex flex-col items-center text-center">
          {index < TRACK.length - 1 && (
            <span aria-hidden className={cn("absolute left-1/2 top-1 h-px w-full", index < current ? "bg-primary" : "bg-border")} />
          )}
          {lapsed && index === current ? (
            <span aria-hidden className="relative -my-px grid size-[11px] place-items-center rounded-full border border-destructive bg-card text-destructive">
              <X className="size-2" strokeWidth={3} />
            </span>
          ) : (
            <span
              aria-hidden
              className={cn(
                "relative size-[9px] rounded-full",
                index < current && "bg-primary",
                index === current && "bg-brand-accent ring-2 ring-primary/80",
                index > current && "border border-muted-foreground/60 bg-card"
              )}
            />
          )}
          <span className={cn("mt-1.5 text-xs leading-tight", index === current ? "font-medium text-foreground" : "text-muted-foreground", lapsed && index === current && "text-destructive")}>
            {lapsed && index === current ? d.lapsed[lapsed] : d.stages[step]}
          </span>
        </li>
      ))}
    </ol>
  );
}
