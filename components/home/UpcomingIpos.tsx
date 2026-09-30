'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { HomePageIpoProps, IpoSectionProps } from '@/types/homepage';
import { IpoTitleLink } from '@/components/ipo/IpoTitleLink';
import { IpoLogo } from '@/components/ipo/IpoLogo';
import { formatShortDateOrToday, getRiskTextColor, getIpoType, getPriceBand } from '@/lib/ipo-format';
import { EmptyState } from '@/components/home/EmptyState';
import { useBoard } from '@/components/home/BoardContext';

function UpcomingIpoRow({ item }: { item: HomePageIpoProps }) {
  const { ipo, analysis } = item;
  const riskScore = analysis?.risk_meter?.score || 0;
  const priceBand = getPriceBand(ipo);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 py-4 border-b border-border row-hover">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <IpoLogo src={ipo?.image_url} name={ipo?.upcoming_ipo_2025} />
        <div className="min-w-0 flex-1">
          <div className="font-serif font-semibold text-foreground truncate">
            <IpoTitleLink ipo={ipo} hasAnalysis={riskScore > 0} />
          </div>
          <div className="text-sm text-muted-foreground truncate">Opens {formatShortDateOrToday(ipo?.ipo_dates?.ipo_open_date)}</div>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-6 flex-shrink-0 pl-[26px] sm:pl-0">
        <div className="text-right hidden sm:block">
          <div className="text-xs text-muted-foreground">Price band</div>
          <div className="font-mono text-sm font-medium text-foreground">{priceBand ? `₹${priceBand}` : 'N/A'}</div>
        </div>
        <span
          className={`font-serif font-semibold text-xl flex-shrink-0 ${riskScore > 0 ? getRiskTextColor(riskScore) : 'text-muted-foreground/40'}`}
          title="Analysis score"
        >
          {riskScore > 0 ? riskScore : '–'}
        </span>
      </div>
    </div>
  );
}

export function UpcomingIposSection({ ipos, count }: IpoSectionProps) {
  const { board } = useBoard();
  const visibleIpos = ipos.filter((item) => getIpoType(item.ipo) === board).slice(0, 6);

  return (
    <section className="py-15">
      <div>
        <div className="flex justify-between items-center gap-4 mb-2">
          <h2 className="text-2xl md:text-3xl font-semibold font-serif text-foreground">Upcoming</h2>
          <Link
            href="/ipos?filter=upcoming"
            aria-label={`View all ${count} upcoming IPOs`}
            className="text-primary font-sans hover:text-primary/80 font-medium flex items-center space-x-1.5 group text-sm sm:text-base transition-colors duration-200 flex-shrink-0"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        {visibleIpos.length === 0 ? (
          <EmptyState icon={CalendarDays} title={`No ${board} IPOs announced yet`} hint="New issues show up here as soon as their dates are out." />
        ) : (
          <div className="border-t border-border">
            {visibleIpos.map((item) => (
              <UpcomingIpoRow key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
