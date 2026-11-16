import { locale, t } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

/** The title, its line, the last-checked time and the section chips on the left; the two-pools panel on the right from lg, under the title below it. */
export function Hero({ lastChecked, children }: { lastChecked: string | null; children: React.ReactNode }) {
  const d = t().quota;
  return (
    <header className="grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
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
        <div className="mt-6">{children}</div>
      </div>
      <TwoPools />
    </header>
  );
}

/**
 * The idea in one picture, on the ink panel: the issue as a bar with the shareholder quota carved off at its 10% cap,
 * a key saying who bids in each part, then the rules as figures. Static: it is above the fold.
 */
function TwoPools() {
  const d = t().quota.hero;
  // Mono is for figures only, and DM Mono has no Devanagari or Gujarati glyphs, so words and hi and gu use the display face.
  const face = (value: string) => (locale() === "en" && /^[\d₹]/.test(value) ? "font-mono font-medium tracking-[-0.03em]" : "font-display font-bold tracking-[-0.015em]");
  const pools = [
    { swatch: "bg-primary-foreground/35", name: d.split.everyone, note: d.split.everyoneNote },
    { swatch: "bg-brand-accent", name: d.split.quota, note: d.split.quotaNote },
  ];
  return (
    <section aria-labelledby="pools-title" className="min-w-0 rounded-xl bg-primary p-5 text-primary-foreground sm:p-6">
      <h2 id="pools-title" className="font-display text-lg font-bold tracking-[-0.015em]">{d.split.title}</h2>
      {/* Drawn to scale: the quota is at most a tenth of the issue. The key below says the same in words. */}
      <div aria-hidden className="mt-4 flex h-3 gap-1">
        <span className="flex-[9] rounded-full bg-primary-foreground/35" />
        <span className="flex-1 rounded-full bg-brand-accent" />
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {pools.map((pool) => (
          <li key={pool.name} className="grid grid-cols-[0.625rem_minmax(0,1fr)] gap-x-2.5">
            <span aria-hidden className={cn("mt-[0.4em] size-2.5 rounded-full", pool.swatch)} />
            <span className="min-w-0">
              <span className="block font-medium leading-snug">{pool.name}</span>
              <span className="block text-sm text-primary-foreground/80">{pool.note}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-pretty text-primary-foreground">{d.split.both}</p>
      <h3 className="sr-only">{d.rulesTitle}</h3>
      <dl className="mt-5 grid grid-cols-3 divide-x divide-primary-foreground/20 border-t border-primary-foreground/20 pt-4">
        {d.rules.map((rule) => (
          <div key={rule.label} className="flex min-w-0 flex-col-reverse justify-end gap-1 px-3 first:pl-0 last:pr-0">
            <dt className="text-[13px] leading-snug text-pretty text-primary-foreground/80">{rule.label}</dt>
            <dd className={`${face(rule.value)} text-lg leading-tight tabular-nums sm:text-xl`}>{rule.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * The five moments from buying the parent to allotment, in time order: a vertical rail on phones, one row from md.
 * The row's rail fills left to right as it scrolls in, one segment after another, the way the days pass.
 * The RHP date, the one deadline that decides eligibility, is the marigold dot.
 */
export function HowItWorks() {
  const d = t().quota.how;
  const deadline = 2;
  return (
    <section aria-labelledby="how-title" className="min-w-0">
      <h2 id="how-title" className="font-display text-xl font-bold tracking-[-0.015em] text-balance text-foreground sm:text-2xl">{d.title}</h2>
      <ol className="mt-6 grid gap-6 md:grid-cols-5 md:gap-4">
        {d.steps.map((step, index) => (
          <li key={step.title} className="relative grid grid-cols-[1.75rem_minmax(0,1fr)] content-start gap-x-4 md:grid-cols-1 md:gap-y-3">
            {index < d.steps.length - 1 && (
              <>
                {/* Phones: a still rail down to the next dot. */}
                <span aria-hidden className="absolute -bottom-6 left-[calc(0.875rem-0.5px)] top-7 w-px bg-primary md:hidden" />
                {/* From md: a track to the next column's dot, and its ink fill growing in after the one before it. */}
                <span aria-hidden className="absolute left-3.5 top-[calc(0.875rem-0.5px)] hidden h-px w-[calc(100%+1rem)] bg-border md:block" />
                <span
                  aria-hidden
                  className="grow-in absolute left-3.5 top-[calc(0.875rem-0.5px)] hidden h-px w-[calc(100%+1rem)] bg-primary md:block"
                  style={{ animationRange: `entry ${40 + index * 12}% cover ${45 + index * 8}%` }}
                />
              </>
            )}
            <span
              aria-hidden
              className={cn(
                "relative grid size-7 place-items-center rounded-full font-mono text-sm font-medium tabular-nums ring-4 ring-background",
                index === deadline ? "bg-brand-accent text-primary" : "bg-primary text-primary-foreground"
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
