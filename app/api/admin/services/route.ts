import { NextRequest, NextResponse } from "next/server";

// Proxies the three Render services' status reports to the admin panel. Server-side so the
// browser needs no CORS allowance and the optional status token never reaches the client.
//
// Both `/` routes are public on the services themselves, so this exposes nothing new.
// The scraper and analysis services sleep between runs on Render's free plan; the first request wakes it,
// which can take close to a minute, hence the long timeout.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SERVICES = {
  scraper: process.env.SCRAPER_SERVICE_URL || "https://ipo-milega-scrapper-1.onrender.com",
  live: process.env.LIVE_SERVICE_URL || "https://ipo-subscription-live-sm4f.onrender.com",
  analysis: process.env.ANALYSIS_SERVICE_URL || "https://notebookalternative.onrender.com",
} as const;

type ServiceName = keyof typeof SERVICES;

const TIMEOUT_MS = 55_000;

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  const text = await res.text();
  try {
    return { httpStatus: res.status, body: JSON.parse(text) };
  } catch {
    // Render answers a suspended or not-yet-deployed service with an HTML page.
    const hint = /suspended/i.test(text)
      ? "service is suspended on Render"
      : res.status === 404
        ? "no service at this URL (not deployed yet, or a different name on Render)"
        : `HTTP ${res.status}, not JSON`;
    throw new Error(hint);
  }
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("service") as ServiceName | null;
  if (!name || !(name in SERVICES)) {
    return NextResponse.json({ success: false, error: "service must be 'scraper', 'live' or 'analysis'" }, { status: 400 });
  }
  const base = SERVICES[name].replace(/\/$/, "");
  const started = Date.now();

  try {
    const { httpStatus, body } = await fetchJson(`${base}/`);

    // The live service keeps GMP runs and error text behind its token-protected /status.
    // Pulled in only when the token is configured; the card works without it.
    let extra: Record<string, unknown> | undefined;
    const token = process.env.LIVE_SERVICE_TOKEN;
    if (name === "live" && token) {
      try {
        const status = await fetchJson(`${base}/status`, { headers: { Authorization: `Bearer ${token}` } });
        if (status.httpStatus === 200) {
          extra = { gmp: status.body.gmp, last_error: status.body.last_error };
        }
      } catch {
        // Optional detail; the main report still stands.
      }
    }

    return NextResponse.json({
      success: true,
      service: name,
      url: base,
      http_status: httpStatus,
      response_ms: Date.now() - started,
      fetched_at: new Date().toISOString(),
      report: body,
      ...(extra ? { extra } : {}),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json({
      success: false,
      service: name,
      url: base,
      response_ms: Date.now() - started,
      fetched_at: new Date().toISOString(),
      error: timedOut
        ? "No answer within 55s. A free instance may still be waking up; refresh in a minute."
        : error instanceof Error ? error.message : "Could not reach the service",
    });
  }
}
