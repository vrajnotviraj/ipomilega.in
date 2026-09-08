// IpoTicker.tsx
'use client';

import { HomePageIpoProps } from '@/app/types/homepage';
import { ProgressLink } from '../Progressbar/ProgressLink';

interface IpoTickerProps {
  live: HomePageIpoProps[];
  upcoming: HomePageIpoProps[];
}

interface TickerEntry {
  key: string;
  slug: string;
  name: string;
  score: number;
  status: 'Open' | 'Upcoming';
}

// The ticker bar is always the dark strip from the mockup regardless of site theme, so the
// score needs colors tuned for a near-black background rather than the site's normal
// (light-background-tuned) score-good/mid/bad tokens.
const tickerScoreColor = (score: number) => {
  if (score <= 3) return 'text-[#C4574B]';
  if (score <= 6) return 'text-[#D2A257]';
  return 'text-[#5C9975]';
};

export function IpoTicker({ live, upcoming }: IpoTickerProps) {
  const entries: TickerEntry[] = [
    ...live.map((item) => ({
      key: item._id,
      slug: item.ipo?.slug,
      name: item.ipo?.upcoming_ipo_2025,
      score: item.analysis?.risk_meter?.score,
      status: 'Open' as const,
    })),
    ...upcoming.map((item) => ({
      key: item._id,
      slug: item.ipo?.slug,
      name: item.ipo?.upcoming_ipo_2025,
      score: item.analysis?.risk_meter?.score,
      status: 'Upcoming' as const,
    })),
  ].filter((item): item is TickerEntry => !!item.slug && !!item.name && !!item.score);

  if (entries.length === 0) return null;

  const duration = Math.min(90, Math.max(20, entries.length * 5));

  return (
    <div className="relative left-1/2 -translate-x-1/2 -mt-8 mb-8 w-screen overflow-hidden bg-[#17140F] border-y border-white/10">
      <div
        className="flex w-max items-center py-2.5 motion-reduce:animate-none hover:[animation-play-state:paused] animate-ticker"
        style={{ animationDuration: `${duration}s` }}
      >
        {[0, 1].map((rep) => (
          <div key={rep} className="flex items-center flex-shrink-0" aria-hidden={rep === 1 || undefined}>
            {entries.map((entry) => (
              <ProgressLink
                key={`${rep}-${entry.key}`}
                href={`/analysis/${entry.slug}`}
                tabIndex={rep === 1 ? -1 : undefined}
                className="flex items-center gap-2 px-4 whitespace-nowrap text-sm font-sans text-[#F5F2EA]/90 hover:text-[#F5F2EA] transition-colors flex-shrink-0"
              >
                <span className="font-serif font-medium">{entry.name}</span>
                <span className="text-[#F5F2EA]/40">•</span>
                <span className={`font-mono font-semibold ${tickerScoreColor(entry.score)}`}>
                  {entry.score.toFixed(1)}
                </span>
                <span className="text-xs font-mono uppercase tracking-wide text-[#F5F2EA]/60">{entry.status}</span>
                <span className="text-[#F5F2EA]/20 ml-4">|</span>
              </ProgressLink>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
