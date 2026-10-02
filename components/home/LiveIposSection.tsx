'use client';

import { useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { IpoSectionProps, HomePageIpoProps } from '@/types/ipo-with-analysis';
import { LiveIpoCard } from '@/components/home/ipo-card/LiveIpoCard';
import { SectionHeading } from '@/components/home/SectionHeading';
import { useBoard } from '@/components/home/BoardContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { LiveLabel } from '@/components/ui/LiveLabel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { BOARDS, getDaysUntilClosing, getIpoType, gmpOf } from '@/lib/ipo-format';
import { cn } from '@/lib/utils';

const closingGroupLabel = (days: number) => {
  if (days === Infinity) return 'Close date TBA';
  if (days === 0) return 'Closes today';
  if (days === 1) return 'Closes tomorrow';
  return `Closes in ${days} days`;
};

/** Groups IPOs by days left to bid, soonest first and unknown close dates last; highest GMP first within a group. */
function groupByClosingDay(ipos: HomePageIpoProps[]) {
  const groups = new Map<number, HomePageIpoProps[]>();
  for (const item of [...ipos].sort((a, b) => gmpOf(b) - gmpOf(a))) {
    const days = getDaysUntilClosing(item.ipo) ?? Infinity;
    groups.set(days, [...(groups.get(days) || []), item]);
  }
  return [...groups].sort(([a], [b]) => a - b);
}

/** Live IPO cards for the chosen board, with the Mainboard/SME switch that filters every home section. */
export function LiveIposSection({ ipos }: IpoSectionProps) {
  const { board, setBoard } = useBoard();
  // Fade only on tab switches, not the first paint: these cards sit right under the LCP.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);

  const boardIpos = ipos.filter((item) => getIpoType(item.ipo) === board);

  return (
    <section id="live" className="scroll-mt-24 pb-8 pt-8 sm:pb-12 sm:pt-12">
      <SectionHeading
        title="IPOs open now"
        badge={<LiveLabel />}
        href="/ipos?filter=live"
        linkLabel={`View all ${ipos.length} live IPOs`}
      />
      <SegmentedControl
        label="Board"
        options={BOARDS.map((b) => ({ value: b, label: b }))}
        value={board}
        onChange={setBoard}
        className="mt-6 inline-flex"
        data-tour="board-tabs"
      />

      <div key={board} className={cn('mt-8', mounted.current && 'animate-in fade-in duration-150')}>
        {boardIpos.length === 0 ? (
          <EmptyState icon={Clock} title={`No ${board} IPOs open for bidding`} hint="Check Upcoming below for what opens next." />
        ) : (
          <div className="space-y-10">
            {groupByClosingDay(boardIpos).map(([days, items]) => (
              <div key={days}>
                <h3 className={cn('mb-4 flex items-center gap-2 text-sm font-medium', days === 0 ? 'text-score-bad' : 'text-muted-foreground')}>
                  <Clock className="size-4" strokeWidth={2} />
                  {closingGroupLabel(days)}
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">({items.length})</span>
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                  {items.map((item) => (
                    <LiveIpoCard key={item._id} ipo={item.ipo} analysis={item.analysis} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
