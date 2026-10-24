import { formatRupees } from "@/lib/ipo/format";
import type { Goal, Plan } from "@/lib/ipo/planner/plan";
import { countInWords, percent } from "@/components/planner/format";

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
        Place {plural(bids, "bid")} across {plural(ipoCount, "IPO")} from {plural(accountsUsed, "account")}. On average that&apos;s about{" "}
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
      <SearchStats searched={plan.searched} proven={plan.proven} />
    </div>
  );
}

/** True when every planned IPO already gets a main bid from every account. The quota doesn't count: it adds to an account's bid. */
function usesEveryAccount(plan: Plan, accounts: number): boolean {
  const bidsPerIpo = new Map<string, number>();
  for (const app of plan.applications.filter((app) => app.option.category !== "shareholder")) bidsPerIpo.set(app.ipo.id, (bidsPerIpo.get(app.ipo.id) ?? 0) + app.accounts.length);
  return [...bidsPerIpo.values()].every((bids) => bids === accounts);
}

/** How much the search weighed to land on this plan: every plan possible, how many it covered, and the time it took. */
function SearchStats({ searched, proven }: { searched: Plan["searched"]; proven: boolean }) {
  const time = searched.ms < 1000 ? `${searched.ms < 10 ? Math.max(0.1, searched.ms).toFixed(1) : Math.round(searched.ms)} ms` : `${(searched.ms / 1000).toFixed(1)} s`;
  const stats = [
    { label: "Possible plans", value: countInWords(searched.possible) },
    { label: "Checked", value: proven ? "100%" : "Most" },
    { label: "Search time", value: time },
  ];
  return (
    <div className="mt-5 border-t border-primary-foreground/15 pt-4">
      <dl className="grid grid-cols-3 divide-x divide-primary-foreground/15">
        {stats.map(({ label, value }) => (
          <div key={label} className="min-w-0 px-3 first:pl-0 last:pr-0">
            <dt className="text-xs font-medium uppercase tracking-[0.04em] text-primary-foreground/70">{label}</dt>
            <dd className="mt-1 font-mono text-base font-medium tabular-nums text-primary-foreground sm:text-lg">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-pretty text-primary-foreground/70">
        {proven
          ? "Every possible split of your money and accounts was checked. Most were ruled out in bulk the moment they couldn't beat this plan."
          : "So many IPOs are open that we stopped searching; a slightly better plan may exist."}
      </p>
    </div>
  );
}
