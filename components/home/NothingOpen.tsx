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
    <div className="grid gap-6 rounded-[18px] bg-primary px-5 py-6 text-primary-foreground sm:grid-cols-[1fr_auto] sm:items-center sm:px-7 sm:py-8">
      <div>
        {next && (
          <span className="inline-block rounded-full bg-brand-accent px-2.5 py-1 font-mono text-xs font-medium text-primary">
            Next opens {formatShortDateOrToday(openDateOf(next))}
          </span>
        )}
        <h3 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-[-0.02em] text-balance sm:text-3xl">
          No {board} IPOs are open for bidding.
        </h3>
        <p className="mt-2 max-w-[46ch] text-primary-foreground/70">
          Use the quiet to read up. Scores, GMP and allotment odds are ready for what opens next.
        </p>
        <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-primary-foreground/20 pt-4">
          <div>
            <dt className="text-xs text-primary-foreground/70">Opening this week</dt>
            <dd className="font-mono text-sm font-medium tabular-nums">{thisWeek} IPOs</dd>
          </div>
          <div>
            <dt className="text-xs text-primary-foreground/70">Closed, not listed yet</dt>
            <dd className="font-mono text-sm font-medium tabular-nums">{closed.length} IPOs</dd>
          </div>
        </dl>
      </div>
      <div className="flex flex-wrap gap-3 sm:justify-end">
        <Link href="/ipos?filter=upcoming" className={`${pill} border-primary-foreground bg-primary-foreground text-primary`}>
          See upcoming <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
        </Link>
        <Link href="/ipos?filter=closed" className={`${pill} border-primary-foreground/25 text-primary-foreground`}>
          Check allotment
        </Link>
      </div>
    </div>
  );
}
