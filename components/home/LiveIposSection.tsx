'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { IpoSectionProps, HomePageIpoProps } from '@/types/homepage';
import { LiveIpoCard } from '@/components/home/IpoCard';
import { getDaysUntilClosing, getIpoType, gmpOf } from '@/lib/ipo-format';
import { BOARD_TABS, useBoard } from '@/components/home/BoardContext';
import { EmptyState } from '@/components/home/EmptyState';

const closingGroupLabel = (days: number) =>
  days < 0 ? 'Close date TBA' : days === 0 ? 'Closes today' : days === 1 ? 'Closes tomorrow' : `Closes in ${days} days`;

export function LiveIposSection({ ipos, count }: IpoSectionProps) {
  const { board, setBoard } = useBoard();
  // Fade only on tab switches, not the first paint (these cards sit right under the LCP).
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);

  const boardIpos = ipos.filter((item) => getIpoType(item.ipo) === board);

  // Group by days left to bid, soonest first, unknown close dates last; highest GMP first within.
  const groups = new Map<number, HomePageIpoProps[]>();
  for (const item of boardIpos.sort((a, b) => gmpOf(b) - gmpOf(a))) {
    const days = getDaysUntilClosing(item.ipo);
    groups.set(days, [...(groups.get(days) || []), item]);
  }
  const closeRank = (days: number) => (days < 0 ? Infinity : days);
  const sortedGroups = [...groups].sort(([a], [b]) => closeRank(a) - closeRank(b));

  return (
    <section className='py-6 sm:py-15'>
      <div className="mb-4 sm:mb-8">
        <div className="flex justify-between items-center gap-4">
          <h2 className="text-2xl md:text-3xl font-semibold font-serif text-foreground flex items-center gap-3">
            <span>IPOs open now</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium uppercase tracking-wide text-destructive">
              <span className="live-dot bg-destructive" />
              Live
            </span>
          </h2>
          <Link
            href="/ipos?filter=live"
            aria-label={`View all ${count} live IPOs`}
            className="text-primary font-sans hover:text-primary/80 font-medium flex items-center space-x-1.5 group text-sm sm:text-base transition-colors duration-200 flex-shrink-0"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div data-tour="board-tabs" className="flex items-center gap-6 mt-4 border-b border-border">
          {BOARD_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setBoard(tab)}
              aria-pressed={board === tab}
              className="underline-grow pb-2.5 text-sm font-medium font-sans text-muted-foreground hover:text-foreground aria-pressed:text-foreground transition-colors"
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      {/* Keyed so a tab switch remounts and replays the fade-in. */}
      <div key={board} className={mounted.current ? 'animate-in fade-in duration-150' : undefined}>
          {boardIpos.length === 0 ? (
            <EmptyState icon={Clock} title={`No ${board} IPOs open for bidding`} hint="Check Upcoming below for what opens next." />
          ) : (
            <div className="space-y-8">
              {sortedGroups.map(([days, items]) => (
                <div key={days}>
                  <h3 className={`flex items-center gap-2 text-sm font-medium font-sans mb-3 ${days === 0 ? 'text-score-bad' : 'text-muted-foreground'}`}>
                    <Clock className="w-4 h-4" />
                    {closingGroupLabel(days)}
                    <span className="font-mono text-xs text-muted-foreground">({items.length})</span>
                  </h3>
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
