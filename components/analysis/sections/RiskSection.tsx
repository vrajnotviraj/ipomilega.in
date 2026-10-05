import type { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis";
import { cn } from "@/lib/utils";
import { nonBlank } from "@/components/analysis/analysis-facts";
import { Prose, SectionHeading } from "@/components/analysis/primitives";

type RiskCategory = { title: string; items: string[] };

/** "financial_risks" as "Financial risks". */
function categoryTitle(key: string) {
  const words = key.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** How many risks sit in each category beside the summary and how the company offsets them, then the risks themselves. */
export function RiskSection({ risk }: { risk: IpoComprehensiveAnalysis["risk_meter"] }) {
  const categories = Object.entries(risk.risk_categories ?? {})
    .map(([key, items]) => ({ title: categoryTitle(key), items: nonBlank(items) }))
    .filter((category) => category.items.length > 0);

  return (
    <section id="risk" className="reveal">
      <SectionHeading title="Risk" score={risk.score} />
      <p className="mb-6 text-xs text-muted-foreground">
        Read this score as a safety rating: <span className="font-mono tabular-nums">10/10</span> means the lowest risk,{" "}
        <span className="font-mono tabular-nums">1/10</span> the highest.
      </p>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        {categories.length > 0 && <RiskMix categories={categories} />}
        <div className={cn("min-w-0 space-y-6", categories.length > 0 ? "lg:col-start-2" : "lg:col-span-2")}>
          <Prose>{risk.summary}</Prose>
          {risk.risk_mitigation && <Mitigation text={risk.risk_mitigation} />}
        </div>
      </div>

      {categories.length > 0 && <RiskCategories categories={categories} />}
    </section>
  );
}

/** One row per category with its count and a small loss-red bar scaled to the largest category. */
function RiskMix({ categories }: { categories: RiskCategory[] }) {
  const maxCount = Math.max(...categories.map((category) => category.items.length));

  return (
    <div>
      <h3 className="mb-3 font-display text-lg font-bold tracking-[-0.015em] sm:text-xl">Where the risks sit</h3>
      <ul className="reveal-stagger space-y-3">
        {categories.map(({ title, items }) => (
          <li key={title}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{title}</span>
              <span className="font-mono font-medium tabular-nums">{items.length}</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-score-bad" style={{ width: `${(items.length / maxCount) * 100}%` }} aria-hidden="true" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The risks grouped by category on one surface panel. */
function RiskCategories({ categories }: { categories: RiskCategory[] }) {
  return (
    <div className="reveal-stagger mt-8 grid grid-cols-1 gap-x-8 gap-y-8 rounded-[18px] bg-secondary p-5 sm:grid-cols-2 sm:p-8 xl:grid-cols-4">
      {categories.map(({ title, items }) => (
        <div key={title}>
          <h3 className="mb-3 flex items-baseline justify-between gap-3 border-b border-border pb-2 font-display text-lg font-bold tracking-[-0.015em] sm:text-xl">
            {title}
            <span className="font-mono text-sm font-medium tabular-nums text-muted-foreground">{items.length}</span>
          </h3>
          <ul className="list-outside list-disc space-y-2 pl-5 text-sm marker:text-score-bad">
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** How the company offsets its risks, tinted green against the red risk list. */
function Mitigation({ text }: { text: string }) {
  return (
    <div className="rounded-lg bg-score-good/8 p-5">
      <h3 className="font-display text-lg font-bold tracking-[-0.015em] sm:text-xl">How the company offsets these</h3>
      <p className="mt-1.5 whitespace-pre-wrap text-sm text-pretty">{text}</p>
    </div>
  );
}
