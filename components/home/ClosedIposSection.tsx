'use client';

import { IpoSectionProps, HomePageIpoProps } from '@/types/ipo-with-analysis';
import { ClosedIpoCard } from '@/components/home/ipo-card/ClosedIpoCard';
import { SectionHeading } from '@/components/home/SectionHeading';
import { useBoard } from '@/components/home/BoardContext';
import { Clock } from 'lucide-react';
import { getIpoType, gmpOf } from '@/lib/ipo-format';
import { afterCloseSteps, lifecycleCaption, type Step } from '@/components/ipo-shared/lifecycle';

/** Days to the step an IPO is on (the one due today, else the next dated one), with earlier steps first on the same day. */
function rankOf(steps: Step[]) {
  const index = steps.findIndex((step) => step.state === 'today' || (step.state === 'future' && step.days !== null));
  return index === -1 ? Infinity : (steps[index].days ?? 0) * 10 + index;
}

/** Groups IPOs by what happens next ("Lists in 2 days"), soonest first, highest GMP first within a group. */
function groupByNextStep(ipos: HomePageIpoProps[]) {
  const groups = new Map<string, { rank: number; isToday: boolean; items: HomePageIpoProps[] }>();
  for (const item of [...ipos].sort((a, b) => gmpOf(b) - gmpOf(a))) {
    const steps = afterCloseSteps(item.ipo);
    const caption = lifecycleCaption(steps);
    const group = groups.get(caption) ?? { rank: rankOf(steps), isToday: steps.some((step) => step.state === 'today'), items: [] };
    group.items.push(item);
    groups.set(caption, group);
  }
  return [...groups].sort(([, a], [, b]) => a.rank - b.rank);
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
            <div className="reveal-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
