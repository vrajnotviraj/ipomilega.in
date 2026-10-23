import type { Ipo } from '@/types/ipo';
import { ALLOTMENT_CATEGORIES, getAllotmentRatio, getIpoType, getMarketLotRows, parseEstListingPercent, parseGainValue } from '@/lib/ipo/format';
import { addWorkingDays, dayOf } from '@/lib/ipo/planner/days';

export type Category = 'retail' | 'shni';

/** One minimum application in a lottery category. */
export type BidOption = {
  category: Category;
  /** Rupees blocked by one application. */
  cost: number;
  /** Chance one application is allotted, 0 to 1. */
  odds: number;
  /** Rupees one allotted application gains at today's GMP. */
  gain: number;
  /** True while the odds come from the GMP rather than the live subscription. */
  estimated: boolean;
};

export type PlannerIpo = {
  id: string;
  name: string;
  slug: string | null;
  logo: string | null;
  board: string;
  gmpPercent: number;
  /** Last day to bid. */
  closeDay: number;
  /** First day the money of a bid that wasn't allotted can be used again: the refund date, when banks unblock it. */
  freeDay: number;
  /** First day the money of an allotted bid is back, after selling on listing day. */
  cashDay: number;
  options: BidOption[];
};

export type SkippedIpo = { id: string; name: string; reason: string };

/** Final subscription per GMP point, from the medians of 77 listed IPOs. ponytail: runs low for GMPs above 50%. */
const SUBSCRIPTION_PER_GMP_POINT: Record<Category, number> = { retail: 1.2, shni: 4 };

const LOTTERY_CATEGORIES = ALLOTMENT_CATEGORIES.filter((cat): cat is typeof cat & { key: Category } => cat.key !== 'bhni' && cat.key !== 'shareholder');

/** The IPO as the planner sees it, or the reason it can't be planned. */
export function toPlannerIpo(id: string, ipo: Ipo, slug: string | null): PlannerIpo | SkippedIpo {
  const name = ipo.upcoming_ipo_2025 || ipo.ipo_name || 'IPO';
  const skip = (reason: string): SkippedIpo => ({ id, name, reason });

  const closeDay = dayOf(ipo.ipo_dates?.ipo_close_date || ipo.closing_date);
  if (closeDay === null) return skip('Dates not announced yet');

  const gmpPercent = parseEstListingPercent(ipo.gmp_price_gain);
  if (gmpPercent === null) return skip('No GMP yet');
  if (gmpPercent <= 0) return skip(`GMP is ${gmpPercent}%, no listing gain expected`);

  const options = bidOptions(ipo, gmpPercent);
  if (!options.length) return skip('Lot size not out yet');

  return {
    id,
    name,
    slug,
    logo: ipo.image_url || null,
    board: getIpoType(ipo),
    gmpPercent,
    closeDay,
    freeDay: dayAfterClose(ipo.ipo_dates?.refunds, closeDay) ?? addWorkingDays(closeDay, 2),
    cashDay: addWorkingDays(dayAfterClose(ipo.ipo_dates?.ipo_listing_date, closeDay) ?? addWorkingDays(closeDay, 3), 1),
    options,
  };
}

export const isSkipped = (item: PlannerIpo | SkippedIpo): item is SkippedIpo => 'reason' in item;

/** Retail and S-HNI minimum applications. Odds use the live subscription or the GMP estimate, whichever is higher. */
function bidOptions(ipo: Ipo, gmpPercent: number): BidOption[] {
  return LOTTERY_CATEGORIES.flatMap((cat) => {
    const cost = parseGainValue(getMarketLotRows(ipo.ipo_market_lot, cat.matchKeyword).min?.amount);
    if (!cost) return [];

    const live = getAllotmentRatio(ipo, cat).lottery ?? 0;
    const fromGmp = Math.max(1, gmpPercent * SUBSCRIPTION_PER_GMP_POINT[cat.key]);
    const subscription = Math.max(live, fromGmp);
    return [{ category: cat.key, cost, odds: 1 / subscription, gain: Math.round((cost * gmpPercent) / 100), estimated: subscription > live }];
  });
}

/** The date's day number when it falls after the close; null for a missing or garbled date like "2026". */
function dayAfterClose(raw: string | undefined, closeDay: number): number | null {
  const day = dayOf(raw);
  return day !== null && day > closeDay ? day : null;
}
