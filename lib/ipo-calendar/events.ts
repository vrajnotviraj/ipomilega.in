import { parseIpoDate } from "@/lib/ipo-format";

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

const STEPS: { step: keyof IssueDates; label: string; note: string; hours?: [number, number] }[] = [
  { step: "opening", label: "IPO opens", note: "Bidding opens today." },
  { step: "closing", label: "IPO closes", note: "Last day to bid, until 3 PM. Approve the UPI mandate before the cut-off.", hours: [10, 15] },
  { step: "allotment", label: "IPO allotment", note: "Allotment is out today. Check if you got shares." },
  { step: "listing", label: "IPO lists", note: "Shares list on the exchange today." },
];

/** Turns an IPO's dates into calendar events, skipping any date that isn't known yet. */
export function issueEvents({ company, slug, url, dates }: { company: string; slug: string; url: string; dates: IssueDates }): CalendarEvent[] {
  return STEPS.flatMap(({ step, label, note, hours }) => {
    const date = parseIpoDate(dates[step]);
    if (!date) return [];
    return [{ step, uid: `${slug}-${step}@ipomilega.in`, label, title: `${company} ${label}`, details: `${note}\n${url}`, date, hours }];
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
