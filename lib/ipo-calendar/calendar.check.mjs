// Self-check: the calendar export. Run with: node lib/ipo-calendar/calendar.check.mjs
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// Resolves "@/..." and extensionless relative imports to .ts files, as the Next bundler does.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) specifier = new URL(`../../${specifier.slice(2)}.ts`, import.meta.url).href;
    return nextResolve(specifier, context);
  },
});

const { issueEvents } = await import("./events.ts");
const { googleCalendarUrl } = await import("./google.ts");
const { toIcs } = await import("./ics.ts");

const dates = { opening: "12 Oct 2026", closing: "14/10/2026", allotment: "TBA", listing: "2026-10-17" };
const events = issueEvents({ company: "Acme, Ltd", slug: "acme", url: "https://ipomilega.in/analysis/acme", dates });

assert.deepEqual(events.map((event) => event.step), ["opening", "closing", "listing"], "a date that doesn't parse gets no event");
assert.equal(events[0].title, "Acme, Ltd IPO opens");

const google = new URL(googleCalendarUrl(events[1]));
assert.equal(google.searchParams.get("action"), "TEMPLATE");
assert.equal(google.searchParams.get("dates"), "20261014T043000Z/20261014T093000Z", "close runs 10 AM to 3 PM IST, sent as UTC");
assert.equal(new URL(googleCalendarUrl(events[0])).searchParams.get("dates"), "20261012/20261013", "all-day, end date exclusive");
assert.equal(google.searchParams.get("text"), "Acme, Ltd IPO closes");

const ics = toIcs(events);
assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n") && ics.endsWith("END:VCALENDAR\r\n"), "CRLF line endings");
assert.equal(ics.match(/BEGIN:VEVENT/g).length, 3);
assert.match(ics, /DTSTART;VALUE=DATE:20261017\r\nDTEND;VALUE=DATE:20261018/, "all-day end is the next day");
assert.match(ics, /DTSTART:20261014T043000Z\r\nDTEND:20261014T093000Z/, "timed close in UTC");
assert.match(ics, /SUMMARY:Acme\\, Ltd IPO opens/, "commas escaped");
assert.match(ics, /DESCRIPTION:Bidding opens today\.\\nhttps:\/\/ipomilega\.in\/analysis\/acme\r\n/, "line breaks escaped");
assert.match(ics, /UID:acme-opening@ipomilega\.in/, "stable UID so a second import updates instead of duplicating");

console.log("ipo-calendar ok");
