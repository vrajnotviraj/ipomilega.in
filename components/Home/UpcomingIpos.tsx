// UpcomingIpos.tsx
'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, CalendarDays } from 'lucide-react';
import { HomePageIpoProps, IpoSectionProps } from '@/app/types/homepage';
import { Badge } from '../ui/badge';
import { useProgressRouter } from '../Progressbar/useProgressRouter';
import { formatShortDateOrToday, getRiskTextColor, getIpoType, getPriceBand } from './ipoFormat';

function UpcomingIpoRow({ item }: { item: HomePageIpoProps }) {
  const router = useProgressRouter();
  const { ipo, analysis } = item;
  const riskScore = analysis?.risk_meter?.score || 0;
  const riskTextColor = getRiskTextColor(riskScore);
  const ipoType = getIpoType(ipo);
  const priceBand = getPriceBand(ipo);

  const handleViewAnalysis = () => {
    if (riskScore > 0 && ipo?.slug) {
      router.push(`/analysis/${ipo.slug}`);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 py-4 border-b border-border">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <Badge variant="outline" className="rounded-md border-border bg-transparent text-foreground text-[11px] font-mono font-medium uppercase tracking-wide px-2 py-1 sm:w-[92px] sm:justify-center flex-shrink-0">
          {ipoType}
        </Badge>
        <div className="min-w-0 flex-1">
          <div className="font-serif font-semibold text-foreground truncate">{ipo?.upcoming_ipo_2025 || 'Company Name'}</div>
          <div className="text-sm text-muted-foreground truncate">Opens {formatShortDateOrToday(ipo?.ipo_dates?.ipo_open_date)}</div>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-6 flex-shrink-0 pl-[26px] sm:pl-0">
        <div className="text-right hidden sm:block">
          <div className="text-xs text-muted-foreground">Price band</div>
          <div className="font-mono text-sm font-medium text-foreground">{priceBand ? `₹${priceBand}` : 'N/A'}</div>
        </div>
        <button
          onClick={handleViewAnalysis}
          disabled={riskScore === 0}
          className={`flex items-center gap-1 flex-shrink-0 ${riskScore === 0 ? 'cursor-default' : 'cursor-pointer'}`}
          aria-label="View analysis"
        >
          {riskScore > 0 ? (
            <span className={`font-serif font-semibold text-xl ${riskTextColor}`}>{riskScore}</span>
          ) : (
            <span className="font-serif font-semibold text-xl text-muted-foreground/40">–</span>
          )}
          <ArrowUpRight className={`w-4 h-4 ${riskScore === 0 ? 'text-muted-foreground/30' : 'text-muted-foreground'}`} />
        </button>
      </div>
    </div>
  );
}

export function UpcomingIposSection({ ipos, count }: IpoSectionProps) {
  const visibleIpos = ipos.slice(0, 6);

  return (
    <section className="py-15">
      <div className="max-w-7xl mx-auto">
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
        {ipos.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center py-6 bg-card rounded-xl shadow-sm border border-border max-w-sm w-full mx-4">
              <CalendarDays className="w-10 h-10 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground text-base font-medium font-sans">No upcoming IPOs at the moment</p>
              <p className="text-muted-foreground/70 text-sm mt-2 font-sans">Check back soon for new opportunities!</p>
            </div>
          </div>
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
