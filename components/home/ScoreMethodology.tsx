const MODULES = [
  { title: 'Financial fundamentals', body: 'Revenue, profit, margins, leverage and key ratios across three fiscal years.' },
  { title: 'Risk factors', body: 'Every named risk in the prospectus, sorted and weighed, plus any pending litigation.' },
  { title: 'Performance', body: 'Growth history, management track record and standing against listed peers.' },
  { title: 'Flexibility', body: 'How adaptable the business is to demand shocks, input costs and new markets.' },
  { title: 'Timing', body: 'Issue size, market conditions and where this filing sits in the listing calendar.' },
  {
    title: 'Final synthesis',
    body: 'Combines the 5 scores into one overall number, with a plain-English list of what looks good and what worries us.',
  },
];

/** Score ranges and the colour each one shows in, lifted toward chalk to read on the ink panel. */
const SCORE_BANDS = [
  { range: 'Above 6', label: 'Strong', dot: 'bg-score-good-on-ink' },
  { range: 'Above 3, up to 6', label: 'Mixed', dot: 'bg-score-mid-on-ink' },
  { range: '3 or below', label: 'Weak', dot: 'bg-score-bad-on-ink' },
];

/** Ink panel explaining the six analysis modules and what each score range means. */
export function ScoreMethodology() {
  return (
    <section className="py-8 sm:py-12">
      <div className="grid gap-10 rounded-[18px] bg-primary p-6 text-primary-foreground sm:p-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <div>
          <h2 className="type-h2">How the score is built</h2>
          <p className="mt-4 max-w-md text-primary-foreground/80">
            Six automated modules read every RHP/DRHP by the same rules. Five of them score on their own, and the sixth
            combines those into one verdict.
          </p>
          <p className="mt-3 max-w-md text-sm text-primary-foreground/70">
            From the closing day, institutional (QIB) demand nudges the score by up to{' '}
            <span className="font-mono tabular-nums">1.5</span> points: a strong QIB book adds to it, and once bidding has
            closed, an undersubscribed one takes away. Hover a score to see the adjustment.
          </p>
          <ul className="mt-8 flex flex-col gap-2">
            {SCORE_BANDS.map((band) => (
              <li key={band.label} className="flex items-center gap-3 rounded-lg bg-primary-foreground/5 px-4 py-2.5 text-sm">
                <span aria-hidden className={`size-2.5 rounded-full ${band.dot}`} />
                <span className="w-36 shrink-0 font-mono tabular-nums">{band.range}</span>
                <span className="text-primary-foreground/80">{band.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <ol className="divide-y divide-primary-foreground/15">
          {MODULES.map((module, index) => (
            <li key={module.title} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <span className="pt-0.5 font-mono text-sm tabular-nums text-primary-foreground/60">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-display text-lg font-bold tracking-[-0.015em]">{module.title}</h3>
                <p className="mt-1 text-sm text-primary-foreground/75">{module.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
