import posthog from "posthog-js";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
if (token) {
  posthog.init(token, {
    // Proxied through next.config rewrites so ad blockers don't drop events.
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-05-30",
    // Web analytics only: pageviews, pageleaves and referrers. No replay, click autocapture or surveys.
    disable_session_recording: true,
    autocapture: false,
    disable_surveys: true,
  });
}
