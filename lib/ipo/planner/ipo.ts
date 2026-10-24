import type { Ipo } from '@/types/ipo';
import {
  ALLOTMENT_CATEGORIES,
  getAllotmentRatio,
  getIpoType,
  getMarketLotRows,
  parseEstListingPercent,
  parseGainValue,
  type AllotmentCategoryDef,
} from '@/lib/ipo/format';
import { addWorkingDays, dayOf } from '@/lib/ipo/planner/days';

export type Category = AllotmentCategoryDef['key'];

/** One minimum application in a category. */
export type BidOption = {
  category: Category;
  /** Rupees blocked by one application. */
  cost: number;
  /** Chance one application is allotted, 0 to 1. */
  odds: number;
  /** Rupees of shares one allotted application receives: all of `cost`, or less when a lottery winner gets only the minimum lot. */
  allotted: number;
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
  /** The listed companies whose shareholders may bid in the quota, or null when the IPO has none. */
  quotaParents: string[] | null;
  options: BidOption[];
};

export type SkipReason = 'noDates' | 'noGmp' | 'noGain' | 'noLot';

/** `gmpPercent` comes with `noGain`, so the reason can show the figure. */
export type SkippedIpo = { id: string; name: string; reason: SkipReason; gmpPercent?: number };

/**
 * Final subscription per GMP point for an issue of about `REFERENCE_ISSUE_CR`, from the medians of 77 listed IPOs.
 * shortcut: runs low for GMPs above 50%. B-HNI is 1.5x S-HNI and the shareholder quota matches retail, both guesses until the
 * engine has a history of those categories; replace them once it does.
 */
const SUBSCRIPTION_PER_GMP_POINT: Record<Category, number> = { retail: 1.2, shni: 4, bhni: 6, shareholder: 1.2 };

const REFERENCE_ISSUE_CR = 300;
/** Retail demand per GMP point falls with issue size: a fit on 24 listed IPOs (R² 0.35), applied to every category. */
const SIZE_EXPONENT = -0.35;

/** How much a bigger issue lowers the estimated subscription: 1 at the reference size, about 0.2 for Jio, capped at 2 for tiny issues. */
function sizeFactor(ipo: Ipo): number {
  const issueCr = parseGainValue(ipo.ipo_size);
  return issueCr ? Math.min(2, Math.max(0.2, (issueCr / REFERENCE_ISSUE_CR) ** SIZE_EXPONENT)) : 1;
}

/** The IPO as the planner sees it, or the reason it can't be planned. */
export function toPlannerIpo(id: string, ipo: Ipo, slug: string | null, quotaParents: string[] | null = null, today: number | null = null): PlannerIpo | SkippedIpo {
  const name = ipo.upcoming_ipo_2025 || ipo.ipo_name || 'IPO';
  const skip = (reason: SkipReason, gmpPercent?: number): SkippedIpo => ({ id, name, reason, gmpPercent });

  const closeDay = dayOf(ipo.ipo_dates?.ipo_close_date || ipo.closing_date);
  if (closeDay === null) return skip('noDates');

  const gmpPercent = parseEstListingPercent(ipo.gmp_price_gain);
  if (gmpPercent === null) return skip('noGmp');
  if (gmpPercent <= 0) return skip('noGain', gmpPercent);

  const quota = quotaParents ?? (parseGainValue(ipo.shareholder_sr) !== null ? [] : null);
  const options = bidOptions(ipo, gmpPercent, quota !== null, closeDay === today);
  if (!options.length) return skip('noLot');

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
    quotaParents: quota,
    options,
  };
}

export const isSkipped = (item: PlannerIpo | SkippedIpo): item is SkippedIpo => 'reason' in item;

/** The minimum application in each category the IPO offers. */
function bidOptions(ipo: Ipo, gmpPercent: number, hasQuota: boolean, lastDay: boolean): BidOption[] {
  return ALLOTMENT_CATEGORIES.filter((cat) => cat.key !== 'shareholder' || hasQuota).flatMap((cat) => {
    const cost = parseGainValue(getMarketLotRows(ipo.ipo_market_lot, cat.matchKeyword).min?.amount);
    return cost ? [bidOption(ipo, cat, cost, gmpPercent, lastDay)] : [];
  });
}

/**
 * Odds and value of one minimum application.
 * The subscription is the live figure on the last day, when most of the book is in. Before that it is the live figure or the GMP estimate,
 * whichever is higher, since a live figure only grows.
 *
 * Retail, S-HNI and shareholder winners get the whole application, so the odds are 1 in the subscription.
 * A B-HNI lottery winner gets only the S-HNI minimum, a `slot` share of the application, so the odds are 1 in subscription x slot.
 * Under that, nobody is drawn out: everyone gets their pro-rata share, which is never below the slot.
 */
function bidOption(ipo: Ipo, cat: AllotmentCategoryDef, cost: number, gmpPercent: number, lastDay: boolean): BidOption {
  const live = getAllotmentRatio(ipo, cat).subscription;
  const estimate = gmpPercent * SUBSCRIPTION_PER_GMP_POINT[cat.key] * sizeFactor(ipo);
  const useLive = lastDay && live !== null;
  const subscription = useLive ? Math.max(live, 1) : Math.max(live ?? 0, 1, estimate);
  const slot = cat.key === 'bhni' ? slotShare(ipo, cost) : 1;
  const allotted = Math.round(cost * Math.max(slot, 1 / subscription));
  return {
    category: cat.key,
    cost,
    odds: Math.min(1, 1 / (subscription * slot)),
    allotted,
    gain: Math.round((allotted * gmpPercent) / 100),
    estimated: !useLive && subscription > (live ?? 0),
  };
}

/** The share of a B-HNI application a lottery winner receives: the S-HNI minimum over the B-HNI minimum, about one fifth. */
function slotShare(ipo: Ipo, bhniCost: number): number {
  const slot = parseGainValue(getMarketLotRows(ipo.ipo_market_lot, 's[- ]?hni').min?.amount);
  return slot ? Math.min(1, slot / bhniCost) : 0.2;
}

/** The date's day number when it falls after the close; null for a missing or garbled date like "2026". */
function dayAfterClose(raw: string | undefined, closeDay: number): number | null {
  const day = dayOf(raw);
  return day !== null && day > closeDay ? day : null;
}
