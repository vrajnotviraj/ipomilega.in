import type { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis";
import { getRiskTextColor } from "@/lib/ipo-score";
import { cn } from "@/lib/utils";
import { nonBlank } from "@/components/analysis/analysis-facts";
import { DotScale, Eyebrow, FactList, Prose, ScoreFigure, SectionHeading } from "@/components/analysis/primitives";

type Performance = IpoComprehensiveAnalysis["performance"];

/** The summary and the growth and position notes beside management quality, then the key achievements. */
export function PerformanceSection({ performance }: { performance: Performance }) {
  const growth = performance.historical_growth;
  const achievements = nonBlank(performance.key_achievements);

  const facts = [
    { term: "Historical growth", detail: growth?.pattern && [growth.pattern, growth.rate].filter(Boolean).join(", ") },
    { term: "Market comparison", detail: performance.market_comparison },
    { term: "Future potential", detail: performance.future_potential?.growth_forecast },
    { term: "Operational consistency", detail: performance.consistency_analysis?.rationale },
  ];

  return (
    <section id="performance" className="reveal">
      <SectionHeading title="Performance" score={performance.score} />
      <SummaryAndManagement summary={performance.summary} management={performance.management_quality}>
        <FactList columns facts={facts} className="rounded-[18px] bg-secondary px-5 py-2 sm:px-6 [&>div]:border-t-0" />
      </SummaryAndManagement>
      {achievements.length > 0 && <Achievements items={achievements} />}
    </section>
  );
}

/** The summary with its notes under it on the left, and the management panel on the right from lg up. */
function SummaryAndManagement({
  summary,
  management,
  children,
}: {
  summary: string;
  management: Performance["management_quality"] | undefined;
  children: React.ReactNode;
}) {
  const summaryAndNotes = (
    <div className="min-w-0 space-y-8">
      <Prose>{summary}</Prose>
      {children}
    </div>
  );
  if (!management) return summaryAndNotes;

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:gap-10">
      {summaryAndNotes}
      <ManagementPanel management={management} />
    </div>
  );
}

/** Management score as a large figure with its dot scale, then experience and track record. */
function ManagementPanel({ management }: { management: Performance["management_quality"] }) {
  const score = management.score || 0;
  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <Eyebrow>Management quality</Eyebrow>
      <div className={cn("mt-2 flex items-center gap-4", getRiskTextColor(score))}>
        <ScoreFigure score={score} />
        <DotScale score={score} />
      </div>
      <FactList
        className="mt-5 border-t border-border pt-4"
        facts={[
          { term: "Experience", detail: management.experience },
          { term: "Track record", detail: management.track_record },
        ]}
      />
    </div>
  );
}

/** Numbered achievements in two columns from md up. */
function Achievements({ items }: { items: string[] }) {
  return (
    <div className="mt-10">
      <h3 className="mb-4 font-display text-lg font-bold tracking-[-0.015em] sm:text-xl">Key achievements</h3>
      <ol className="reveal-stagger grid grid-cols-1 gap-x-8 md:grid-cols-2">
        {items.map((achievement, index) => (
          <li key={index} className="flex items-start gap-3 border-t border-border py-3 text-sm text-pretty">
            <span className="font-mono text-xs font-medium tabular-nums text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
            <span>{achievement}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
