'use client';

import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';
import { IpoSectionProps, HomePageIpoProps } from '@/types/homepage';
import { ClosedIpoCard } from '@/components/home/IpoCard';
import { daysFromToday, getIpoType, gmpOf } from '@/lib/ipo-format';
import { useBoard } from '@/components/home/BoardContext';

// Stages by allotment day. Every past allotment day collapses into the one OUT stage.
const OUT = -1;
const TBA = Infinity;
const stageLabel = (days: number) =>
  days === OUT ? 'Allotment out, listing soon'
    : days === TBA ? 'Allotment date TBA'
      : days === 0 ? 'Allotment today'
        : days === 1 ? 'Allotment tomorrow'
          : `Allotment in ${days} days`;

export function ClosedIposSection({ ipos, count }: IpoSectionProps) {
  const { board } = useBoard();
  const boardIpos = ipos.filter((item) => getIpoType(item.ipo) === board);
  if (boardIpos.length === 0) return null;

  const stages = new Map<number, HomePageIpoProps[]>();
  for (const item of boardIpos.sort((a, b) => gmpOf(b) - gmpOf(a))) {
    const days = daysFromToday(item.ipo?.ipo_dates?.basis_of_allotment);
    const stage = days === null ? TBA : Math.max(days, OUT);
    stages.set(stage, [...(stages.get(stage) || []), item]);
  }
  // Allotment today is what people come for, so it leads; the rest stay in date order.
  const rank = (stage: number) => (stage === 0 ? -Infinity : stage);
  const sortedStages = [...stages].sort(([a], [b]) => rank(a) - rank(b));

  return (
    <section className="py-15">
      <div className="flex justify-between items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold font-serif text-foreground flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="truncate">Bidding closed</span>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono font-medium uppercase tracking-wide text-chart-5 flex-shrink-0">
            <Lock className="w-3 h-3" />
            Closed
          </span>
        </h2>
        <Link
          href="/ipos?filter=closed"
          aria-label={`View all ${count} closed IPOs`}
          className="text-primary font-sans hover:text-primary/80 font-medium flex items-center space-x-1.5 group text-sm sm:text-base transition-colors duration-200 flex-shrink-0"
        >
          <span>View all</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      <div className="space-y-8">
        {sortedStages.map(([stage, items]) => (
          <div key={stage}>
            <h3 className={`flex items-center gap-2 text-sm font-medium font-sans mb-3 ${stage === 0 ? 'text-primary' : 'text-muted-foreground'}`}>
              {stage === 0 && <span className="live-dot bg-primary" />}
              {stageLabel(stage)}
              <span className="font-mono text-xs text-muted-foreground">({items.length})</span>
            </h3>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
