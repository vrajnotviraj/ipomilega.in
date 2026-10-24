import type { BidOption, PlannerIpo } from '@/lib/ipo/planner/ipo';

export type Goal = 'gain' | 'allotments';

/** Bids on one IPO in one category, one per account. */
export type Application = {
  ipo: PlannerIpo;
  option: BidOption;
  /** Account numbers, from 1. */
  accounts: number[];
  /** Paid for with money an earlier bid frees; an allotment on that bid keeps the money in shares past this close. */
  atRisk: boolean;
};

/** Accounts that hold each IPO's parent shares, by IPO id. Each can also bid in the shareholder quota. */
export type Holders = Record<string, number>;

export type Plan = {
  applications: Application[];
  /** Plannable IPOs that got no bid. */
  unused: PlannerIpo[];
  expectedGain: number;
  expectedAllotments: number;
  /** Chance at least one application is allotted, 0 to 1. */
  chanceOfAny: number;
  /** Most money blocked at once. */
  peakBlocked: number;
  /** False when the search hit its limit, so a slightly better plan may exist. */
  proven: boolean;
  /** How hard the search worked: every plan the inputs allow and how long it took. */
  searched: { possible: number; ms: number };
};

/** A set of bids and what it costs and is worth. */
type Choice = { cost: number; worth: number; applications: Omit<Application, 'atRisk'>[] };

/** IPOs that close on the same day and free their money on the same day. Their bids block money together. */
type Batch = { closeDay: number; freeDay: number; choices: Choice[] };

const NO_BIDS: Choice = { cost: 0, worth: 0, applications: [] };

/** Branches the search tries before it settles for the best plan found so far: a quick limit for the browser, a deep one for the server. */
export const QUICK_SEARCH = 200_000;
export const DEEP_SEARCH = 3_000_000;

/** The bids worth the most for the goal, never blocking more than `funds` at once and bidding once per account per IPO. */
export function planIpos(ipos: PlannerIpo[], funds: number, accounts: number, goal: Goal, holders: Holders = {}, maxBranches = QUICK_SEARCH): Plan {
  const started = performance.now();
  const searched = { possible: 1, ms: 0 };
  const batches = batchBySchedule(ipos).map((batchIpos) => ({
    closeDay: batchIpos[0].closeDay,
    freeDay: batchIpos[0].freeDay,
    choices: bestChoices(batchIpos, funds, accounts, goal, holders, searched),
  }));
  const { picks, proven } = pickOnePerBatch(batches, funds, maxBranches);
  searched.ms = performance.now() - started;
  return { ...describe(ipos, picks.flatMap((choice) => choice.applications), funds), proven, searched };
}

function batchBySchedule(ipos: PlannerIpo[]): PlannerIpo[][] {
  const batches = new Map<string, PlannerIpo[]>();
  for (const ipo of ipos) {
    const key = `${ipo.closeDay}-${ipo.freeDay}`;
    batches.set(key, [...(batches.get(key) ?? []), ipo]);
  }
  return [...batches.values()].sort((a, b) => a[0].closeDay - b[0].closeDay);
}

/** For a batch, the best set of bids at each cost, best first. A set costing more must be worth more to stay. */
function bestChoices(ipos: PlannerIpo[], funds: number, accounts: number, goal: Goal, holders: Holders, searched: Plan['searched']): Choice[] {
  let choices = [NO_BIDS];
  for (const ipo of ipos) {
    const allWays = waysToBid(ipo, accounts, goal, Math.min(accounts, holders[ipo.id] ?? 0));
    searched.possible *= allWays.length;
    const ways = keepBestPerCost(allWays.filter((way) => way.cost <= funds));
    const combined = choices.flatMap((choice) => ways.map((way) => join(choice, way))).filter((choice) => choice.cost <= funds);
    choices = keepBestPerCost(combined);
  }
  return choices.reverse();
}

/**
 * Every split of up to `accounts` accounts across the IPO's categories, including no bid.
 * A shareholder bid is on top of an account's other bid, so the quota gets its own count, up to `holders`.
 */
function waysToBid(ipo: PlannerIpo, accounts: number, goal: Goal, holders: number): Choice[] {
  const quota = ipo.options.find((option) => option.category === 'shareholder');
  const shared = ipo.options.filter((option) => option.category !== 'shareholder');
  const quotaCounts = quota ? Array.from({ length: holders + 1 }, (_, n) => n) : [0];

  return splitAccounts(shared.length, accounts).flatMap((counts) =>
    quotaCounts.map((quotaCount) => {
      let nextAccount = 1;
      const applications = shared.flatMap((option, k) => {
        const numbers = Array.from({ length: counts[k] }, () => nextAccount++);
        return numbers.length ? [{ ipo, option, accounts: numbers }] : [];
      });
      if (quota && quotaCount) applications.push({ ipo, option: quota, accounts: Array.from({ length: quotaCount }, (_, i) => i + 1) });
      return {
        cost: applications.reduce((sum, app) => sum + app.option.cost * app.accounts.length, 0),
        worth: applications.reduce((sum, app) => sum + worthOf(app.option, goal) * app.accounts.length, 0),
        applications,
      };
    })
  );
}

const worthOf = (option: BidOption, goal: Goal) => option.odds * (goal === 'gain' ? option.gain : 1);

/** Ways to give up to `accounts` accounts to `slots` categories: [[0], [1], [2]] for one slot and two accounts. */
function splitAccounts(slots: number, accounts: number): number[][] {
  if (slots === 0) return [[]];
  return Array.from({ length: accounts + 1 }, (_, n) => splitAccounts(slots - 1, accounts - n).map((rest) => [n, ...rest])).flat();
}

const join = (a: Choice, b: Choice): Choice => ({
  cost: a.cost + b.cost,
  worth: a.worth + b.worth,
  applications: [...a.applications, ...b.applications],
});

function keepBestPerCost(choices: Choice[]): Choice[] {
  const kept: Choice[] = [];
  for (const choice of choices.sort((a, b) => a.cost - b.cost || b.worth - a.worth)) {
    if (!kept.length || choice.worth > kept[kept.length - 1].worth + 1e-9) kept.push(choice);
  }
  return kept;
}

/**
 * One choice per batch, worth the most in total while the money blocked on every close day fits the funds.
 * Branch and bound: a branch stops once even the best choices that still fit can't beat the best plan so far.
 */
function pickOnePerBatch(batches: Batch[], funds: number, maxBranches: number): { picks: Choice[]; proven: boolean } {
  const picked: Choice[] = [];
  let best = { worth: -1, picks: [] as Choice[] };

  const blockedOn = (day: number) =>
    picked.reduce((sum, choice, i) => (holdsMoneyOn(batches[i], day) ? sum + choice.cost : sum), 0);
  const fitsEveryCloseDay = () => batches.every((batch) => blockedOn(batch.closeDay) <= funds);
  // Choices run best first, so the first that fits the room left is the best that fits.
  const mostStillPossible = (from: number) =>
    batches.slice(from).reduce((sum, batch) => sum + (batch.choices.find((c) => c.cost <= funds - blockedOn(batch.closeDay))?.worth ?? 0), 0);

  let branches = 0;

  function tryBatch(i: number, worthSoFar: number) {
    if (++branches > maxBranches) return;
    if (i === batches.length) {
      if (worthSoFar > best.worth + 1e-9) best = { worth: worthSoFar, picks: [...picked] };
      return;
    }
    if (worthSoFar + mostStillPossible(i) <= best.worth + 1e-9) return;

    for (const choice of batches[i].choices) {
      picked[i] = choice;
      if (fitsEveryCloseDay()) tryBatch(i + 1, worthSoFar + choice.worth);
    }
    picked.length = i;
  }

  tryBatch(0, 0);
  return { picks: best.picks, proven: branches <= maxBranches };
}

const holdsMoneyOn = (span: { closeDay: number; freeDay: number }, day: number) => span.closeDay <= day && day < span.freeDay;

/** The picked bids in date order, with the risk flags and totals the page shows. */
function describe(ipos: PlannerIpo[], picked: Omit<Application, 'atRisk'>[], funds: number): Omit<Plan, 'proven' | 'searched'> {
  const blockedOn = (day: number) =>
    picked.reduce((sum, app) => (holdsMoneyOn(app.ipo, day) ? sum + app.option.cost * app.accounts.length : sum), 0);
  const isAtRisk = (app: Omit<Application, 'atRisk'>) =>
    picked.some(
      (earlier) =>
        earlier.ipo.freeDay <= app.ipo.closeDay &&
        app.ipo.closeDay < earlier.ipo.cashDay &&
        blockedOn(app.ipo.closeDay) + earlier.option.cost > funds
    );

  const applications = picked
    .map((app) => ({ ...app, atRisk: isAtRisk(app) }))
    .sort((a, b) => a.ipo.closeDay - b.ipo.closeDay || b.option.cost - a.option.cost);
  const total = (valueOf: (app: Application) => number) => applications.reduce((sum, app) => sum + valueOf(app) * app.accounts.length, 0);
  const planned = new Set(applications.map((app) => app.ipo.id));

  return {
    applications,
    unused: ipos.filter((ipo) => !planned.has(ipo.id)),
    expectedGain: Math.round(total((app) => app.option.odds * app.option.gain)),
    expectedAllotments: total((app) => app.option.odds),
    chanceOfAny: 1 - applications.reduce((miss, app) => miss * (1 - app.option.odds) ** app.accounts.length, 1),
    peakBlocked: Math.max(0, ...applications.map((app) => blockedOn(app.ipo.closeDay))),
  };
}
