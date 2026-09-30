import { CalendarDays } from 'lucide-react';
import { HomePageIpoProps } from '@/types/homepage';
import { IpoTitleLink } from '@/components/ipo/IpoTitleLink';
import { IpoLogo } from '@/components/ipo/IpoLogo';
import { formatShortDateOrToday, parseEstListingPercent, parseGainValue, scoreOf } from '@/lib/ipo-format';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeading } from '@/components/home/SectionHeading';

type Ipo = HomePageIpoProps['ipo'];

interface Listing {
  price: number | null;
  gain: number | null;
}

const formatPrice = (value: number) =>
  value.toLocaleString('en-IN', { maximumFractionDigits: Number.isInteger(value) ? 0 : 2 });

const formatSignedPercent = (gain: number) => `${gain >= 0 ? '+' : ''}${gain.toFixed(1)}%`;

/** Issue price: the GMP feed's upper band, else the performance row's issue price. */
function issuePrice(ipo: Ipo): number | null {
  return parseGainValue(ipo?.gmp_price_band) || parseGainValue(ipo?.ipo_price) || null;
}

/** GMP-implied listing from "584 (37.74%)". The price is "-" when no GMP was quoted, so it is derived from the gain. */
function estimatedListing(ipo: Ipo): Listing {
  const raw = ipo?.gmp_est_listing || ipo?.gmp_price_gain;
  const gain = parseEstListingPercent(raw);
  const leadingNumber = raw?.trim().match(/^-?[\d,]+(?:\.\d+)?/);
  const issue = issuePrice(ipo);

  if (leadingNumber) return { price: parseFloat(leadingNumber[0].replace(/,/g, '')), gain };
  if (gain !== null && issue) return { price: Math.round(issue * (1 + gain / 100)), gain };
  return { price: null, gain };
}

/** Listing-day price and gain; when only one was captured, the other comes from the issue price. */
function actualListing(ipo: Ipo): Listing {
  const price = parseGainValue(ipo?.listing_price);
  const gain = parseGainValue(ipo?.listing_gain);
  const issue = issuePrice(ipo);

  if (gain === null && price !== null && issue) return { price, gain: ((price - issue) / issue) * 100 };
  if (price === null && gain !== null && issue) return { price: Math.round(issue * (1 + gain / 100) * 100) / 100, gain };
  return { price, gain };
}

/** Price with its signed gain below, or a muted fallback when neither is known. */
function ListingFigure({ label, listing, fallback, className }: { label: string; listing: Listing; fallback: string; className?: string }) {
  const hasData = listing.price !== null || listing.gain !== null;

  return (
    <div className={className}>
      <div className="mb-0.5 text-xs text-muted-foreground sm:hidden">{label}</div>
      {!hasData && <div className="font-mono text-sm text-muted-foreground">{fallback}</div>}
      {listing.price !== null && (
        <div className="font-mono text-base font-medium tabular-nums">₹{formatPrice(listing.price)}</div>
      )}
      {listing.gain !== null && (
        <div className={`font-mono text-xs font-medium tabular-nums ${listing.gain >= 0 ? 'text-score-good' : 'text-score-bad'}`}>
          {formatSignedPercent(listing.gain)}
        </div>
      )}
    </div>
  );
}

const ROW_GRID = 'grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-[minmax(0,2fr)_1fr_1fr] sm:items-center';

/** One recently listed IPO: company, then GMP estimate next to the actual listing. */
function ListedRow({ item }: { item: HomePageIpoProps }) {
  const { ipo } = item;
  const hasAnalysis = scoreOf(item) > 0;
  const issue = issuePrice(ipo);

  return (
    <li className={`${ROW_GRID} px-4 py-4 sm:px-5`}>
      <div className="col-span-2 flex min-w-0 items-center gap-3 sm:col-span-1">
        <IpoLogo src={ipo?.image_url} name={ipo?.upcoming_ipo_2025} />
        <div className="min-w-0">
          <h3 className="truncate font-display font-bold tracking-[-0.015em]">
            <IpoTitleLink ipo={ipo} hasAnalysis={hasAnalysis} />
          </h3>
          <div className="text-xs text-muted-foreground">
            Listed <span className="font-mono tabular-nums">{formatShortDateOrToday(ipo?.ipo_dates?.ipo_listing_date)}</span>
            {issue !== null && (
              <>
                {' · '}Issue <span className="font-mono tabular-nums">₹{formatPrice(issue)}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <ListingFigure label="Est. listing (GMP)" listing={estimatedListing(ipo)} fallback="N/A" className="sm:text-right" />
      <ListingFigure label="Actual listing" listing={actualListing(ipo)} fallback="Awaiting" className="text-right" />
    </li>
  );
}

/** Last four listings, with the GMP estimate next to how each one actually listed. */
export function PastIposSection({ ipos }: { ipos: HomePageIpoProps[] }) {
  const visibleIpos = ipos.slice(0, 4);

  return (
    <section className="py-16 sm:py-24">
      <SectionHeading
        title="Recently listed"
        subtitle="What GMP predicted vs what happened"
        href="/ipos?filter=past"
        linkLabel={`View all ${ipos.length} listed IPOs`}
      />

      {visibleIpos.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No recent listings yet" hint="Listed IPOs land here with our call next to how they actually did." />
      ) : (
        <div className="mt-8 rounded-xl border border-border bg-card">
          <div className={`${ROW_GRID} hidden border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground sm:grid`}>
            <span>Company</span>
            <span className="text-right">Est. listing (GMP)</span>
            <span className="text-right">Actual listing</span>
          </div>
          <ul className="divide-y divide-border">
            {visibleIpos.map((item) => (
              <ListedRow key={item._id} item={item} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
