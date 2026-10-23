import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { HomePageIpoProps } from '@/types/ipo-with-analysis';
import { daysFromToday, formatShortDateOrToday } from '@/lib/ipo-format';

const openDateOf = (item: HomePageIpoProps) => item.ipo?.ipo_dates?.ipo_open_date;
const pill = 'inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-medium press';

/** Shown in place of the live cards when nothing is open: when the next IPO opens, two counts and two ways onward. */
export function NothingOpen({ board, upcoming, closed }: { board: string; upcoming: HomePageIpoProps[]; closed: HomePageIpoProps[] }) {
  const days = upcoming.map((item) => daysFromToday(openDateOf(item))).filter((d): d is number => d !== null && d >= 0);
  const nextOpen = days.length ? Math.min(...days) : null;
  const next = nextOpen === null ? null : upcoming.find((item) => daysFromToday(openDateOf(item)) === nextOpen);
  const thisWeek = days.filter((d) => d <= 7).length;

  return (
    <div className="grid gap-6 rounded-[18px] bg-secondary px-5 py-6 text-foreground sm:grid-cols-[1fr_auto] sm:gap-x-8 sm:px-7 sm:py-7">
      <div>
        {next && (
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-2.5 py-1 font-mono text-xs text-foreground">
            <span aria-hidden className="size-1.5 rounded-full bg-brand-accent" />
            Next opens {formatShortDateOrToday(openDateOf(next))}
          </span>
        )}
        <h3 className="mt-3 font-display text-xl font-bold leading-tight tracking-[-0.015em] text-balance sm:text-2xl">
          No {board} IPOs are open for bidding.
        </h3>
        <p className="mt-2 max-w-[46ch] text-muted-foreground">
          Nothing is taking bids right now. Read the scored prospectus of an IPO opening next, or check allotment for one that just closed.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 sm:items-center sm:justify-end">
        <Link href="/ipos?filter=upcoming" className={`${pill} border-primary bg-primary text-primary-foreground`}>
          See upcoming <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
        </Link>
        <Link href="/ipos?filter=closed" className={`${pill} border-primary/20 text-foreground`}>
          Check allotment
        </Link>
      </div>
      <dl className="flex flex-wrap gap-x-6 gap-y-3 border-t border-primary/15 pt-4 sm:col-span-2">
        <div>
          <dt className="text-xs text-muted-foreground">Opening this week</dt>
          <dd className="font-mono text-sm font-medium tabular-nums">{thisWeek} IPOs</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Closed, not listed yet</dt>
          <dd className="font-mono text-sm font-medium tabular-nums">{closed.length} IPOs</dd>
        </div>
      </dl>
    </div>
  );
}
