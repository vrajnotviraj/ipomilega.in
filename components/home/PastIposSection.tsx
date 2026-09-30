'use client';

import { ArrowUp, ArrowDown, CalendarDays } from 'lucide-react';
import { HomePageIpoProps } from '@/types/homepage';
import { IpoTitleLink } from '@/components/ipo/IpoTitleLink';
import { IpoLogo } from '@/components/ipo/IpoLogo';
import { formatShortDateOrToday, parseEstListingPercent, parseGainValue } from '@/lib/ipo-format';
import { EmptyState } from '@/components/home/EmptyState';

function PriceFigure({ price, gain, align = 'left' }: { price: number | null; gain: number | null; align?: 'left' | 'right' }) {
  if (price === null && gain === null) {
    return <div className="font-mono text-sm font-semibold text-muted-foreground/40">N/A</div>;
  }
  const isPositive = gain !== null && gain >= 0;
  return (
    <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'}`}>
      {price !== null && <div className="font-mono text-base font-semibold text-foreground">₹{formatPrice(price)}</div>}
      {gain !== null && (
        <div className={`font-mono text-xs font-semibold flex items-center gap-0.5 ${isPositive ? 'text-score-good' : 'text-score-bad'}`}>
          {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {Math.abs(gain).toFixed(1)}%
        </div>
      )}
    </div>
  );
}

const formatPrice = (value: number) =>
  value.toLocaleString('en-IN', { maximumFractionDigits: Number.isInteger(value) ? 0 : 2 });

// Issue price: the GMP feed's upper band, else the scraped performance row's issue price.
function issuePrice(ipo: HomePageIpoProps['ipo']): number | null {
  return parseGainValue(ipo?.gmp_price_band) || parseGainValue(ipo?.ipo_price) || null;
}

// GMP-implied listing price and gain, from "584 (37.74%)". The leading number is "-" when no
// GMP was ever quoted, so the price is then derived from the gain.
function estimatedListing(ipo: HomePageIpoProps['ipo']) {
  const raw = ipo?.gmp_est_listing || ipo?.gmp_price_gain;
  const gain = parseEstListingPercent(raw);
  const leading = raw?.trim().match(/^-?[\d,]+(?:\.\d+)?/);
  let price = leading ? parseFloat(leading[0].replace(/,/g, '')) : null;
  const issue = issuePrice(ipo);
  if (price === null && gain !== null && issue) price = Math.round(issue * (1 + gain / 100));
  return { price, gain };
}

// Actual listing-day price and gain; when only one was scraped, the other comes from the issue price.
function actualListing(ipo: HomePageIpoProps['ipo']) {
  const price = parseGainValue(ipo?.listing_price);
  let gain = parseGainValue(ipo?.listing_gain);
  const issue = issuePrice(ipo);
  if (gain === null && price !== null && issue) gain = ((price - issue) / issue) * 100;
  const derivedPrice = price === null && gain !== null && issue ? Math.round(issue * (1 + gain / 100) * 100) / 100 : null;
  return { price: price ?? derivedPrice, gain };
}

function RecentlyListedCard({ item }: { item: HomePageIpoProps }) {
  const { ipo, analysis } = item;

  const riskScore = analysis?.risk_meter?.score || 0;
  const issue = issuePrice(ipo);
  const estimated = estimatedListing(ipo);
  const actual = actualListing(ipo);

  return (
    <div className="card-lift text-left rounded-xl border border-border bg-card p-5 w-full">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <IpoLogo src={ipo?.image_url} name={ipo?.upcoming_ipo_2025} />
          <div className="min-w-0">
            <h3 className="font-serif font-semibold text-foreground truncate">
              <IpoTitleLink ipo={ipo} hasAnalysis={riskScore > 0} />
            </h3>
            {issue !== null && <div className="text-xs text-muted-foreground font-mono">Issue ₹{formatPrice(issue)}</div>}
          </div>
        </div>
        <div className={`text-xs flex-shrink-0 ${riskScore > 0 ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
          listed {formatShortDateOrToday(ipo?.ipo_dates?.ipo_listing_date)}
        </div>
      </div>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Est. listing (GMP)</div>
          <PriceFigure price={estimated.price} gain={estimated.gain} />
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="text-xs text-muted-foreground mb-1">Actual listing</div>
          {actual.price === null && actual.gain === null ? (
            <div className="font-mono text-sm font-semibold text-muted-foreground/50" title="Listing-day price has not been captured for this IPO yet">
              Awaiting
            </div>
          ) : (
            <PriceFigure price={actual.price} gain={actual.gain} align="right" />
          )}
        </div>
      </div>
    </div>
  );
}

export function PastIposSection({ ipos }: { ipos: HomePageIpoProps[] }) {
  const visibleIpos = ipos.slice(0, 4);

  return (
    <section className="py-15">
      <div>
        <div className="flex justify-between items-center gap-4 mb-2">
          <h2 className="text-2xl md:text-3xl font-semibold font-serif text-foreground">Recently listed</h2>
          <span className="text-muted-foreground italic text-sm font-sans flex-shrink-0 hidden sm:inline">what we predicted vs. what happened</span>
        </div>
        {visibleIpos.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No recent listings yet" hint="Listed IPOs land here with our call next to how they actually did." />
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
