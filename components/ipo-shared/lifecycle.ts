import type { HomePageIpoProps } from "@/types/ipo-with-analysis";
import { daysFromToday, formatShortDate } from "@/lib/ipo-format";

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

/** "today", "tomorrow", "in 4 days", or the date itself when it is more than a week out. */
export function whenText(days: number, date: string): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days <= 7) return `in ${days} days`;
  return `on ${date}`;
}

const STEP_VERB: Record<StepName, { next: string; today: string; past: string }> = {
  Open: { next: "Opens", today: "Opens today", past: "Opened" },
  Close: { next: "Closes", today: "Closes today", past: "Closed" },
  Allot: { next: "Allotment", today: "Allotment today", past: "Allotted" },
  Demat: { next: "Shares in demat", today: "Shares in demat today", past: "Shares credited" },
  List: { next: "Lists", today: "Lists today", past: "Listed" },
};

/** One line for the timeline: the step due today, else the next dated step, else when it listed. */
export function lifecycleCaption(steps: Step[]): string {
  const today = steps.find((step) => step.state === "today");
  if (today) return STEP_VERB[today.name].today;

  const next = steps.find((step) => step.state === "future" && step.days !== null);
  if (next?.days != null) return `${STEP_VERB[next.name].next} ${whenText(next.days, next.date)}`;

  const last = steps.findLast((step) => step.state === "done");
  if (last) return `${STEP_VERB[last.name].past} ${last.date}`;
  return "Dates to be announced";
}
