'use client';

import { IpoSectionProps, HomePageIpoProps } from '@/types/ipo-with-analysis';
import { ClosedIpoCard } from '@/components/home/ipo-card/ClosedIpoCard';
import { SectionHeading } from '@/components/home/SectionHeading';
import { useBoard } from '@/components/home/BoardContext';
import { Clock } from 'lucide-react';
import { getIpoType, gmpOf } from '@/lib/ipo-format';
import { afterCloseSteps, lifecycleCaption, type Step } from '@/components/ipos/rows';

/** The step an IPO is on: the one due today, else the next dated one. Null once nothing is left or dates are missing. */
function currentStep(steps: Step[]) {
  const index = steps.findIndex((step) => step.state === 'today' || (step.state === 'future' && step.days !== null));
  return index === -1 ? null : { index, days: steps[index].days ?? Infinity };
}

/**
 * Groups IPOs by what happens next ("Allotment today", "Lists in 2 days"), soonest first and, on the same day,
 * earlier steps first. Highest GMP first within a group.
 */
function groupByNextStep(ipos: HomePageIpoProps[]) {
  const groups = new Map<string, { rank: [number, number]; isToday: boolean; items: HomePageIpoProps[] }>();
  for (const item of [...ipos].sort((a, b) => gmpOf(b) - gmpOf(a))) {
    const steps = afterCloseSteps(item.ipo);
    const step = currentStep(steps);
    const caption = lifecycleCaption(steps);
    const group = groups.get(caption) ?? { rank: step ? [step.days, step.index] : [Infinity, 0], isToday: step?.days === 0, items: [] };
    group.items.push(item);
    groups.set(caption, group);
  }
  return [...groups].sort(([, a], [, b]) => a.rank[0] - b.rank[0] || a.rank[1] - b.rank[1]);
}

/** IPOs whose bidding has closed but which have not listed yet, for the chosen board. */
export function ClosedIposSection({ ipos }: IpoSectionProps) {
  const { board } = useBoard();
  const boardIpos = ipos.filter((item) => getIpoType(item.ipo) === board);
  if (boardIpos.length === 0) return null;

  return (
    <section className="py-8 sm:py-12">
      <SectionHeading title="Bidding closed" href="/ipos?filter=closed" linkLabel={`View all ${ipos.length} closed IPOs`} />
      <div className="mt-8 space-y-10">
        {groupByNextStep(boardIpos).map(([caption, { isToday, items }]) => (
          <div key={caption}>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              {isToday ? (
                <span className="rounded-full bg-brand-accent px-2.5 py-0.5 text-xs font-medium text-primary">{caption}</span>
              ) : (
                <>
                  <Clock className="size-4" strokeWidth={2} aria-hidden="true" />
                  {caption}
                </>
              )}
              <span className="font-mono text-xs tabular-nums">({items.length})</span>
            </h3>
            <div className="reveal-cards grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
