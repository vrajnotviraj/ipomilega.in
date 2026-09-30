'use client';

import { IpoSectionProps, HomePageIpoProps } from '@/types/homepage';
import { ClosedIpoCard } from '@/components/home/ipo-card/ClosedIpoCard';
import { SectionHeading } from '@/components/home/SectionHeading';
import { useBoard } from '@/components/home/BoardContext';
import { daysFromToday, getIpoType, gmpOf } from '@/lib/ipo-format';

// Stages by allotment day. Every past allotment day collapses into the one OUT stage.
const TODAY = 0;
const OUT = -1;
const TBA = Infinity;

const stageLabel = (stage: number) => {
  if (stage === OUT) return 'Allotment out, listing soon';
  if (stage === TBA) return 'Allotment date TBA';
  if (stage === TODAY) return 'Allotment today';
  if (stage === 1) return 'Allotment tomorrow';
  return `Allotment in ${stage} days`;
};

/** Groups IPOs by allotment stage, allotment today first, the rest in date order; highest GMP first within a stage. */
function groupByAllotmentStage(ipos: HomePageIpoProps[]) {
  const stages = new Map<number, HomePageIpoProps[]>();
  for (const item of [...ipos].sort((a, b) => gmpOf(b) - gmpOf(a))) {
    const days = daysFromToday(item.ipo?.ipo_dates?.basis_of_allotment);
    const stage = days === null ? TBA : Math.max(days, OUT);
    stages.set(stage, [...(stages.get(stage) || []), item]);
  }
  const rank = (stage: number) => (stage === TODAY ? -Infinity : stage);
  return [...stages].sort(([a], [b]) => rank(a) - rank(b));
}

/** IPOs whose bidding has closed but which have not listed yet, for the chosen board. */
export function ClosedIposSection({ ipos }: IpoSectionProps) {
  const { board } = useBoard();
  const boardIpos = ipos.filter((item) => getIpoType(item.ipo) === board);
  if (boardIpos.length === 0) return null;

  return (
    <section className="py-16 sm:py-24">
      <SectionHeading title="Bidding closed" href="/ipos?filter=closed" linkLabel={`View all ${ipos.length} closed IPOs`} />
      <div className="mt-8 space-y-10">
        {groupByAllotmentStage(boardIpos).map(([stage, items]) => (
          <div key={stage}>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              {stage === TODAY ? (
                <span className="rounded-full bg-brand-accent px-2.5 py-0.5 text-xs font-medium text-primary">{stageLabel(stage)}</span>
              ) : (
                stageLabel(stage)
              )}
              <span className="font-mono text-xs tabular-nums">({items.length})</span>
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <ClosedIpoCard key={item._id} ipo={item.ipo} analysis={item.analysis} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
