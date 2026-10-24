"use client";
import { useEffect, type RefObject } from "react";
import { googleCalendarUrl } from "@/lib/ipo/calendar/google";
import type { CalendarEvent } from "@/lib/ipo/calendar/events";
import { useT } from "@/lib/i18n/client";

/** The desktop dropdown: one Google Calendar link per date, then all dates as an .ics file. */
export function GoogleCalendarMenu({ events, containerRef, onGoogleClick, onIcsClick, onClose }: {
  events: CalendarEvent[];
  containerRef: RefObject<HTMLElement | null>;
  onGoogleClick: (event: CalendarEvent) => void;
  onIcsClick: () => void;
  onClose: () => void;
}) {
  useCloseOnOutsideClick(containerRef, onClose);
  const d = useT().analysis.calendar;

  return (
    <ul className="absolute right-0 top-full z-10 mt-2 w-64 rounded-xl border border-border bg-popover p-1.5 text-sm shadow-[0_8px_24px_rgb(15_59_46/0.12)]">
      {events.map((event) => (
        <li key={event.step}>
          <a
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onGoogleClick(event)}
            className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-secondary"
          >
            <span className="truncate">{d.steps[event.step]}</span>
            <span className="shrink-0 text-xs text-muted-foreground">Google</span>
          </a>
        </li>
      ))}
      <li className="mt-1 border-t border-border pt-1">
        <button type="button" onClick={onIcsClick} className="w-full rounded-lg px-3 py-2 text-left hover:bg-secondary">
          {d.allDatesIcs} <span className="text-xs text-muted-foreground">(Apple, Outlook)</span>
        </button>
      </li>
    </ul>
  );
}

/** Calls `onClose` on Escape or on a click outside `containerRef`. */
function useCloseOnOutsideClick(containerRef: RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [containerRef, onClose]);
}
