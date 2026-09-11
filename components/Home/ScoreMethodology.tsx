// ScoreMethodology.tsx
// Static "How the score is built" explainer section.

const MODULES = [
  {
    num: '§01',
    title: 'Financial fundamentals',
    body: 'Revenue, profit, margins, leverage and key ratios across three fiscal years.',
  },
  {
    num: '§02',
    title: 'Risk factors',
    body: 'Every named risk in the prospectus, categorised and weighed — plus litigation exposure.',
  },
  {
    num: '§03',
    title: 'Performance',
    body: 'Growth history, management track record and standing against listed peers.',
  },
  {
    num: '§04',
    title: 'Flexibility',
    body: 'How adaptable the business is to demand shocks, input costs and new markets.',
  },
  {
    num: '§05',
    title: 'Timing',
    body: 'Issue size, market conditions and where this filing sits in the listing calendar.',
  },
  {
    num: '§06',
    title: 'Final synthesis',
    body: 'Reconciles the five scores into one overall score and a plain-English summary of strengths and concerns.',
  },
];

export function ScoreMethodology() {
  return (
    <section className="py-15">
      <div>
        <h2 className="text-2xl md:text-3xl font-semibold font-serif text-foreground mb-2">
          How the score is built
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base font-sans max-w-2xl">
          Six automated modules read every RHP/DRHP the same way, every time. Five score independently; the sixth reconciles them into one verdict.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8">
          {MODULES.map((module) => (
            <div
              key={module.num}
              className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="text-xs italic font-serif text-muted-foreground mb-2">{module.num}</div>
              <h3 className="font-serif font-semibold text-foreground mb-2">{module.title}</h3>
              <p className="text-sm text-muted-foreground">{module.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
