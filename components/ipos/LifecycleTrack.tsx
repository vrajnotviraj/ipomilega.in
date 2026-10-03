import { cn } from "@/lib/utils";
import { Step, StepState, lifecycleCaption } from "@/components/ipos/rows";

const DOT: Record<StepState, string> = {
  done: "bg-primary",
  today: "pulse-ring bg-brand-accent",
  future: "border border-muted-foreground/60 bg-card",
};

/** Lifecycle steps as dots on a line: done is ink, today marigold with a ripple, future hollow. */
export function LifecycleTrack({ steps, showCaption = true, className }: { steps: Step[]; showCaption?: boolean; className?: string }) {
  const caption = lifecycleCaption(steps);
  return (
    <div className={cn("min-w-0", className)}>
      {showCaption && <p className="text-xs font-medium text-foreground">{caption}</p>}
      <ol
        aria-label={`IPO timeline. ${caption}`}
        className={cn("grid", showCaption && "mt-2")}
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step, index) => (
          <TrackStep key={step.name} step={step} lineToNext={index < steps.length - 1 ? steps[index + 1].state : null} />
        ))}
      </ol>
    </div>
  );
}

/** One dot with its name and date. The line to the next dot is ink once that step is reached. */
function TrackStep({ step, lineToNext }: { step: Step; lineToNext: StepState | null }) {
  const isTba = step.date === "TBA";
  return (
    <li className="relative flex flex-col items-center text-center">
      {lineToNext && (
        <span aria-hidden className={cn("absolute left-1/2 top-1 h-px w-full", lineToNext === "future" ? "bg-border" : "track-grow bg-primary")} />
      )}
      <span aria-hidden className={cn("relative size-[9px] rounded-full", DOT[step.state])} />
      <span className="mt-1.5 text-xs leading-none text-muted-foreground">{step.name}</span>
      <span className={cn("mt-1 whitespace-nowrap font-mono text-xs leading-none tabular-nums", isTba ? "text-muted-foreground" : "text-foreground")}>
        {step.date}
      </span>
      {step.state !== "future" && <span className="sr-only">, {step.state}</span>}
    </li>
  );
}
