import { RULES, STEPS } from "@/components/shareholder-quota/content";

/** Page title and the answer in one paragraph (which IPOs, which parents), with the rules in numbers beside them. */
export function Hero({ summary }: { summary: string }) {
  return (
    <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end lg:gap-12">
      <div>
        <h1 className="type-hero text-[44px] text-balance text-foreground sm:text-[60px]">
          Upcoming <span className="highlight">shareholder quota</span> IPOs
        </h1>
        <p className="mt-5 max-w-[65ch] text-lg text-pretty text-muted-foreground">
          {summary} Hold one share of the listed parent before the RHP date to apply in the shareholder category, a second shot at
          allotment on top of retail.
        </p>
      </div>
      <section aria-labelledby="rules-title" className="rounded-[18px] border border-border bg-card p-5">
        <h2 id="rules-title" className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">The rules in numbers</h2>
        <dl className="mt-3 divide-y divide-border">
          {RULES.map((rule) => (
            <div key={rule.label} className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <dt className="text-sm text-muted-foreground">{rule.label}</dt>
              <dd className="whitespace-nowrap font-mono text-xl font-medium tabular-nums text-foreground">{rule.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </header>
  );
}

/** The four steps from holding the parent to being allotted. */
export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="mt-10 rounded-[18px] bg-secondary p-4 sm:p-6">
      <h2 id="how-title" className="font-display text-xl font-bold tracking-[-0.015em] text-foreground">How it works</h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3 sm:block">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary font-mono text-sm font-medium tabular-nums text-primary-foreground">
              {index + 1}
            </span>
            <div className="min-w-0 sm:mt-3">
              <h3 className="font-display font-bold leading-tight tracking-[-0.015em] text-foreground">{step.title}</h3>
              <p className="mt-1 text-sm text-pretty text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
