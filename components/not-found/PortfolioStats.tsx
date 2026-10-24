import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/locales";
import { rankFor, signedPct, signedRupees, type Stats } from "@/components/not-found/game-rules";

/** The game rules, shown before the first trade. */
function HowItWorks() {
  const d = useT().errors.portfolio;
  return (
    <ul className="mt-auto list-disc space-y-1.5 border-t border-border pt-4 pl-4 text-xs text-muted-foreground">
      {d.rules.map((rule) => (
        <li key={rule}>{rule}</li>
      ))}
    </ul>
  );
}

/** Running rank, P&L and record across rounds, or the rules if nothing has been traded yet. */
export function PortfolioStats({ stats, onReset }: { stats: Stats; onReset: () => void }) {
  const { game, portfolio: d } = useT().errors;
  if (stats.trades === 0) return <HowItWorks />;

  const rows = [
    [d.trades, String(stats.trades)],
    [d.winRate, `${Math.round((stats.wins / stats.trades) * 100)}%`],
    [d.streak, fill(d.streakValue, { streak: stats.streak, best: stats.bestStreak })],
    [d.bestTrade, stats.bestPct === null ? "-" : signedPct(stats.bestPct, 1)],
  ];

  return (
    <div className="mt-auto border-t border-border pt-4 text-xs text-muted-foreground">
      <div>{d.yourRank}</div>
      <div className="font-display text-base font-bold text-foreground">{game.ranks[rankFor(stats.pnl)]}</div>
      <div className={cn("mt-1 font-mono text-sm tabular-nums", stats.pnl >= 0 ? "text-score-good" : "text-score-bad")}>
        {d.totalPnl} {signedRupees(stats.pnl)}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt>{label}</dt>
            <dd className="text-right font-mono tabular-nums text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        onClick={onReset}
        className="mt-3 rounded-full underline underline-offset-4 transition-colors hover:text-foreground active:scale-[0.98]"
      >
        {d.resetPortfolio}
      </button>
    </div>
  );
}
