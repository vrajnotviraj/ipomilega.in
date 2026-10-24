import type { HomePageIpoProps } from "@/types/ipo-with-analysis";
import { daysFromToday, formatShortDate } from "@/lib/ipo/format";

export type StepName = "Open" | "Close" | "Allot" | "Demat" | "List";
export type StepState = "done" | "today" | "future";
/** One lifecycle date. days is whole days from today (0 today, negative passed), null when unknown. */
export type Step = { name: StepName; date: string; days: number | null; state: StepState };

/** future until its day, done once passed; on the day itself only the last step due today is "today". */
function stepState(day: number | null, isLastDueToday: boolean): StepState {
  if (day === null || day > 0) return "future";
  if (day < 0) return "done";
  return isLastDueToday ? "today" : "done";
}

/** Open, close, allotment and listing dates. */
export function ipoLifecycleSteps(item: HomePageIpoProps): Step[] {
  const dates = item.ipo?.ipo_dates;
  return stepsOf([
    ["Open", dates?.ipo_open_date || item.ipo?.open_date],
    ["Close", dates?.ipo_close_date || item.ipo?.closing_date],
    ["Allot", dates?.basis_of_allotment],
    ["List", dates?.ipo_listing_date],
  ]);
}

/** What happens after bidding closes: allotment, shares in demat, and listing. */
export function afterCloseSteps(ipo: HomePageIpoProps["ipo"] | null): Step[] {
  const dates = ipo?.ipo_dates;
  return stepsOf([
    ["Allot", dates?.basis_of_allotment],
    ["Demat", dates?.credit_to_demat_account],
    ["List", dates?.ipo_listing_date],
  ]);
}

/** Dated steps in order. Only the last step due today is "today"; earlier ones count as done. */
function stepsOf(raw: [StepName, string | undefined][]): Step[] {
  const days = raw.map(([, date]) => daysFromToday(date));
  const todayIndex = days.lastIndexOf(0);

  return raw.map(([name, date], index) => ({
    name,
    date: formatShortDate(date),
    days: days[index],
    state: stepState(days[index], index === todayIndex),
  }));
}

/** When a step happens, for the component showing it to word: today, tomorrow, within a week (or with no date), or on the date itself. */
export type When = { kind: "today" | "tomorrow" | "inDays" | "onDate"; days: number; date: string };

export const whenOf = (days: number, date = ""): When => ({
  kind: days === 0 ? "today" : days === 1 ? "tomorrow" : days <= 7 || !date ? "inDays" : "onDate",
  days,
  date,
});

/** The step a timeline is on: due today, else the next dated one, else the last one done. */
export type Caption =
  | { tense: "today"; name: StepName }
  | { tense: "next"; name: StepName; when: When }
  | { tense: "past"; name: StepName; date: string };

/** Null when no date is known yet. */
export function lifecycleCaption(steps: Step[]): Caption | null {
  const today = steps.find((step) => step.state === "today");
  if (today) return { tense: "today", name: today.name };

  const next = steps.find((step) => step.state === "future" && step.days !== null);
  if (next?.days != null) return { tense: "next", name: next.name, when: whenOf(next.days, next.date) };

  const last = steps.findLast((step) => step.state === "done");
  return last ? { tense: "past", name: last.name, date: last.date } : null;
}
