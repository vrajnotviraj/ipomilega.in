import { toIcs } from "@/lib/ipo-calendar/ics";
import type { CalendarEvent } from "@/lib/ipo-calendar/events";

/** True on iPhone and iPad. iPadOS reports itself as a Mac, so a touch screen gives it away. */
export const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

/** True on iOS and Android phones and tablets. */
export const isPhone = () => isIos() || /Android/.test(navigator.userAgent);

/** Hands the events to the device calendar as an .ics file. iOS opens Calendar's "Add all" sheet; others download it. */
export function openIcsFile(events: CalendarEvent[], filename: string) {
  const url = URL.createObjectURL(new Blob([toIcs(events)], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  // On iOS a `download` link saves to Files and skips Calendar.
  if (!isIos()) link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
