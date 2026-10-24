import { t } from '@/lib/i18n/server';

/** Score bands and the colour each one shows in, lifted toward chalk to read on the ink panel. */
const SCORE_BANDS = [
  { band: 'good', dot: 'bg-score-good-on-ink' },
  { band: 'mid', dot: 'bg-score-mid-on-ink' },
  { band: 'bad', dot: 'bg-score-bad-on-ink' },
] as const;

/** Ink panel explaining the six analysis modules and what each score range means. */
export function ScoreMethodology() {
  const { common: c, home } = t();
  const d = home.methodology;
  return (
    <section className="py-8 sm:py-12">
      <div className="grid gap-10 rounded-[18px] bg-primary p-6 text-primary-foreground sm:p-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <div>
          <h2 className="type-h2">{d.title}</h2>
          <p className="mt-4 max-w-md text-primary-foreground/80">
            {d.lead}
          </p>
          <p className="mt-3 max-w-md text-sm text-primary-foreground/70">
            {d.qibNoteBefore}{' '}
            <span className="font-mono tabular-nums">1.5</span> {d.qibNoteAfter}
          </p>
          <ul className="mt-8 flex flex-col gap-2">
            {SCORE_BANDS.map(({ band, dot }) => (
              <li key={band} className="flex items-center gap-3 rounded-lg bg-primary-foreground/5 px-4 py-2.5 text-sm">
                <span aria-hidden className={`size-2.5 rounded-full ${dot}`} />
                <span className="w-36 shrink-0 font-mono tabular-nums">{d.bands[band]}</span>
                <span className="text-primary-foreground/80">{c.scoreWord[band]}</span>
              </li>
            ))}
          </ul>
        </div>

        <ol className="divide-y divide-primary-foreground/15">
          {d.modules.map((module, index) => (
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
