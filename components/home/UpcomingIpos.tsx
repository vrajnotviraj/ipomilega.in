'use client';

import { useState } from 'react';
import { ProgressLink } from '@/components/progress/ProgressLink';
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
import { boardLabel, formatIpoDate, formatShortDateOrToday, getIpoType, getPriceBand } from '@/lib/ipo/format';
import { scoreOf } from '@/lib/ipo/score';
import { useT } from '@/lib/i18n/client';
import { fill } from '@/lib/i18n/locales';
import type { Dictionary } from '@/messages';

const MAX_ROWS = 6;
type Tab = 'all' | 'quota';

/** What to show on the right of a quota row: the buying deadline when known, else the bidding window or "dates TBA". */
function quotaWhen(ipo: QuotaIpo, d: Dictionary) {
  if (ipo.lastBuyDate) return { label: d.home.upcoming.buyBy, value: formatIpoDate(ipo.lastBuyDate) };
  if (ipo.openDate) return { label: d.home.upcoming.bidding, value: formatIpoDate(ipo.openDate) };
  return { label: d.home.upcoming.dates, value: d.common.tba };
}

/** One shareholder-quota IPO: the parent to hold, the IPO it reserves shares in, and the date that matters. */
function QuotaRow({ ipo }: { ipo: QuotaIpo }) {
  const d = useT();
  const when = quotaWhen(ipo, d);
  return (
    <li className="row-hover border-b border-border">
      <ProgressLink href="/ipos/shareholder-quota" className="flex items-center gap-3 py-4 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="truncate font-display font-bold tracking-[-0.015em] text-foreground">{ipo.parents.join(` ${d.common.or} `)}</div>
          <div className="truncate text-sm text-muted-foreground">{fill(d.home.upcoming.holdOneShare, { name: ipo.name })}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs text-muted-foreground">{when.label}</div>
          <div className="font-mono text-sm font-medium tabular-nums text-foreground">{when.value}</div>
        </div>
      </ProgressLink>
    </li>
  );
}

/** One upcoming IPO: logo, name, open date, price band and score. */
function UpcomingIpoRow({ item }: { item: HomePageIpoProps }) {
  const { common: c, home } = useT();
  const d = home.upcoming;
  const { ipo } = item;
  const score = scoreOf(item);
  const priceBand = getPriceBand(ipo);
  const priceText = priceBand ? `₹${priceBand}` : c.na;
  const openDate = ipo?.ipo_dates?.ipo_open_date;

  return (
    <li className="row-hover flex items-center gap-3 border-b border-border py-4 sm:gap-4">
      <IpoLogo src={ipo?.image_url} name={ipo?.upcoming_ipo_2025} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-display font-bold tracking-[-0.015em] text-foreground">
          <IpoTitleLink ipo={ipo} hasAnalysis={score > 0} />
        </div>
        <div className="truncate text-sm text-muted-foreground">
          {d.opens} <span className="font-mono tabular-nums">{formatShortDateOrToday(openDate, c)}</span>
          {priceBand && <span className="font-mono tabular-nums sm:hidden">, {priceText}</span>}
        </div>
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <div className="text-xs text-muted-foreground">{c.priceBand}</div>
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
  const { common: c, home } = useT();
  const d = home.upcoming;
  const { board } = useBoard();
  const [tab, setTab] = useState<Tab>('all');
  const visibleIpos = ipos.filter((item) => getIpoType(item.ipo) === board).slice(0, MAX_ROWS);

  return (
    <section className="py-8 sm:py-12">
      <SectionHeading
        title={c.status.upcoming}
        href={tab === 'quota' ? '/ipos/shareholder-quota' : '/ipos?filter=upcoming'}
        linkLabel={tab === 'quota' ? fill(d.viewAllQuotaLabel, { count: quota.length }) : fill(d.viewAllLabel, { count: ipos.length })}
        linkText={c.viewAll}
      />
      {quota.length > 0 && (
        <SegmentedControl
          label={d.tabsLabel}
          options={[{ value: 'all', label: c.all }, { value: 'quota', label: c.nav.quota, count: quota.length }]}
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
        <EmptyState icon={CalendarDays} title={fill(d.emptyTitle, { board: boardLabel(c.board, board) })} hint={d.emptyHint} />
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
