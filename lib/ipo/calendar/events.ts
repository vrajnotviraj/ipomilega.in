import { parseIpoDate } from "@/lib/ipo/format";

export type IssueDates = Record<"opening" | "closing" | "allotment" | "listing", string>;

/** One calendar entry. With `hours` (IST) it is a timed event, without it an all-day one. */
export type CalendarEvent = {
  step: keyof IssueDates;
  uid: string;
  label: string;
  title: string;
  details: string;
  date: Date;
  hours?: [number, number];
};

const STEPS = ["opening", "closing", "allotment", "listing"] as const;

/** Bidding closes at 3 PM, so the closing day is a 10 AM to 3 PM event; the rest are all-day. */
const hoursOf = (step: keyof IssueDates): [number, number] | undefined => (step === "closing" ? [10, 15] : undefined);

/** Each step's label and note in the reader's language: messages/<lang>/analysis.json, "calendar". */
export type CalendarWords = { steps: Record<keyof IssueDates, string>; notes: Record<keyof IssueDates, string> };

/** Turns an IPO's dates into calendar events, skipping any date that isn't known yet. */
export function issueEvents({ company, slug, url, dates }: { company: string; slug: string; url: string; dates: IssueDates }, words: CalendarWords): CalendarEvent[] {
  return STEPS.flatMap((step) => {
    const date = parseIpoDate(dates[step]);
    if (!date) return [];
    const label = words.steps[step];
    return [{ step, uid: `${slug}-${step}@ipomilega.in`, label, title: `${company} ${label}`, details: `${words.notes[step]}\n${url}`, date, hours: hoursOf(step) }];
  });
}

/** Formats a day as "20261014", optionally shifted by some days. */
function dayStamp(date: Date, addDays = 0): string {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate() + addDays);
  return `${day.getFullYear()}${String(day.getMonth() + 1).padStart(2, "0")}${String(day.getDate()).padStart(2, "0")}`;
}

/** Formats an instant in UTC as "20261014T093000Z". */
export const utcStamp = (instant: Date) => instant.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");

/** The event's start and end: whole days for all-day events, UTC times for timed ones. */
export function eventTimes({ date, hours }: CalendarEvent): { allDay: boolean; start: string; end: string } {
  if (!hours) return { allDay: true, start: dayStamp(date), end: dayStamp(date, 1) };

  // IST is UTC+5:30, so an IST hour is that hour minus 330 minutes in UTC.
  const istHour = (hour: number) => utcStamp(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hour, -330)));
  return { allDay: false, start: istHour(hours[0]), end: istHour(hours[1]) };
}
