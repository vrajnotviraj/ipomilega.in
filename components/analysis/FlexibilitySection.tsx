import type { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis";
import { getRiskTextColor } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";
import { DotScale, Eyebrow, FactList, Prose, ScoreFigure, SectionHeading } from "./primitives";

type Metric = { score: number | null; description: string | null } | undefined;

/** How well the business can adapt: three scored metrics as tiles first, then the summary beside diversification and outlook notes. */
export function FlexibilitySection({ flexibility }: { flexibility: IpoComprehensiveAnalysis["flexibility"] }) {
  const metrics = [
    { label: "Market adaptability", metric: flexibility.market_adaptability },
    { label: "Financial stability", metric: flexibility.financial_stability },
    { label: "Operational agility", metric: flexibility.operational_agility },
  ].filter(({ metric }) => metric?.score != null);

  return (
    <section id="flexibility" className="reveal">
      <SectionHeading title="Flexibility" score={flexibility.score} />
      {metrics.length > 0 && (
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {metrics.map(({ label, metric }) => (
            <MetricTile key={label} label={label} metric={metric} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
        <Prose>{flexibility.summary}</Prose>
        <FactList
          className="rounded-[18px] bg-secondary p-5 sm:p-6"
          facts={[
            { term: "Product diversification", detail: flexibility.product_diversification },
            { term: "Future adaptability", detail: flexibility.future_adaptability_potential },
          ]}
        />
      </div>
    </section>
  );
}

/** One metric: its score as a large figure on a dot scale, and what drives it. */
function MetricTile({ label, metric }: { label: string; metric: Metric }) {
  const score = metric?.score ?? 0;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Eyebrow>{label}</Eyebrow>
      <div className={cn("mt-2 flex items-center justify-between gap-3", getRiskTextColor(score))}>
        <ScoreFigure score={score} />
        <DotScale score={score} />
      </div>
      {metric?.description && <p className="mt-3 text-sm text-pretty text-muted-foreground">{metric.description}</p>}
    </div>
  );
}
