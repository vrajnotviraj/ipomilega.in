import { cn } from "@/lib/utils";
import type { QuotaStage } from "@/lib/queries/shareholder-quota";
import { STAGE_TRACK } from "@/components/shareholder-quota/content";

/** The four stages as dots on a line: passed in ink, current in marigold, the rest hollow. */
export function StageTrack({ stage, className }: { stage: QuotaStage; className?: string }) {
  const current = STAGE_TRACK.findIndex((step) => step.stage === stage);
  return (
    <ol aria-label={`Stage: ${STAGE_TRACK[current].name}, step ${current + 1} of ${STAGE_TRACK.length}`} className={cn("grid grid-cols-4", className)}>
      {STAGE_TRACK.map((step, index) => (
        <li key={step.stage} className="relative flex flex-col items-center text-center">
          {index < STAGE_TRACK.length - 1 && (
            <span aria-hidden className={cn("absolute left-1/2 top-1 h-px w-full", index < current ? "grow-in bg-primary" : "bg-border")} />
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
            {step.name}
          </span>
        </li>
      ))}
    </ol>
  );
}
