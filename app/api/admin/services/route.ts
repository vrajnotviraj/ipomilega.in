import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

// Proxies the Render services' public status reports so the browser needs no CORS and the status token stays server-side.
// The scraper and analysis services sleep between runs; waking one can take close to a minute.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SERVICES = {
  scraper: process.env.SCRAPER_SERVICE_URL || "https://ipo-milega-scrapper-1.onrender.com",
  live: process.env.LIVE_SERVICE_URL || "https://ipo-subscription-live-sm4f.onrender.com",
  analysis: process.env.ANALYSIS_SERVICE_URL || "https://notebookalternative.onrender.com",
} as const;

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(55_000) });
  const text = await res.text();
  try {
    return { httpStatus: res.status, body: JSON.parse(text) };
  } catch {
    // Render answers a suspended or not-yet-deployed service with an HTML page.
    if (/suspended/i.test(text)) throw new Error("service is suspended on Render");
    if (res.status === 404) throw new Error("no service at this URL (not deployed yet, or a different name on Render)");
    throw new Error(`HTTP ${res.status}, not JSON`);
  }
}

/** GMP runs and last error from the live service's token-protected /status, when the token is set. */
async function fetchLiveExtra(base: string) {
  const token = process.env.LIVE_SERVICE_TOKEN;
  if (!token) return undefined;
  try {
    const status = await fetchJson(`${base}/status`, { headers: { Authorization: `Bearer ${token}` } });
    if (status.httpStatus === 200) return { gmp: status.body.gmp, last_error: status.body.last_error };
  } catch {
    // Optional detail; the main report still stands.
  }
  return undefined;
}

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const name = request.nextUrl.searchParams.get("service") as keyof typeof SERVICES | null;
  if (!name || !(name in SERVICES)) {
    return NextResponse.json({ success: false, error: "service must be 'scraper', 'live' or 'analysis'" }, { status: 400 });
  }
  const base = SERVICES[name].replace(/\/$/, "");
  const started = Date.now();

  try {
    const { httpStatus, body } = await fetchJson(`${base}/`);
    const extra = name === "live" ? await fetchLiveExtra(base) : undefined;

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
