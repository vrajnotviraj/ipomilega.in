import type { Ipo } from '@/types/ipo';
import {
  ALLOTMENT_CATEGORIES,
  DAY_MS,
  dayNumberInIndia,
  getAllotmentRatio,
  getIpoType,
  getMarketLotRows,
  parseEstListingPercent,
  parseGainValue,
  parseIpoDate,
} from '@/lib/ipo-format';

/**
 * IPO planner: given the money and the number of family accounts (one PAN, demat and bank each), picks which open and
 * upcoming IPOs to bid on, in which category, from how many accounts, so the expected listing gain (or the expected
 * number of allotments) is as high as the money allows over time.
 *
 * The model, from SEBI's T+3 timeline (T is the close date):
 * - Every bid goes in on the close day, so money stays free as long as possible.
 * - Money blocked for a bid is free to bid again the working day after the refund (unblock) date, about T+3.
 * - Money that wins an allotment comes back the working day after listing, once the shares are sold.
 * - A lottery category gives each applicant one minimum application with odds of about 1 in subscription.
 * - Family money is one pool: it can be moved between accounts before a bid, but each account bids once per IPO.
 */

// ---------- Days ----------

/** Day number in India (as dayNumberInIndia) for a loose IPO date, or null. */
const dayOf = (raw: string | undefined) => {
  const date = parseIpoDate(raw);
  return date ? dayNumberInIndia(date) : null;
};

const isWeekend = (day: number) => [0, 6].includes(new Date(day * DAY_MS).getUTCDay());

/** The day `count` working days after `day`. ponytail: weekends only, exchange holidays are not skipped. */
export function addWorkingDays(day: number, count: number): number {
  let next = day;
  for (let left = count; left > 0; ) if (!isWeekend(++next)) left--;
  return next;
}

/** "Mon, 19 Oct" for a day number. */
export const formatDay = (day: number) =>
  new Date(day * DAY_MS).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

// ---------- IPOs ----------

export type CategoryKey = 'retail' | 'shni';

/** One way to apply: the minimum application in a lottery category. */
export type PlannerOption = {
  category: CategoryKey;
  /** Rupees blocked per application. */
  cost: number;
  /** Chance one application is allotted, 0 to 1. */
  odds: number;
  /** Rupees one allotted application would gain at today's GMP. */
  gain: number;
  /** Subscription the odds use; estimated while bidding is open. */
  subscription: number;
  estimated: boolean;
};

export type PlannerIpo = {
  id: string;
  name: string;
  slug: string | null;
  logo: string | null;
  board: string;
  gmpPercent: number;
  /** Bid by this day (the close day). */
  closeDay: number;
  /** Money from an unallotted bid is free to bid again from this day. */
  freeDay: number;
  /** Money from an allotted bid comes back on this day, after the listing-day sale. */
  cashDay: number;
  listingDay: number;
  /** True when a date in the schedule was estimated from the close date. */
  datesEstimated: boolean;
  options: PlannerOption[];
};

export type SkippedIpo = { id: string; name: string; slug: string | null; reason: string };

// Final subscription against GMP across 77 listed IPOs (Oct 2026): retail runs at about 1.2x the GMP %, S-HNI about 4x.
// ponytail: a straight line through medians; hot issues (GMP above 50%) run far higher, so their odds read optimistic.
const SUBSCRIPTION_PER_GMP_POINT: Record<CategoryKey, number> = { retail: 1.2, shni: 4 };

const CATEGORY_DEFS = ALLOTMENT_CATEGORIES.filter((cat): cat is typeof cat & { key: CategoryKey } => cat.key !== 'bhni');

/** The IPO in planner terms, or why it can't be planned. Odds use the live subscription or the GMP estimate, whichever is higher. */
export function toPlannerIpo(id: string, ipo: Ipo, slug: string | null): PlannerIpo | SkippedIpo {
  const name = ipo.upcoming_ipo_2025 || ipo.ipo_name || 'IPO';
  const skip = (reason: string): SkippedIpo => ({ id, name, slug, reason });

  const closeDay = dayOf(ipo.ipo_dates?.ipo_close_date || ipo.closing_date);
  if (closeDay === null) return skip('Dates not announced yet');

  const gmpPercent = parseEstListingPercent(ipo.gmp_price_gain);
  if (gmpPercent === null) return skip('No GMP yet');
  if (gmpPercent <= 0) return skip(`GMP is ${gmpPercent}%, no listing gain expected`);

  // Dates before the close are scraper noise ("2026"); fall back to the T+2 and T+3 schedule.
  const after = (raw: string | undefined) => {
    const day = dayOf(raw);
    return day !== null && day >= closeDay ? day : null;
  };
  const refundDay = after(ipo.ipo_dates?.refunds);
  const listed = after(ipo.ipo_dates?.ipo_listing_date);
  const listingDay = listed ?? addWorkingDays(closeDay, 3);

  const options = CATEGORY_DEFS.flatMap((cat): PlannerOption[] => {
    const cost = parseGainValue(getMarketLotRows(ipo.ipo_market_lot, cat.matchKeyword).min?.amount);
    if (!cost) return [];
    const live = getAllotmentRatio(ipo, cat).lottery ?? 0;
    const fromGmp = Math.max(1, gmpPercent * SUBSCRIPTION_PER_GMP_POINT[cat.key]);
    const subscription = Math.max(live, fromGmp);
    return [{ category: cat.key, cost, odds: 1 / subscription, gain: Math.round((cost * gmpPercent) / 100), subscription, estimated: subscription > live }];
  });
  if (!options.length) return skip('Lot size not out yet');

  return {
    id,
    name,
    slug,
    logo: ipo.image_url || null,
    board: getIpoType(ipo),
    gmpPercent,
    closeDay,
    freeDay: addWorkingDays(refundDay ?? addWorkingDays(closeDay, 2), 1),
    cashDay: addWorkingDays(listingDay, 1),
    listingDay,
    datesEstimated: refundDay === null || listed === null,
    options,
  };
}

export const isSkipped = (item: PlannerIpo | SkippedIpo): item is SkippedIpo => 'reason' in item;

// ---------- Plan ----------

export type Goal = 'gain' | 'allotments';

export type Application = {
  ipo: PlannerIpo;
  option: PlannerOption;
  /** 1-based account numbers that bid. */
  accounts: number[];
  /** Placed with money an earlier bid frees; if that earlier bid is allotted, the money comes back too late for this one. */
  atRisk: boolean;
};

export type Plan = {
  applications: Application[];
  /** IPOs that could be planned but got no bid: the money or accounts did more elsewhere. */
  unused: PlannerIpo[];
  expectedGain: number;
  expectedAllotments: number;
  /** Chance at least one application is allotted, 0 to 1. */
  chanceOfAny: number;
  /** Most money blocked on any close day. */
  peakBlocked: number;
};

const worth = (option: PlannerOption, goal: Goal) => option.odds * (goal === 'gain' ? option.gain : 1);

/** A set of picks for one group of IPOs: total money it blocks, its worth, and [ipo index, accounts per option]. */
type Point = { cost: number; worth: number; picks: [number, number[]][] };

/** Every split of up to `accounts` accounts across the IPO's options, as accounts per option. */
function splits(optionCount: number, accounts: number): number[][] {
  if (optionCount === 0) return [[]];
  const out: number[][] = [];
  for (let n = 0; n <= accounts; n++) for (const rest of splits(optionCount - 1, accounts - n)) out.push([n, ...rest]);
  return out;
}

/** Cost/worth frontier of a group: for each cost, only the best worth, and only points worth more than any cheaper one. Best first. */
function frontier(ipos: PlannerIpo[], members: number[], funds: number, accounts: number, goal: Goal): Point[] {
  let front: Point[] = [{ cost: 0, worth: 0, picks: [] }];
  for (const index of members) {
    const { options } = ipos[index];
    const choices = splits(options.length, accounts).map((counts) => ({
      counts,
      cost: counts.reduce((sum, n, k) => sum + n * options[k].cost, 0),
      worth: counts.reduce((sum, n, k) => sum + n * worth(options[k], goal), 0),
    }));
    const next: Point[] = [];
    for (const point of front) {
      for (const choice of choices) {
        if (point.cost + choice.cost > funds) continue;
        next.push({ cost: point.cost + choice.cost, worth: point.worth + choice.worth, picks: [...point.picks, [index, choice.counts]] });
      }
    }
    next.sort((a, b) => a.cost - b.cost || b.worth - a.worth);
    front = [];
    for (const point of next) if (!front.length || point.worth > front[front.length - 1].worth + 1e-9) front.push(point);
  }
  return front.reverse();
}

/**
 * The best plan. IPOs sharing a close day and free day form a group that blocks money together; each group gets its
 * cost/worth frontier, then a branch-and-bound search picks one point per group so the money blocked on every close
 * day stays within the funds. Exact: matches brute force on random calendars (lib/ipo-planner.check.mjs).
 */
export function planIpos(ipos: PlannerIpo[], funds: number, accounts: number, goal: Goal): Plan {
  const keyed = new Map<string, number[]>();
  ipos.forEach((ipo, index) => {
    const key = `${ipo.closeDay}|${ipo.freeDay}`;
    keyed.set(key, [...(keyed.get(key) ?? []), index]);
  });
  const groups = [...keyed.values()]
    .map((members) => ({ close: ipos[members[0]].closeDay, free: ipos[members[0]].freeDay, front: frontier(ipos, members, funds, accounts, goal) }))
    .sort((a, b) => a.close - b.close);
  const closeDays = [...new Set(groups.map((group) => group.close))];

  const chosen: Point[] = [];
  const blockedOn = (day: number) =>
    chosen.reduce((sum, point, g) => (groups[g].close <= day && day < groups[g].free ? sum + point.cost : sum), 0);
  // Fronts run best-first, so cost falls along them: the first point that fits is the best that fits.
  const bestFit = (front: Point[], room: number) => front.find((point) => point.cost <= room)?.worth ?? 0;
  const bound = (from: number) => groups.slice(from).reduce((sum, group) => sum + bestFit(group.front, funds - blockedOn(group.close)), 0);

  let best: { worth: number; points: Point[] } = { worth: -1, points: [] };
  (function search(g: number, worthSoFar: number) {
    if (g === groups.length) {
      if (worthSoFar > best.worth + 1e-9) best = { worth: worthSoFar, points: [...chosen] };
      return;
    }
    if (worthSoFar + bound(g) <= best.worth + 1e-9) return;
    for (const point of groups[g].front) {
      chosen[g] = point;
      if (closeDays.every((day) => blockedOn(day) <= funds)) search(g + 1, worthSoFar + point.worth);
    }
    chosen.length = g;
  })(0, 0);

  return describePlan(ipos, best.points, groups, funds);
}

function describePlan(ipos: PlannerIpo[], points: Point[], groups: { close: number; free: number }[], funds: number): Plan {
  const applications: Application[] = [];
  for (const point of points) {
    for (const [index, counts] of point.picks) {
      let next = 1;
      counts.forEach((count, k) => {
        if (!count) return;
        const accountNumbers = Array.from({ length: count }, (_, i) => next + i);
        next += count;
        applications.push({ ipo: ipos[index], option: ipos[index].options[k], accounts: accountNumbers, atRisk: false });
      });
    }
  }
  applications.sort((a, b) => a.ipo.closeDay - b.ipo.closeDay || b.option.cost - a.option.cost);

  const blockedOn = (day: number, won?: Application) =>
    applications.reduce((sum, app) => {
      const held = app.ipo.closeDay <= day && day < (app === won ? app.ipo.cashDay : app.ipo.freeDay);
      return held ? sum + app.option.cost * (app === won ? 1 : app.accounts.length) : sum;
    }, 0);
  // At risk: one allotment on an earlier bid would leave too little money for this one.
  for (const app of applications) {
    app.atRisk = applications.some(
      (earlier) =>
        earlier.ipo.freeDay <= app.ipo.closeDay &&
        app.ipo.closeDay < earlier.ipo.cashDay &&
        blockedOn(app.ipo.closeDay) + earlier.option.cost > funds
    );
  }

  const planned = new Set(applications.map((app) => app.ipo.id));
  const missChance = applications.reduce((product, app) => product * (1 - app.option.odds) ** app.accounts.length, 1);
  return {
    applications,
    unused: ipos.filter((ipo) => !planned.has(ipo.id)),
    expectedGain: Math.round(applications.reduce((sum, app) => sum + app.accounts.length * app.option.odds * app.option.gain, 0)),
    expectedAllotments: applications.reduce((sum, app) => sum + app.accounts.length * app.option.odds, 0),
    chanceOfAny: 1 - missChance,
    peakBlocked: Math.max(0, ...groups.map((group) => blockedOn(group.close))),
  };
}
