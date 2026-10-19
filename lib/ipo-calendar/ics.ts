import { eventTimes, utcStamp, type CalendarEvent } from "@/lib/ipo-calendar/events";

/** Escapes text for an .ics field: backslashes, semicolons, commas and line breaks. */
const escapeText = (text: string) => text.replace(/[\\;,]/g, (char) => `\\${char}`).replace(/\n/g, "\\n");

/** The lines of one event in an .ics file. */
function eventLines(event: CalendarEvent, stamp: string): string[] {
  const { allDay, start, end } = eventTimes(event);
  const valueType = allDay ? ";VALUE=DATE" : "";
  return [
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART${valueType}:${start}`,
    `DTEND${valueType}:${end}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.details)}`,
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
  ];
}

/**
 * An .ics file holding every event, which a phone calendar imports in one go.
 * shortcut: lines aren't folded at 75 octets; Apple, Google and Outlook accept long lines, fold if a strict client rejects it.
 */
export function toIcs(events: CalendarEvent[]): string {
  const stamp = utcStamp(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IPO Milega//IPO dates//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events.flatMap((event) => eventLines(event, stamp)),
    "END:VCALENDAR",
  ];
  return lines.map((line) => `${line}\r\n`).join("");
}
