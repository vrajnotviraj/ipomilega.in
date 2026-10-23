import { formatRupees } from "@/lib/ipo/format";
import type { Goal, Plan } from "@/lib/ipo/planner/plan";
import { percent } from "@/components/planner/format";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** The plan in one sentence, then what holds it back: money or accounts. */
export function Verdict({ plan, funds, accounts, goal, cheapestBid }: { plan: Plan; funds: number; accounts: number; goal: Goal; cheapestBid: number }) {
  const bids = plan.applications.reduce((sum, app) => sum + app.accounts.length, 0);
  const ipoCount = new Set(plan.applications.map((app) => app.ipo.id)).size;
  const accountsUsed = Math.max(...plan.applications.flatMap((app) => app.accounts));
  const spare = funds - plan.peakBlocked;

  return (
    <div className="rounded-[18px] bg-primary p-5 text-primary-foreground sm:p-6">
      <p className="text-xs font-medium uppercase tracking-[0.04em] text-primary-foreground/70">Your plan</p>
      <p className="mt-2 font-display text-xl font-bold leading-snug tracking-[-0.015em] text-balance sm:text-2xl">
        Place {plural(bids, "bid")} across {plural(ipoCount, "IPO")} from {plural(accountsUsed, "account")}. Expect about{" "}
        <span className="font-mono tabular-nums text-brand-accent">
          {goal === "gain" ? formatRupees(plan.expectedGain) : plan.expectedAllotments.toFixed(2)}
        </span>{" "}
        {goal === "gain" ? "in listing gains" : "allotments"}, with a <span className="font-mono tabular-nums">{percent(plan.chanceOfAny)}</span> chance at least one bid is allotted.
      </p>
      <p className="mt-3 text-sm text-pretty text-primary-foreground/80">
        At most <span className="font-mono tabular-nums">{formatRupees(plan.peakBlocked)}</span> is blocked at once.{" "}
        {usesEveryAccount(plan, accounts) && spare >= cheapestBid
          ? `Accounts are your limit: ${formatRupees(spare)} stays free even on the busiest day, so another family account would add bids.`
          : plan.unused.length > 0
            ? "Money is your limit: the IPOs left out below need more on the day their bidding closes."
            : ""}
      </p>
    </div>
  );
}

/** True when every planned IPO already gets a main bid from every account. The quota doesn't count: it adds to an account's bid. */
function usesEveryAccount(plan: Plan, accounts: number): boolean {
  const bidsPerIpo = new Map<string, number>();
  for (const app of plan.applications.filter((app) => app.option.category !== "shareholder")) bidsPerIpo.set(app.ipo.id, (bidsPerIpo.get(app.ipo.id) ?? 0) + app.accounts.length);
  return [...bidsPerIpo.values()].every((bids) => bids === accounts);
}
