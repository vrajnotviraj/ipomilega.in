import { ArrowUpRight, Clock } from 'lucide-react';
import { Ipo } from '@/types/ipo';
import {
  daysFromToday,
  formatShortDate,
  formatShortDateOrToday,
  gainColor,
  getAllotmentCheckUrl,
  parseEstListingPercent,
  parseGainValue,
} from '@/lib/ipo-format';
import { cn } from '@/lib/utils';
import { CardHeader, IpoCardProps, Stat, formatGmp, formatTimes } from './CardParts';

/** Card for an IPO whose bidding has closed but has not listed: final GMP, subscription, listing date and the allotment check. */
export function ClosedIpoCard({ ipo, analysis }: IpoCardProps) {
  const gmpPercent = parseEstListingPercent(ipo?.gmp_price_gain);
  const allotmentDays = daysFromToday(ipo?.ipo_dates?.basis_of_allotment);
  const allotmentToday = allotmentDays === 0;

  return (
    <article
      className={cn(
        'card-lift flex flex-col gap-4 rounded-xl border p-4 sm:p-5',
        allotmentToday ? 'border-transparent bg-secondary' : 'border-border bg-card'
      )}
    >
      <CardHeader ipo={ipo} analysis={analysis} />

      <div className="grid grid-cols-3 gap-2">
        <Stat label="GMP" value={formatGmp(gmpPercent)} valueClass={gainColor(gmpPercent)} />
        <Stat label="Subscribed" value={formatTimes(parseGainValue(ipo?.total_sr))} />
        <Stat label="Lists" value={formatShortDateOrToday(ipo?.ipo_dates?.ipo_listing_date)} className="text-right" />
      </div>

      <AllotmentAction ipo={ipo} allotmentDays={allotmentDays} />
    </article>
  );
}

/** "Check allotment" pill once the basis of allotment is out (solid on the day), else the allotment date. */
function AllotmentAction({ ipo, allotmentDays }: { ipo: Ipo | null; allotmentDays: number | null }) {
  const checkUrl = getAllotmentCheckUrl(ipo);

  if (!checkUrl) {
    return (
      <div className="inline-flex items-center justify-center gap-1.5 rounded-full border border-dashed border-border py-2 text-xs text-muted-foreground">
        <Clock className="size-3.5" strokeWidth={2} />
        {allotmentDays === null ? (
          'Allotment date TBA'
        ) : (
          <span>
            Allotment <span className="font-mono tabular-nums">{formatShortDate(ipo?.ipo_dates?.basis_of_allotment)}</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <a
      href={checkUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-tour="check-allotment"
      className={cn(
        'group inline-flex items-center justify-center gap-1 rounded-full py-2 text-sm font-medium transition active:scale-[0.98]',
        allotmentDays === 0
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'border border-border text-foreground hover:bg-secondary'
      )}
    >
      Check allotment
      <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={2} />
    </a>
  );
}
