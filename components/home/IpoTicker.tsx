import { HomePageIpoProps } from '@/types/ipo-with-analysis';
import { ProgressLink } from '@/components/progress/ProgressLink';
import { applyQibAdjustment, getQibSignal, scoreOf } from '@/lib/ipo-format';
import { scoreColorOnInk } from '@/components/analysis/primitives';

interface TickerEntry {
  key: string;
  slug: string;
  name: string;
  score: number | null;
  status: 'Open' | 'Upcoming';
}

const entry = (item: HomePageIpoProps, status: TickerEntry['status'], score: number) => ({
  key: item._id,
  slug: item.ipo?.slug,
  name: item.ipo?.upcoming_ipo_2025,
  score: score || null,
  status,
});

function toEntries(live: HomePageIpoProps[], upcoming: HomePageIpoProps[]): TickerEntry[] {
  return [
    ...live.map((item) => entry(item, 'Open', applyQibAdjustment(scoreOf(item), getQibSignal(item.ipo)))),
    ...upcoming.map((item) => entry(item, 'Upcoming', scoreOf(item))),
  ].filter((entry): entry is TickerEntry => !!entry.slug && !!entry.name);
}

/** Full-bleed ink band scrolling every live and upcoming IPO with its score. Pauses on hover. */
export function IpoTicker({ live, upcoming }: { live: HomePageIpoProps[]; upcoming: HomePageIpoProps[] }) {
  const entries = toEntries(live, upcoming);
  if (entries.length === 0) return null;

  const durationSeconds = Math.min(90, Math.max(20, entries.length * 5));

  return (
    <div className="overflow-hidden bg-primary text-primary-foreground motion-reduce:overflow-x-auto [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
      <div
        className="animate-ticker flex w-max items-center py-3 hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] motion-reduce:animate-none"
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        {/* Two copies so the loop never shows a gap; the second is hidden from assistive tech. */}
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1 || undefined}>
            {entries.map((entry) => (
              <ProgressLink
                key={`${copy}-${entry.key}`}
                href={`/analysis/${entry.slug}`}
                tabIndex={copy === 1 ? -1 : undefined}
                className="flex shrink-0 items-center gap-2 whitespace-nowrap border-r border-primary-foreground/15 px-5 text-sm text-primary-foreground/85 transition-colors hover:text-primary-foreground"
              >
                <span className="font-display font-bold">{entry.name}</span>
                {entry.score !== null && (
                  <span className={`font-mono font-medium tabular-nums ${scoreColorOnInk(entry.score)}`}>
                    {entry.score.toFixed(1)}
                  </span>
                )}
                <span className="text-xs font-medium uppercase tracking-[0.04em] text-primary-foreground/60">{entry.status}</span>
              </ProgressLink>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
