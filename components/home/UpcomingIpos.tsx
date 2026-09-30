'use client';

import { CalendarDays } from 'lucide-react';
import { HomePageIpoProps, IpoSectionProps } from '@/types/homepage';
import { IpoTitleLink } from '@/components/ipo/IpoTitleLink';
import { IpoLogo } from '@/components/ipo/IpoLogo';
import { Score } from '@/components/ui/Score';
import { SectionHeading } from '@/components/home/SectionHeading';
import { useBoard } from '@/components/home/BoardContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatShortDateOrToday, getIpoType, getPriceBand, scoreOf } from '@/lib/ipo-format';

const MAX_ROWS = 6;

/** One upcoming IPO: logo, name, open date, price band and score. */
function UpcomingIpoRow({ item }: { item: HomePageIpoProps }) {
  const { ipo } = item;
  const score = scoreOf(item);
  const priceBand = getPriceBand(ipo);
  const priceText = priceBand ? `₹${priceBand}` : 'N/A';

  return (
    <li className="row-hover flex items-center gap-3 border-b border-border py-4 sm:gap-4">
      <IpoLogo src={ipo?.image_url} name={ipo?.upcoming_ipo_2025} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-display font-bold tracking-[-0.015em] text-foreground">
          <IpoTitleLink ipo={ipo} hasAnalysis={score > 0} />
        </div>
        <div className="truncate text-sm text-muted-foreground">
          Opens <span className="font-mono tabular-nums">{formatShortDateOrToday(ipo?.ipo_dates?.ipo_open_date)}</span>
          {priceBand && <span className="font-mono tabular-nums sm:hidden">, {priceText}</span>}
        </div>
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <div className="text-xs text-muted-foreground">Price band</div>
        <div className="font-mono text-sm font-medium tabular-nums text-foreground">{priceText}</div>
      </div>
      <Score value={score} />
    </li>
  );
}

/** The next few IPOs opening on the chosen board. */
export function UpcomingIposSection({ ipos }: IpoSectionProps) {
  const { board } = useBoard();
  const visibleIpos = ipos.filter((item) => getIpoType(item.ipo) === board).slice(0, MAX_ROWS);

  return (
    <section className="py-16 sm:py-24">
      <SectionHeading title="Upcoming" href="/ipos?filter=upcoming" linkLabel={`View all ${ipos.length} upcoming IPOs`} />
      {visibleIpos.length === 0 ? (
        <EmptyState icon={CalendarDays} title={`No ${board} IPOs announced yet`} hint="New issues show up here as soon as their dates are out." />
      ) : (
        <ul className="mt-8 border-t border-border">
          {visibleIpos.map((item) => (
            <UpcomingIpoRow key={item._id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}
