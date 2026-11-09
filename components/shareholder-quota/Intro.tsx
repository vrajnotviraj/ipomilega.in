import { locale, t } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

/**
 * The title and its line, the section chips and the rules on the left; the Buy before deadlines, when there are any, on
 * the right as the hero's visual, since they are what a visitor came for. On a phone the deadlines come straight after
 * the title, ahead of the chips and the rules.
 */
export function Hero({ aside, children }: { aside: React.ReactNode; children: React.ReactNode }) {
  const d = t().quota.hero;
  const left = aside ? "lg:col-span-7 lg:col-start-1" : "lg:col-span-9";
  return (
    <header className="grid gap-x-8 gap-y-10 lg:grid-cols-12 lg:grid-rows-[auto_auto_1fr] lg:gap-y-8">
      <div className={cn("min-w-0 lg:row-start-1", left)}>
        <h1 className="font-display text-[44px] font-black leading-[0.95] tracking-[-0.035em] text-balance break-words text-foreground sm:text-[60px]">
          {d.before} <span className="highlight">{d.highlight}</span> {d.after}
        </h1>
        <p className="mt-5 max-w-[40ch] text-lg text-pretty text-muted-foreground">{d.lede}</p>
      </div>
      {aside && <div className="min-w-0 lg:col-span-5 lg:col-start-8 lg:row-span-3 lg:row-start-1">{aside}</div>}
      <div className={cn("min-w-0 lg:row-start-2", left)}>{children}</div>
      <div className={cn("min-w-0 self-start lg:row-start-3", left)}>
        <Rules />
      </div>
    </header>
  );
}

/** The four rules as figures, two by two, on the ink panel. */
function Rules() {
  const d = t().quota.hero;
  return (
    <section aria-labelledby="rules-title" className="rounded-[18px] bg-primary p-6 text-primary-foreground sm:p-8">
      <h2 id="rules-title" className="font-display text-xl font-bold tracking-[-0.015em] sm:text-2xl">{d.rulesTitle}</h2>
      <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {d.rules.map((rule) => (
          <div key={rule.label} className="flex min-w-0 flex-col-reverse justify-end gap-1.5 border-t border-primary-foreground/20 pt-4">
            <dt className="text-sm text-primary-foreground/80">{rule.label}</dt>
            {/* DM Mono has no Devanagari or Gujarati, so on hi and gu the values take the display face. */}
            <dd className={cn("whitespace-nowrap text-2xl tabular-nums sm:text-3xl", locale() === "en" ? "font-mono font-medium" : "font-display font-bold")}>
              {rule.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** The four steps from holding the parent to being allotted, as a numbered run across the page. */
export function HowItWorks() {
  const d = t().quota.how;
  return (
    <section aria-labelledby="how-title" className="mt-24 sm:mt-32">
      <h2 id="how-title" className="type-h2 text-balance">{d.title}</h2>
      <ol className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {d.steps.map((step, index) => (
          <li key={step.title} className="min-w-0 border-t-2 border-primary pt-5">
            <span aria-hidden className="font-mono text-3xl font-medium tabular-nums text-foreground">{index + 1}</span>
            <h3 className="mt-4 font-display text-lg font-bold leading-tight tracking-[-0.015em] text-foreground sm:text-xl">{step.title}</h3>
            <p className="mt-2 text-pretty text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
