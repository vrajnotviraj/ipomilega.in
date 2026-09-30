import { cn } from "@/lib/utils";
import { rankFor, signedPct, signedRupees, type Stats } from "@/components/not-found/game-rules";

const RULES = [
  "Allotment is a lottery: about 7 in 10 get shares.",
  "Breaking news can swing the price either way.",
  "Circuits cap it at 20% either side of the open. At the lower one, nobody buys.",
  "At the bell you sell at whatever the price is.",
];

/** The game rules, shown before the first trade. */
function HowItWorks() {
  return (
    <ul className="mt-auto list-disc space-y-1.5 border-t border-border pt-4 pl-4 text-xs text-muted-foreground">
      {RULES.map((rule) => (
        <li key={rule}>{rule}</li>
      ))}
    </ul>
  );
}

/** Running rank, P&L and record across rounds, or the rules if nothing has been traded yet. */
export function PortfolioStats({ stats, onReset }: { stats: Stats; onReset: () => void }) {
  if (stats.trades === 0) return <HowItWorks />;

  const rows = [
    ["Trades", String(stats.trades)],
    ["Win rate", `${Math.round((stats.wins / stats.trades) * 100)}%`],
    ["Streak", `${stats.streak} (best ${stats.bestStreak})`],
    ["Best trade", stats.bestPct === null ? "-" : signedPct(stats.bestPct, 1)],
  ];

  return (
    <div className="mt-auto border-t border-border pt-4 text-xs text-muted-foreground">
      <div>Your rank</div>
      <div className="font-display text-base font-bold text-foreground">{rankFor(stats.pnl)}</div>
      <div className={cn("mt-1 font-mono text-sm tabular-nums", stats.pnl >= 0 ? "text-score-good" : "text-score-bad")}>
        Total P&amp;L {signedRupees(stats.pnl)}
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
        Reset portfolio
      </button>
    </div>
  );
}
