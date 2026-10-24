import { useT } from "@/lib/i18n/client";
import { fill, plural } from "@/lib/i18n/locales";
import { formatRupees } from "@/lib/ipo/format";
import type { Goal, Plan } from "@/lib/ipo/planner/plan";
import { countInWords, percent } from "@/components/planner/format";

/** The plan in one sentence, then what holds it back: money or accounts. */
export function Verdict({ plan, funds, accounts, goal, cheapestBid }: { plan: Plan; funds: number; accounts: number; goal: Goal; cheapestBid: number }) {
  const { common, planner } = useT();
  const verdict = planner.verdict;
  const bids = plan.applications.reduce((sum, app) => sum + app.accounts.length, 0);
  const ipoCount = new Set(plan.applications.map((app) => app.ipo.id)).size;
  const accountsUsed = Math.max(...plan.applications.flatMap((app) => app.accounts));
  const spare = funds - plan.peakBlocked;

  return (
    <div className="rounded-[18px] bg-primary p-5 text-primary-foreground sm:p-6">
      <p className="text-xs font-medium uppercase tracking-[0.04em] text-primary-foreground/70">{planner.yourPlan}</p>
      <p className="mt-2 font-display text-xl font-bold leading-snug tracking-[-0.015em] text-balance sm:text-2xl">
        {fill(verdict.place, { bids: plural(planner.bidCount, bids), ipos: plural(common.ipoCount, ipoCount), accounts: plural(planner.accountCount, accountsUsed) })}{" "}
        <span className="font-mono tabular-nums text-brand-accent">
          {goal === "gain" ? formatRupees(plan.expectedGain) : plan.expectedAllotments.toFixed(2)}
        </span>{" "}
        {goal === "gain" ? verdict.inGains : verdict.allotments} <span className="font-mono tabular-nums">{percent(plan.chanceOfAny)}</span> {verdict.chanceOfAny}
      </p>
      <p className="mt-3 text-sm text-pretty text-primary-foreground/80">
        {verdict.atMost} <span className="font-mono tabular-nums">{formatRupees(plan.peakBlocked)}</span> {verdict.blockedAtOnce}{" "}
        {usesEveryAccount(plan, accounts) && spare >= cheapestBid
          ? fill(verdict.accountsLimit, { spare: formatRupees(spare) })
          : plan.unused.length > 0
            ? verdict.moneyLimit
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
  const d = useT().planner.verdict;
  const time = searched.ms < 1000 ? `${searched.ms < 10 ? Math.max(0.1, searched.ms).toFixed(1) : Math.round(searched.ms)} ms` : `${(searched.ms / 1000).toFixed(1)} s`;
  const stats = [
    { label: d.possiblePlans, value: countInWords(searched.possible, d.units) },
    { label: d.checked, value: proven ? "100%" : d.most },
    { label: d.searchTime, value: time },
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
        {proven ? d.proven : d.cutShort}
      </p>
    </div>
  );
}
