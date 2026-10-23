import { eventTimes, type CalendarEvent } from "@/lib/ipo/calendar/events";

/** A link that opens Google Calendar with the event filled in. Google takes one event per link. */
export function googleCalendarUrl(event: CalendarEvent): string {
  const { start, end } = eventTimes(event);
  const params = new URLSearchParams({ action: "TEMPLATE", text: event.title, dates: `${start}/${end}`, details: event.details });
  return `https://calendar.google.com/calendar/render?${params}`;
}
