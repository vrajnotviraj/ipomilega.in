'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import type { QuotaIpo } from '@/lib/queries/shareholder-quota';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { HomePageIpoProps, IpoSectionProps } from '@/types/ipo-with-analysis';
import { IpoTitleLink } from '@/components/ipo-shared/IpoTitleLink';
import { IpoLogo } from '@/components/ipo-shared/IpoLogo';
import { Score } from '@/components/ui/Score';
import { SectionHeading } from '@/components/home/SectionHeading';
import { useBoard } from '@/components/home/BoardContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatIpoDate, formatShortDateOrToday, getIpoType, getPriceBand } from '@/lib/ipo/format';
import { scoreOf } from '@/lib/ipo/score';

const MAX_ROWS = 6;
type Tab = 'all' | 'quota';

/** What to show on the right of a quota row: the buying deadline when known, else the bidding window or "dates TBA". */
function quotaWhen(ipo: QuotaIpo) {
  if (ipo.lastBuyDate) return { label: 'Buy by', value: formatIpoDate(ipo.lastBuyDate) };
  if (ipo.openDate) return { label: 'Bidding', value: formatIpoDate(ipo.openDate) };
  return { label: 'Dates', value: 'TBA' };
}

/** One shareholder-quota IPO: the parent to hold, the IPO it reserves shares in, and the date that matters. */
function QuotaRow({ ipo }: { ipo: QuotaIpo }) {
  const when = quotaWhen(ipo);
  return (
    <li className="row-hover border-b border-border">
      <Link href="/ipos/shareholder-quota" className="flex items-center gap-3 py-4 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="truncate font-display font-bold tracking-[-0.015em] text-foreground">{ipo.parents.join(' or ')}</div>
          <div className="truncate text-sm text-muted-foreground">Hold 1 share for the quota in {ipo.name}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs text-muted-foreground">{when.label}</div>
          <div className="font-mono text-sm font-medium tabular-nums text-foreground">{when.value}</div>
        </div>
      </Link>
    </li>
  );
}

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
      <div className="w-14 shrink-0 text-right">
        <Score value={score} />
      </div>
    </li>
  );
}

/** The next few IPOs opening on the chosen board. */
export function UpcomingIposSection({ ipos, quota }: IpoSectionProps & { quota: QuotaIpo[] }) {
  const { board } = useBoard();
  const [tab, setTab] = useState<Tab>('all');
  const visibleIpos = ipos.filter((item) => getIpoType(item.ipo) === board).slice(0, MAX_ROWS);

  return (
    <section className="py-8 sm:py-12">
      <SectionHeading
        title="Upcoming"
        href={tab === 'quota' ? '/ipos/shareholder-quota' : '/ipos?filter=upcoming'}
        linkLabel={tab === 'quota' ? `View all ${quota.length} IPOs with a shareholder quota` : `View all ${ipos.length} upcoming IPOs`}
      />
      {quota.length > 0 && (
        <SegmentedControl
          label="Upcoming IPOs"
          options={[{ value: 'all', label: 'All' }, { value: 'quota', label: 'Shareholder quota', count: quota.length }]}
          value={tab}
          onChange={setTab}
          className="mt-6 inline-flex"
        />
      )}
      {tab === 'quota' && quota.length > 0 ? (
        <ul className="mt-8 border-t border-border">
          {quota.slice(0, MAX_ROWS).map((ipo) => (
            <QuotaRow key={ipo.id} ipo={ipo} />
          ))}
        </ul>
      ) : visibleIpos.length === 0 ? (
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
