const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

/** Starts PostHog web analytics: pageviews, pageleaves and referrers only. */
async function startAnalytics(projectToken: string) {
  const { default: posthog } = await import("posthog-js");
  posthog.init(projectToken, {
    // Proxied through next.config rewrites so ad blockers don't drop events.
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-05-30",
    disable_session_recording: true,
    autocapture: false,
    disable_surveys: true,
  });
}

// ponytail: loaded once the page is idle so its ~300 KB stays off the critical path; a visitor who leaves in the first second sends no pageview.
if (token) {
  const start = () => startAnalytics(token);
  if ("requestIdleCallback" in window) requestIdleCallback(start, { timeout: 4000 });
  else setTimeout(start, 2000);
}
