import { locale, t } from "@/lib/i18n/server";

/** The title, its line and the last-checked time on the left, the rules panel on the right (as tall as the title block from lg), the section chips under both. */
export function Hero({ lastChecked, children }: { lastChecked: string | null; children: React.ReactNode }) {
  const d = t().quota;
  return (
    <header>
      <div className="grid gap-x-10 gap-y-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
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

/** The four rules on one ink panel: two by two on phones, one row from sm, two by two again from lg, where it fills the title's height. */
function Rules() {
  const d = t().quota.hero;
  // Mono is for figures only, and DM Mono has no Devanagari or Gujarati glyphs, so words and hi and gu use the display face.
  const face = (value: string) => (locale() === "en" && /^[\d₹]/.test(value) ? "font-mono font-medium tracking-[-0.03em]" : "font-display font-bold tracking-[-0.015em]");
  return (
    <section aria-labelledby="rules-title" className="flex min-w-0">
      <h2 id="rules-title" className="sr-only">{d.rulesTitle}</h2>
      {/* The 1px gaps show the panel's lighter fill, drawing the dividers at any column count. */}
      <dl className="grid flex-1 grid-cols-2 gap-px overflow-hidden rounded-xl bg-primary-foreground/20 text-primary-foreground ring-1 ring-primary sm:grid-cols-4 lg:grid-cols-2">
        {d.rules.map((rule) => (
          <div key={rule.label} className="flex min-w-0 flex-col-reverse justify-end gap-1 bg-primary px-4 py-3 lg:justify-center lg:px-5">
            <dt className="text-[13px] text-pretty text-primary-foreground/80">{rule.label}</dt>
            <dd className={`${face(rule.value)} text-lg leading-tight tabular-nums sm:text-xl lg:text-2xl`}>{rule.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** The four steps from holding the parent to being allotted, as numbered dots on a rail. */
export function HowItWorks() {
  const d = t().quota.how;
  return (
    <section aria-labelledby="how-title" className="min-w-0">
      <h2 id="how-title" className="font-display text-xl font-bold tracking-[-0.015em] text-foreground">{d.title}</h2>
      <ol className="mt-4 grid">
        {d.steps.map((step, index) => (
          <li key={step.title} className="relative grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-4 pb-5 last:pb-0">
            {/* The rail runs from under this number to the next one. */}
            {index < d.steps.length - 1 && <span aria-hidden className="absolute bottom-0 left-[calc(0.875rem-0.5px)] top-8 w-px bg-border" />}
            <span aria-hidden className="relative grid size-7 place-items-center rounded-full bg-primary font-mono text-sm font-medium tabular-nums text-primary-foreground">
              {index + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <h3 className="font-display text-base font-bold leading-snug tracking-[-0.01em] text-foreground">{step.title}</h3>
              <p className="mt-1 max-w-[60ch] text-pretty text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
