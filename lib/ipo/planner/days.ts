import { DAY_MS, dayNumberInIndia, parseIpoDate } from '@/lib/ipo/format';

/** The planner counts time in whole days (see dayNumberInIndia), so a date is a plain number. */

/** The day number of a loose IPO date, or null when there is no date. */
export function dayOf(raw: string | undefined): number | null {
  const date = parseIpoDate(raw);
  return date ? dayNumberInIndia(date) : null;
}

export const dateOf = (day: number) => new Date(day * DAY_MS);

const isWeekend = (day: number) => [0, 6].includes(dateOf(day).getUTCDay());

/** The day `count` working days after `day`. ponytail: skips weekends only, not exchange holidays. */
export function addWorkingDays(day: number, count: number): number {
  let next = day;
  for (let left = count; left > 0; ) if (!isWeekend(++next)) left--;
  return next;
}

/** "Mon 19 Oct". */
export const formatDay = (day: number) =>
  dateOf(day).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
