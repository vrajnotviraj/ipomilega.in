"use client";
import { useEffect, useRef, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { issueEvents, type CalendarEvent, type IssueDates } from "@/lib/ipo-calendar/events";
import { GoogleCalendarMenu } from "@/components/analysis/overview/add-to-calendar/GoogleCalendarMenu";
import { isPhone, openIcsFile } from "@/components/analysis/overview/add-to-calendar/phone";
import { trackCalendarClick } from "@/components/analysis/overview/add-to-calendar/track";
import { cn } from "@/lib/utils";

/**
 * Adds the IPO's upcoming dates to the visitor's calendar.
 * Phones get every date in one .ics file; desktops get a menu of Google Calendar links.
 */
export function AddToCalendar({ company, dates, className }: { company: string; dates: IssueDates; className?: string }) {
  const { slug, events } = useUpcomingEvents(company, dates);
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (events.length === 0) return null;

  function saveIcsFile() {
    trackCalendarClick(slug, "ics");
    openIcsFile(events, `${slug}-dates.ics`);
    setMenuOpen(false);
  }

  function onButtonClick() {
    if (isPhone()) saveIcsFile();
    else setMenuOpen((open) => !open);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={onButtonClick}
        aria-expanded={menuOpen}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm sm:w-auto sm:px-3.5 sm:py-1.5 font-medium text-foreground hover:bg-secondary press"
      >
        <CalendarPlus className="size-4" strokeWidth={2} aria-hidden="true" />
        Add to calendar
      </button>
      {menuOpen && (
        <GoogleCalendarMenu
          events={events}
          containerRef={containerRef}
          onGoogleClick={(event) => trackCalendarClick(slug, "google", event.step)}
          onIcsClick={saveIcsFile}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}

/** The IPO's events from today on, plus its slug from the page URL. Built after mount, since the page is cached. */
function useUpcomingEvents(company: string, dates: IssueDates) {
  const [state, setState] = useState<{ slug: string; events: CalendarEvent[] }>({ slug: "", events: [] });

  useEffect(() => {
    const url = window.location.origin + window.location.pathname;
    const slug = window.location.pathname.split("/").pop() || "ipo";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const events = issueEvents({ company, slug, url, dates }).filter((event) => event.date >= today);
    setState({ slug, events });
  }, [company, dates]);

  return state;
}
