/** Records an Add to calendar click in PostHog. Clicks before PostHog loads aren't counted. */
export function trackCalendarClick(ipo: string, method: "ics" | "google", step?: string) {
  import("posthog-js")
    .then(({ default: posthog }) => posthog.capture("add_to_calendar", { ipo, method, step }))
    .catch(() => {});
}
