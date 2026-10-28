"use client";
import { useMemo, useRef, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { issueEvents, type CalendarEvent, type IssueDates } from "@/lib/ipo/calendar/events";
import { GoogleCalendarMenu } from "@/components/analysis/overview/add-to-calendar/GoogleCalendarMenu";
import { isPhone, openIcsFile } from "@/components/analysis/overview/add-to-calendar/phone";
import { trackCalendarClick } from "@/components/analysis/overview/add-to-calendar/track";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { useBrowserValue } from "@/lib/hooks/useBrowserValue";

/**
 * Adds the IPO's upcoming dates to the visitor's calendar.
 * Phones get every date in one .ics file; desktops get a menu of Google Calendar links.
 */
export function AddToCalendar({ company, dates, className }: { company: string; dates: IssueDates; className?: string }) {
  const { slug, events } = useUpcomingEvents(company, dates);
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const d = useT().analysis.calendar;

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
        {d.add}
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

const pageUrl = () => window.location.origin + window.location.pathname;
const startOfToday = () => new Date().setHours(0, 0, 0, 0);

/** The IPO's events from today on, plus its slug from the page URL. Read in the browser, since the page is cached. */
function useUpcomingEvents(company: string, dates: IssueDates): { slug: string; events: CalendarEvent[] } {
  const words = useT().analysis.calendar;
  const url = useBrowserValue(pageUrl);
  const today = useBrowserValue(startOfToday);

  return useMemo(() => {
    if (url === null || today === null) return { slug: "", events: [] };
    const slug = url.split("/").pop() || "ipo";
    const events = issueEvents({ company, slug, url, dates }, words).filter((event) => event.date.getTime() >= today);
    return { slug, events };
  }, [company, dates, words, url, today]);
}
