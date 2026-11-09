import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/locales";
import type { QuotaStage } from "@/lib/queries/shareholder-quota";

// Weakest stage first, the order the stage track runs in.
const TRACK: QuotaStage[] = ["announced", "filed", "approved", "dates"];

/** The four stages as dots on a line: passed in ink, current in marigold, the rest hollow. */
export function StageTrack({ stage, className }: { stage: QuotaStage; className?: string }) {
  const d = t().quota;
  const current = TRACK.indexOf(stage);
  return (
    <ol aria-label={fill(d.stageLabel, { name: d.stages[stage], step: current + 1, total: TRACK.length })} className={cn("grid grid-cols-4", className)}>
      {TRACK.map((step, index) => (
        <li key={step} className="relative flex flex-col items-center text-center">
          {index < TRACK.length - 1 && (
            <span aria-hidden className={cn("absolute left-1/2 top-1 h-px w-full", index < current ? "bg-primary" : "bg-border")} />
          )}
          <span
            aria-hidden
            className={cn(
              "relative size-[9px] rounded-full",
              index < current && "bg-primary",
              index === current && "bg-brand-accent ring-2 ring-primary/80",
              index > current && "border border-muted-foreground/60 bg-card"
            )}
          />
          <span className={cn("mt-1.5 text-xs leading-tight", index === current ? "font-medium text-foreground" : "text-muted-foreground")}>
            {d.stages[step]}
          </span>
        </li>
      ))}
    </ol>
  );
}
