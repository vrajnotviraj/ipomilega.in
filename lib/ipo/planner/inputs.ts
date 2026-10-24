import type { Goal, Holders } from '@/lib/ipo/planner/plan';

export const MAX_FUNDS = 10_00_00_000;
export const MAX_ACCOUNTS = 10;
const GOALS: Goal[] = ['gain', 'allotments'];
const MAX_IPOS = 100;

/** What the reader chose: the IPOs in the plan, their money and accounts, and the accounts holding each IPO's parent shares. */
export type PlanInputs = { ids: string[]; funds: number; accounts: number; goal: Goal; holders: Holders };

const wholeNumber = (value: unknown, max: number): value is number => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= max;

/** The inputs in a request body, or null when anything is missing or out of range. */
export function parsePlanInputs(body: unknown): PlanInputs | null {
  const { ids, funds, accounts, goal, holders } = (body ?? {}) as Record<string, unknown>;
  const holderEntries = holders && typeof holders === 'object' ? Object.entries(holders) : null;

  if (!Array.isArray(ids) || ids.length > MAX_IPOS || !ids.every((id) => typeof id === 'string' && id.length <= 64)) return null;
  if (!wholeNumber(funds, MAX_FUNDS) || !wholeNumber(accounts, MAX_ACCOUNTS) || accounts < 1) return null;
  if (!GOALS.includes(goal as Goal)) return null;
  if (!holderEntries || !holderEntries.every(([id, count]) => id.length <= 64 && wholeNumber(count, MAX_ACCOUNTS))) return null;

  return { ids, funds, accounts, goal: goal as Goal, holders: holders as Holders };
}
