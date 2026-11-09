import { locale, t } from "@/lib/i18n/server";

/** The title, its line and the last-checked time on the left, the rules strip on the right, the section chips under both. */
export function Hero({ lastChecked, children }: { lastChecked: string | null; children: React.ReactNode }) {
  const d = t().quota;
  return (
    <header>
      <div className="grid gap-x-10 gap-y-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <h1 className="type-hero text-[32px] text-balance break-words text-foreground sm:text-[40px]">
            {d.hero.before} <span className="highlight">{d.hero.highlight}</span> {d.hero.after}
          </h1>
          <p className="mt-3 max-w-[60ch] text-pretty text-foreground">{d.hero.lede}</p>
          {lastChecked && (
            <p className="mt-1 text-sm text-muted-foreground">
              {d.lastChecked} <span className="font-mono tabular-nums">{lastChecked}</span>.
            </p>
          )}
        </div>
        <Rules />
      </div>
      <div className="mt-6">{children}</div>
    </header>
  );
}

/** The four rules as one slim ink strip: two by two on phones, one row from sm. */
function Rules() {
  const d = t().quota.hero;
  // DM Mono has no Devanagari or Gujarati glyphs, so hi and gu set the values in the display face.
  const face = locale() === "en" ? "font-mono font-medium" : "font-display font-bold";
  return (
    <section aria-labelledby="rules-title" className="min-w-0">
      <h2 id="rules-title" className="sr-only">{d.rulesTitle}</h2>
      <dl className="grid grid-cols-2 overflow-hidden rounded-xl bg-primary text-primary-foreground sm:grid-cols-4">
        {d.rules.map((rule) => (
          <div key={rule.label} className="flex min-w-0 flex-col-reverse justify-end gap-0.5 border-primary-foreground/20 px-4 py-3 not-last:border-r max-sm:nth-[-n+2]:border-b max-sm:even:border-r-0">
            <dt className="text-[13px] text-primary-foreground/80">{rule.label}</dt>
            <dd className={`${face} text-lg leading-tight tabular-nums sm:text-xl`}>{rule.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** The four steps from holding the parent to being allotted, as a numbered list. */
export function HowItWorks() {
  const d = t().quota.how;
  return (
    <section aria-labelledby="how-title" className="min-w-0">
      <h2 id="how-title" className="font-display text-xl font-bold tracking-[-0.015em] text-foreground">{d.title}</h2>
      <ol className="mt-3 grid gap-4">
        {d.steps.map((step, index) => (
          <li key={step.title} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3">
            <span aria-hidden className="grid size-7 place-items-center rounded-full bg-secondary font-mono text-sm font-medium tabular-nums text-foreground">
              {index + 1}
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-base font-bold leading-snug tracking-[-0.01em] text-foreground">{step.title}</h3>
              <p className="mt-0.5 text-pretty text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
