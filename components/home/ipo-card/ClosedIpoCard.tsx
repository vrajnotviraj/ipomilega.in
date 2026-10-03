import { ArrowUpRight, Clock } from 'lucide-react';
import { Ipo } from '@/types/ipo';
import {
  daysFromToday,
  estimatedListing,
  formatRupees,
  formatShortDate,
  formatTimes,
  gainColor,
  getAllotmentCheckUrl,
  gmpGainPerApplication,
  parseGainValue,
  signedPercent,
} from '@/lib/ipo-format';
import { cn } from '@/lib/utils';
import { LifecycleTrack } from '@/components/ipos/LifecycleTrack';
import { afterCloseSteps } from '@/components/ipos/rows';
import { CardHeader, IpoCardProps } from './CardParts';

/**
 * Card for an IPO whose bidding has closed but has not listed. It answers what an applicant comes back for:
 * how heavily it was bid, the expected listing, what happens next and when, and the allotment check.
 */
export function ClosedIpoCard({ ipo, analysis }: IpoCardProps) {
  const allotmentDays = daysFromToday(ipo?.ipo_dates?.basis_of_allotment);
  const allotmentToday = allotmentDays === 0;

  return (
    <article
      className={cn(
        'card-lift flex flex-col gap-4 rounded-xl border p-4 sm:p-5',
        allotmentToday ? 'border-primary bg-tint-closed' : 'border-tint-closed-border bg-tint-closed'
      )}
    >
      <CardHeader ipo={ipo} analysis={analysis} aside={<Subscribed times={parseGainValue(ipo?.total_sr)} />} />
      <ExpectedListing ipo={ipo} />
      <LifecycleTrack steps={afterCloseSteps(ipo)} showCaption={false} className="rounded-lg bg-card px-3 py-2.5" />

      <AllotmentAction ipo={ipo} allotmentDays={allotmentDays} />
    </article>
  );
}

/** Total subscription as a mono figure for the card's top right. */
function Subscribed({ times }: { times: number | null }) {
  return (
    <div className="shrink-0 text-right">
      <div className="font-mono text-lg font-medium leading-tight tabular-nums">{formatTimes(times)}</div>
      <div className="text-xs text-muted-foreground">subscribed</div>
    </div>
  );
}

/** The GMP-implied listing price and gain, with what that comes to on the minimum retail application. */
function ExpectedListing({ ipo }: { ipo: Ipo | null }) {
  const { price, gain } = estimatedListing(ipo);
  const perApplication = gmpGainPerApplication(ipo);

  if (price === null && gain === null) {
    return <p className="text-sm text-muted-foreground">No grey market quote for this issue yet.</p>;
  }

  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">Expected listing (GMP)</div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
          {price !== null && <span className="font-mono text-2xl font-medium tabular-nums">{formatRupees(price)}</span>}
          {gain !== null && <span className={cn('font-mono text-sm font-medium tabular-nums', gainColor(gain))}>{signedPercent(gain)}</span>}
        </div>
      </div>
      {perApplication !== null && (
        <div className="shrink-0 text-right" title="GMP gain on the minimum retail application">
          <div className="text-xs text-muted-foreground">
            Per application<span className="sr-only">, GMP gain on the minimum retail application</span>
          </div>
          <div className={cn('mt-1 font-mono text-sm font-medium tabular-nums', gainColor(perApplication))}>
            {perApplication > 0 ? '+' : perApplication < 0 ? '−' : ''}
            {formatRupees(Math.abs(perApplication))}
          </div>
        </div>
      )}
    </div>
  );
}

/** "Check allotment" pill once the basis of allotment is out (solid on the day), else the allotment date. */
function AllotmentAction({ ipo, allotmentDays }: { ipo: Ipo | null; allotmentDays: number | null }) {
  const checkUrl = getAllotmentCheckUrl(ipo);

  if (!checkUrl) {
    return (
      <div className="inline-flex items-center justify-center gap-1.5 rounded-full border border-dashed border-border bg-card py-2 text-xs text-muted-foreground">
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
          : 'border border-border bg-card text-foreground hover:bg-secondary'
      )}
    >
      Check allotment
      <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={2} />
    </a>
  );
}
