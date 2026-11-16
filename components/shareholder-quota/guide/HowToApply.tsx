import { t } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

const RHP_DATE_STEP = 2;

/** The five steps from buying the parent share to allotment, on a timeline: down the page on phones, across from md. */
export function HowToApply() {
  const d = t().quota.how;
  return (
    <section aria-labelledby="how-title" className="min-w-0">
      <h2 id="how-title" className="font-display text-xl font-bold tracking-[-0.015em] text-balance text-foreground sm:text-2xl">{d.title}</h2>
      <ol className="mt-6 grid gap-6 md:grid-cols-5 md:gap-4">
        {d.steps.map((step, index) => (
          <li key={step.title} className="relative grid grid-cols-[1.75rem_minmax(0,1fr)] content-start gap-x-4 md:grid-cols-1 md:gap-y-3">
            {index < d.steps.length - 1 && <Rail index={index} />}
            <span
              aria-hidden
              className={cn(
                "relative grid size-7 place-items-center rounded-full font-mono text-sm font-medium tabular-nums ring-4 ring-background",
                index === RHP_DATE_STEP ? "bg-brand-accent text-primary" : "bg-primary text-primary-foreground"
              )}
            >
              {index + 1}
            </span>
            <div className="min-w-0 pt-0.5 md:pt-0">
              <p className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">{step.when}</p>
              <h3 className="mt-1 font-display text-base font-bold leading-snug tracking-[-0.01em] text-foreground">{step.title}</h3>
              <p className="mt-1 max-w-[60ch] text-sm text-pretty text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** The line from a step's dot to the next one. From md it fills with ink as it scrolls in, each segment a little after the one before. */
function Rail({ index }: { index: number }) {
  const across = "absolute left-3.5 top-[calc(0.875rem-0.5px)] hidden h-px w-[calc(100%+1rem)] md:block";
  return (
    <>
      <span aria-hidden className="absolute -bottom-6 left-[calc(0.875rem-0.5px)] top-7 w-px bg-primary md:hidden" />
      <span aria-hidden className={`${across} bg-border`} />
      <span aria-hidden className={`${across} grow-in bg-primary`} style={{ animationRange: `entry ${40 + index * 12}% cover ${45 + index * 8}%` }} />
    </>
  );
}
