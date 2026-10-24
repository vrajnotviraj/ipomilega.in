'use client';

import { ProgressLink } from '@/components/progress/ProgressLink';
import { ArrowRight } from 'lucide-react';
import { HomePageIpoProps } from '@/types/ipo-with-analysis';
import { daysFromToday, formatShortDateOrToday } from '@/lib/ipo/format';
import { useT } from '@/lib/i18n/client';
import { fill, plural } from '@/lib/i18n/locales';

const openDateOf = (item: HomePageIpoProps) => item.ipo?.ipo_dates?.ipo_open_date;
const pill = 'inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-medium press';

/** Shown in place of the live cards when nothing is open: when the next IPO opens, two counts and two ways onward. */
export function NothingOpen({ board, upcoming, closed }: { board: string; upcoming: HomePageIpoProps[]; closed: HomePageIpoProps[] }) {
  const { common: c, home } = useT();
  const d = home.nothingOpen;
  const days = upcoming.map((item) => daysFromToday(openDateOf(item))).filter((day): day is number => day !== null && day >= 0);
  const nextOpen = days.length ? Math.min(...days) : null;
  const next = nextOpen === null ? null : upcoming.find((item) => daysFromToday(openDateOf(item)) === nextOpen);
  const thisWeek = days.filter((day) => day <= 7).length;

  return (
    <div className="grid gap-6 rounded-[18px] bg-secondary px-5 py-6 text-foreground sm:grid-cols-[1fr_auto] sm:gap-x-8 sm:px-7 sm:py-7">
      <div>
        {next && (
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-2.5 py-1 font-mono text-xs text-foreground">
            <span aria-hidden className="size-1.5 rounded-full bg-brand-accent" />
            {nextOpen === 0 ? d.nextOpensToday : fill(d.nextOpens, { date: formatShortDateOrToday(openDateOf(next), c) })}
          </span>
        )}
        <h3 className="mt-3 font-display text-xl font-bold leading-tight tracking-[-0.015em] text-balance sm:text-2xl">
          {fill(d.title, { board })}
        </h3>
        <p className="mt-2 max-w-[46ch] text-muted-foreground">
          {d.lead}
        </p>
      </div>
      <div className="flex flex-wrap gap-3 sm:items-center sm:justify-end">
        <ProgressLink href="/ipos?filter=upcoming" className={`${pill} border-primary bg-primary text-primary-foreground`}>
          {d.seeUpcoming} <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
        </ProgressLink>
        <ProgressLink href="/ipos?filter=closed" className={`${pill} border-primary/20 text-foreground`}>
          {c.checkAllotment}
        </ProgressLink>
      </div>
      <dl className="flex flex-wrap gap-x-6 gap-y-3 border-t border-primary/15 pt-4 sm:col-span-2">
        <div>
          <dt className="text-xs text-muted-foreground">{d.openingThisWeek}</dt>
          <dd className="font-mono text-sm font-medium tabular-nums">{plural(c.ipoCount, thisWeek)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{d.closedNotListed}</dt>
          <dd className="font-mono text-sm font-medium tabular-nums">{plural(c.ipoCount, closed.length)}</dd>
        </div>
      </dl>
    </div>
  );
}
