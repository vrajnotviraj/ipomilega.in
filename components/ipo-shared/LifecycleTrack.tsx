"use client";

import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/locales";
import type { Dictionary } from "@/messages";
import { Step, StepName, StepState, When, lifecycleCaption } from "@/components/ipo-shared/lifecycle";

const DOT: Record<StepState, string> = {
  done: "bg-primary",
  today: "pulse-ring bg-brand-accent",
  future: "border border-muted-foreground/60 bg-card",
};

const wordsFor = (name: StepName, d: Dictionary) => d.ipo.lifecycle[name.toLowerCase() as Lowercase<StepName>];

/** "today", "tomorrow", "in 4 days" or "on 12 Oct" in the page's language. */
export const whenText = (when: When, d: Dictionary) => fill(d.ipo.lifecycle.when[when.kind], { days: when.days, date: when.date });

/** The timeline's one line in the page's language: "Allotment today", "Lists in 2 days", "Listed 18 Aug" or "Dates to be announced". */
export function captionText(steps: Step[], d: Dictionary): string {
  const caption = lifecycleCaption(steps);
  if (!caption) return d.common.datesTba;
  const words = wordsFor(caption.name, d);
  if (caption.tense === "today") return words.today;
  if (caption.tense === "past") return fill(words.past, { date: caption.date });
  return fill(words.next, { when: whenText(caption.when, d) });
}

/** Lifecycle steps as dots on a line: done is ink, today marigold with a ripple, future hollow. */
export function LifecycleTrack({ steps, showCaption = true, className }: { steps: Step[]; showCaption?: boolean; className?: string }) {
  const d = useT();
  const caption = captionText(steps, d);
  return (
    <div className={cn("min-w-0", className)}>
      {showCaption && <p className="text-xs font-medium text-foreground">{caption}</p>}
      <ol
        aria-label={fill(d.ipo.lifecycle.timeline, { caption })}
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
  const d = useT();
  const isTba = step.date === "TBA";
  return (
    <li className="relative flex flex-col items-center text-center">
      {lineToNext && (
        <span aria-hidden className={cn("absolute left-1/2 top-1 h-px w-full", lineToNext === "future" ? "bg-border" : "bg-primary")} />
      )}
      <span aria-hidden className={cn("relative size-[9px] rounded-full", DOT[step.state])} />
      <span className="mt-1.5 text-xs leading-none text-muted-foreground">{wordsFor(step.name, d).name}</span>
      <span className={cn("mt-1 whitespace-nowrap font-mono text-xs leading-none tabular-nums", isTba ? "text-muted-foreground" : "text-foreground")}>
        {isTba ? d.common.tba : step.date}
      </span>
      {step.state !== "future" && <span className="sr-only">, {d.ipo.lifecycle.state[step.state]}</span>}
    </li>
  );
}
