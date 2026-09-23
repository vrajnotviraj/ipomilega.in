// PastIposSection.tsx
'use client';

import { ArrowUp, ArrowDown, CalendarDays } from 'lucide-react';
import { HomePageIpoProps, IpoSectionProps } from '@/app/types/homepage';
import { IpoTitleLink } from './IpoTitleLink';
import { formatShortDateOrToday, parseEstListingPercent, parseGainValue } from './ipoFormat';

function GainFigure({ value }: { value: number | null }) {
  if (value === null) {
    return <div className="font-mono text-sm font-semibold text-muted-foreground/40">N/A</div>;
  }
  const isPositive = value >= 0;
  return (
    <div className={`font-mono text-sm font-semibold flex items-center gap-1 ${isPositive ? 'text-score-good' : 'text-score-bad'}`}>
      {isPositive ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
      {Math.abs(value).toFixed(1)}%
    </div>
  );
}

/**
 * Listing-day gain in percent. The performance scrape stores it as "10.17%"; when only the
 * listing price made it in, derive it from the issue price (the GMP feed's upper band).
 */
function actualListingGain(ipo: HomePageIpoProps['ipo']): number | null {
  const stored = parseGainValue(ipo?.listing_gain);
  if (stored !== null) return stored;
  const listed = parseGainValue(ipo?.listing_price);
  const issue = parseGainValue(ipo?.gmp_price_band);
  if (listed === null || !issue) return null;
  return ((listed - issue) / issue) * 100;
}

function RecentlyListedCard({ item }: { item: HomePageIpoProps }) {
  const { ipo, analysis } = item;

  const riskScore = analysis?.risk_meter?.score || 0;
  // gmp_price_gain is the GMP-implied listing price with its gain, "584 (37.74%)". Compare
  // like with like: the card's other column is a percentage.
  const predictedGain = parseEstListingPercent(ipo?.gmp_est_listing || ipo?.gmp_price_gain);
  const actualGain = actualListingGain(ipo);

  return (
    <div className="text-left rounded-lg border border-border bg-card p-5 w-full">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="font-serif font-semibold text-foreground truncate">
          <IpoTitleLink ipo={ipo} hasAnalysis={riskScore > 0} />
        </h3>
        <div className={`text-xs flex-shrink-0 ${riskScore > 0 ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
          listed {formatShortDateOrToday(ipo?.ipo_dates?.ipo_listing_date)}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Predicted (GMP)</div>
          <GainFigure value={predictedGain} />
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="text-xs text-muted-foreground mb-1">Actual listing</div>
          <GainFigure value={actualGain} />
        </div>
      </div>
    </div>
  );
}

export function PastIposSection({ ipos }: IpoSectionProps) {
  const visibleIpos = (ipos || []).slice(0, 4);

  return (
    <section className="py-15">
      <div>
        <div className="flex justify-between items-center gap-4 mb-2">
          <h2 className="text-2xl md:text-3xl font-semibold font-serif text-foreground">Recently listed</h2>
          <span className="text-muted-foreground italic text-sm font-sans flex-shrink-0 hidden sm:inline">predicted vs. actual — our credibility record</span>
        </div>
        {visibleIpos.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center py-6 bg-card rounded-xl shadow-sm border border-border max-w-sm w-full mx-4">
              <CalendarDays className="w-10 h-10 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground text-base font-medium font-sans">No past IPOs at the moment</p>
              <p className="text-muted-foreground/70 text-sm mt-2 font-sans">Check back soon for new opportunities!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            {visibleIpos.map((item) => (
              <RecentlyListedCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
