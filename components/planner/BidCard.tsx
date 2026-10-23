import { Info, TriangleAlert } from "lucide-react";
import { IpoLogo } from "@/components/ipo-shared/IpoLogo";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { formatRupees, getProbabilityColor } from "@/lib/ipo/format";
import { formatDay } from "@/lib/ipo/planner/days";
import type { Application } from "@/lib/ipo/planner/plan";
import { CATEGORY_LABEL, accountRange, oneIn } from "@/components/planner/format";
import { cn } from "@/lib/utils";

/** A bid due on the day it sits under: the IPO, its category, which accounts, the money, the odds and when the money comes back. */
export function BidCard({ app }: { app: Application }) {
  const { ipo, option } = app;
  const note = noteFor(app);
  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <IpoLogo src={ipo.logo} name={ipo.name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-display font-bold tracking-[-0.015em] text-foreground">
            {ipo.slug ? (
              <ProgressLink href={`/analysis/${ipo.slug}`} className="underline decoration-primary/50 decoration-dotted underline-offset-4 hover:decoration-solid">
                {ipo.name}
              </ProgressLink>
            ) : (
              ipo.name
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {ipo.board} · GMP <span className="font-mono tabular-nums text-score-good">+{ipo.gmpPercent}%</span>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium uppercase tracking-[0.04em] text-foreground">
          {CATEGORY_LABEL[option.category]}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3 text-sm sm:grid-cols-4">
        <Fact label={accountRange(app.accounts)} value={`${formatRupees(option.cost)} each`} />
        <Fact label={option.estimated ? "Odds (est.)" : "Odds"} value={oneIn(option.odds)} valueClass={getProbabilityColor(option.odds * 100)} />
        <Fact label="Bid by" value="3 PM" />
        <Fact label="Money back" value={formatDay(ipo.freeDay)} />
      </dl>

      {note && (
        <p className="mt-3 flex gap-2 rounded-lg bg-secondary px-3 py-2 text-xs text-pretty text-foreground">
          <Info aria-hidden className="mt-px size-3.5 shrink-0 text-muted-foreground" strokeWidth={2.25} />
          {note}
        </p>
      )}

      {app.atRisk && (
        <p className="mt-3 flex gap-2 rounded-lg bg-secondary px-3 py-2 text-xs text-pretty text-foreground">
          <TriangleAlert aria-hidden className="mt-px size-3.5 shrink-0 text-score-mid" strokeWidth={2.25} />
          This uses money an earlier bid frees. If that bid is allotted, the money stays in shares until listing, so skip this one or add money.
        </p>
      )}
    </li>
  );
}

/** What this category's bid needs or returns that the other cards don't show. */
function noteFor({ ipo, option }: Application): string | null {
  if (option.category === "bhni" && option.allotted < option.cost) {
    return `If you win the draw you get about ${formatRupees(option.allotted)} of shares, the S-HNI minimum, while ${formatRupees(option.cost)} stays blocked until the refund.`;
  }
  if (option.category === "shareholder") {
    const parents = ipo.quotaParents?.length ? ipo.quotaParents.join(" or ") : "the parent company";
    return `Quota for ${parents} shareholders, in addition to the retail bid. Hold the shares in demat on the record date.`;
  }
  return null;
}

function Fact({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("font-mono font-medium tabular-nums text-foreground", valueClass)}>{value}</dd>
    </div>
  );
}
