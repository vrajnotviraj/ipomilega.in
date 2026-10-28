'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { IpoSectionProps, HomePageIpoProps } from '@/types/ipo-with-analysis';
import { LiveIpoCard } from '@/components/home/ipo-card/LiveIpoCard';
import { SectionHeading } from '@/components/home/SectionHeading';
import { useBoard } from '@/components/home/BoardContext';
import { NothingOpen } from '@/components/home/NothingOpen';
import { LiveLabel } from '@/components/ui/LiveLabel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { BOARDS, boardLabel, getDaysUntilClosing, getIpoType, gmpOf } from '@/lib/ipo/format';
import { useT } from '@/lib/i18n/client';
import { fill } from '@/lib/i18n/locales';
import type { Dictionary } from '@/messages';
import { cn } from '@/lib/utils';
import { whenOf } from '@/components/ipo-shared/lifecycle';
import { whenText } from '@/components/ipo-shared/LifecycleTrack';

const closingGroupLabel = (days: number, d: Dictionary) =>
  days === Infinity ? d.home.live.closeDateTba : days === 0 ? d.ipo.lifecycle.close.today : fill(d.ipo.lifecycle.close.next, { when: whenText(whenOf(days), d) });

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
export function LiveIposSection({ ipos, upcoming, closed }: IpoSectionProps & { upcoming: HomePageIpoProps[]; closed: HomePageIpoProps[] }) {
  const dict = useT();
  const { common: c } = dict;
  const d = dict.home.live;
  const { board, setBoard } = useBoard();
  // Fades the list in when the board changes, not on first render.
  const [shownBoard, setShownBoard] = useState(board);
  const [switched, setSwitched] = useState(false);
  if (board !== shownBoard) {
    setShownBoard(board);
    setSwitched(true);
  }

  const onBoard = (list: HomePageIpoProps[]) => list.filter((item) => getIpoType(item.ipo) === board);
  const boardIpos = onBoard(ipos);

  return (
    <section id="live" className="scroll-mt-24 pb-8 pt-8 sm:pb-12 sm:pt-12">
      <SectionHeading
        title={d.title}
        badge={<LiveLabel />}
        href="/ipos?filter=live"
        linkLabel={fill(d.viewAllLabel, { count: ipos.length })}
        linkText={c.viewAll}
      />
      <SegmentedControl
        label={d.board}
        options={BOARDS.map((b) => ({ value: b, label: boardLabel(c.board, b) }))}
        value={board}
        onChange={setBoard}
        className="mt-6 inline-flex"
        data-tour="board-tabs"
      />

      <div key={board} className={cn('mt-8', switched && 'animate-in fade-in duration-150')}>
        {boardIpos.length === 0 ? (
          <NothingOpen board={boardLabel(c.board, board)} upcoming={onBoard(upcoming)} closed={onBoard(closed)} />
        ) : (
          <div className="space-y-10">
            {groupByClosingDay(boardIpos).map(([days, items]) => (
              <div key={days}>
                <h3 className={cn('mb-4 flex items-center gap-2 text-sm font-medium', days === 0 ? 'text-score-bad' : 'text-muted-foreground')}>
                  <Clock className="size-4" strokeWidth={2} />
                  {closingGroupLabel(days, dict)}
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
