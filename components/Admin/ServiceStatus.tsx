"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * How the three Render services last ran, side by side on the admin page.
 *
 *   IPO scraper       ipo_milega_scrapper (branch render-run), twice a day
 *   Live subscription ipo-subscription-live, every 10 minutes in market hours
 *   RHP analysis      notebookAlternative (branch render-run), analysis + ID sync
 *
 * All reports come through /api/admin/services. Each card loads on its own because the
 * scraper and analysis services sleep between runs and can take close to a minute to
 * wake; the live card should not wait on them.
 */

const IST = "Asia/Kolkata";

type Service = "scraper" | "live" | "analysis";
type Tone = "good" | "mid" | "bad" | "muted";

const TONE: Record<Tone, string> = {
  good: "border-score-good/30 bg-score-good/10 text-score-good",
  mid: "border-score-mid/30 bg-score-mid/10 text-score-mid",
  bad: "border-score-bad/30 bg-score-bad/10 text-score-bad",
  muted: "text-muted-foreground",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type ProxyResponse = {
  success: boolean;
  url: string;
  response_ms: number;
  fetched_at: string;
  error?: string;
  report?: any;
  extra?: { gmp?: any; last_error?: any };
};

function formatIst(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: IST }).format(date);
}

function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <Badge variant="outline" className={cn("font-mono text-[10px] uppercase tracking-wide", TONE[tone])}>
      {label}
    </Badge>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-mono text-foreground text-right min-w-0 break-words">{children}</span>
    </div>
  );
}

function Tiles({ items }: { items: { label: string; value: unknown; bad?: boolean }[] }) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-1.5">
      {items.map(item => (
        <div key={item.label} className="rounded-md border border-border px-1 py-1.5 text-center">
          <div className={cn("font-mono text-sm font-semibold", item.bad ? "text-score-bad" : "text-foreground")}>
            {item.value == null ? "—" : String(item.value)}
          </div>
          <div className="text-[9px] font-mono uppercase tracking-wide text-muted-foreground truncate">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function Lines({ lines }: { lines: string[] }) {
  return (
    <pre className="mt-2 max-h-72 overflow-auto rounded-md border border-border bg-muted/40 p-2.5 font-mono text-[10px] leading-4 text-foreground">
      {lines.map((line, i) => {
        const tone = /\b(FAILED|INTERRUPTED)\b/.test(line)
          ? "text-score-bad"
          : /\b(SKIPPED|PARTIAL|RUNNING|NOT RUN)\b/.test(line)
            ? "text-score-mid"
            : undefined;
        return <div key={i} className={tone}>{line}</div>;
      })}
    </pre>
  );
}

function Collapsible({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {title}
      </button>
      {open && children}
    </div>
  );
}

function ErrorLine({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-[11px] font-mono text-score-bad break-words">{children}</p>;
}

const runTone = (status?: string): Tone =>
  status === "SUCCESS" || status === "OK" ? "good"
    : status === "PARTIAL" || status === "RUNNING" ? "mid"
      : status ? "bad" : "muted";

function ScraperReport({ report }: { report: any }) {
  const current = report.current_run;
  const last = report.last_run;
  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge label={report.state} tone={report.state === "RUNNING" ? "mid" : "muted"} />
        {last && <StatusBadge label={`last ${last.status}`} tone={runTone(last.status)} />}
      </div>
      <div className="mt-2.5">
        <Row label="Next run">{report.next_run_ist} IST</Row>
        {last && <Row label="Last run">{last.started_ist} · {last.took}</Row>}
        <Row label="Schedule">{report.schedule_ist} IST</Row>
      </div>
      {last?.error && <ErrorLine>{last.error}</ErrorLine>}
      {last?.site_cache_refresh && last.site_cache_refresh !== "skipped" && (
        <p className="mt-1 text-[11px] font-mono text-score-mid">Site cache refresh: {last.site_cache_refresh}</p>
      )}

      {current && (
        <Collapsible title={`Running now · ${current.took}`} defaultOpen>
          <Lines lines={current.steps} />
        </Collapsible>
      )}
      {last && (
        <Collapsible title="Last run steps">
          <Lines lines={last.steps} />
        </Collapsible>
      )}
      {Array.isArray(report.history) ? (
        <Collapsible title={`History · ${report.history.length} runs`}>
          <Lines lines={report.history} />
        </Collapsible>
      ) : (
        <p className="mt-2 text-[11px] font-mono text-muted-foreground">{report.history}</p>
      )}
    </>
  );
}

function LiveReport({ report, extra }: { report: any; extra?: ProxyResponse["extra"] }) {
  const last = report.last_result;
  const since = report.minutes_since_last_capture;
  const sources = last?.sources && typeof last.sources === "object" ? Object.entries(last.sources) : [];
  const gmp = extra?.gmp;
  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge label={report.ok ? "healthy" : "stale"} tone={report.ok ? "good" : "bad"} />
        <StatusBadge label={report.in_active_window ? "market window" : "outside window"} tone="muted" />
        {report.scheduler?.running && <StatusBadge label="capturing" tone="mid" />}
        {report.database && <StatusBadge label={`db ${report.database}`} tone={report.database === "ok" ? "good" : "bad"} />}
      </div>
      <div className="mt-2.5">
        <Row label="Last capture">
          {formatIst(report.last_capture_at)}
          {since != null && ` · ${since}m ago`}
        </Row>
        <Row label="Schedule">{report.scheduler?.cron}</Row>
        <Row label="Runs since boot">{report.scheduler?.runs ?? "—"}</Row>
      </div>

      {last ? (
        <>
          <Tiles items={(["open", "inserted", "unchanged", "unmatched", "empty", "errors"] as const).map(key => ({
            label: key,
            value: last[key],
            bad: (key === "errors" || key === "unmatched") && last[key] > 0,
          }))} />
          {last.unmatched_names?.length > 0 && <ErrorLine>Unmatched: {last.unmatched_names.join(", ")}</ErrorLine>}
          {sources.length > 0 && (
            <Collapsible title={`Sources · ${last.source ?? "scheduled"}`}>
              <Lines lines={sources.map(([name, value]) =>
                `${name.padEnd(14)} ${typeof value === "object"
                  ? Object.entries(value as object).filter(([k]) => k !== "source").map(([k, v]) => `${k}=${v}`).join(", ")
                  : String(value)}`
              )} />
            </Collapsible>
          )}
        </>
      ) : (
        <p className="mt-2 text-[11px] font-mono text-muted-foreground">No capture since the service booted.</p>
      )}

      {gmp && gmp.enabled !== false && (
        <Collapsible title="GMP capture">
          <div className="mt-1.5">
            <Row label="Schedule">{gmp.cron}</Row>
            <Row label="Runs since boot">{gmp.runs}</Row>
            {gmp.last_run && (
              <Row label="Last run">
                {`seen ${gmp.last_run.seen} · new ${gmp.last_run.inserted} · same ${gmp.last_run.unchanged} · err ${gmp.last_run.errors}`}
              </Row>
            )}
            {gmp.last_error && <ErrorLine>{gmp.last_error.message}</ErrorLine>}
          </div>
        </Collapsible>
      )}
      {extra?.last_error && (
        <ErrorLine>Last error ({formatIst(extra.last_error.at)}): {extra.last_error.message}</ErrorLine>
      )}
    </>
  );
}

// Older builds of the analysis service report history only as text lines:
//   "2026-09-25 13:21  OK          4m 05s  analysis-20260925-132152   {\"analysed\": 1}"
// Pull the latest finished run of each job out of them when `last_runs` is absent.
function lastRunsFromHistory(history: unknown): Record<string, any> {
  const out: Record<string, any> = {};
  if (!Array.isArray(history)) return out;
  for (const line of history as string[]) {
    const m = /^(\S+ \S+)\s+(\S+)\s+(.+?)\s+((analysis|sync)-\S+)\s+(.*)$/.exec(line);
    if (!m || m[2] === "RUNNING" || out[m[5]]) continue;
    let detail: any;
    try { detail = JSON.parse(m[6]); } catch { detail = undefined; }
    out[m[5]] = {
      run_id: m[4], status: m[2], started_ist: m[1], took: m[3].trim(),
      ...(detail && typeof detail === "object" ? { stats: detail } : typeof detail === "string" && detail ? { error: detail } : {}),
    };
  }
  return out;
}

function AnalysisReport({ report }: { report: any }) {
  const current = report.current_run;
  const lastRuns = report.last_runs ?? lastRunsFromHistory(report.history);
  const analysis = lastRuns.analysis;
  const sync = lastRuns.sync;
  const a = analysis?.stats ?? {};
  const s = sync?.stats ?? {};
  const running = typeof report.state === "string" && report.state.startsWith("RUNNING");
  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge label={report.state} tone={running ? "mid" : "muted"} />
        {analysis && <StatusBadge label={`analysis ${analysis.status}`} tone={runTone(analysis.status)} />}
        {sync && <StatusBadge label={`sync ${sync.status}`} tone={runTone(sync.status)} />}
      </div>
      <div className="mt-2.5">
        {current && <Row label="Running now">{current.run_id.split("-")[0]} · {current.elapsed}</Row>}
        <Row label="Next analysis">{report.next_ist?.analysis} IST</Row>
        <Row label="Next sync">{report.next_ist?.sync} IST</Row>
        {analysis && <Row label="Last analysis">{analysis.started_ist}{analysis.took && analysis.took !== "-" && ` · ${analysis.took}`}</Row>}
        {sync && (
          <Row label="Last sync">
            {sync.started_ist} · {s.updated ?? 0} updated{s.no_match_found ? ` · ${s.no_match_found} unmatched` : ""}
          </Row>
        )}
      </div>

      {analysis?.stats ? (
        <Tiles items={[
          { label: "analysed", value: a.analysed },
          { label: "degraded", value: a.degraded, bad: a.degraded > 0 },
          { label: "errors", value: a.errors, bad: a.errors > 0 },
          { label: "no pdf", value: a.skipped_no_pdf },
          { label: "unreachable", value: a.skipped_unreachable, bad: a.skipped_unreachable > 0 },
          { label: "thin pdf", value: a.skipped_thin_pdf, bad: a.skipped_thin_pdf > 0 },
        ]} />
      ) : !analysis && (
        <p className="mt-2 text-[11px] font-mono text-muted-foreground">No finished analysis run yet.</p>
      )}
      {analysis?.error && <ErrorLine>{analysis.error}</ErrorLine>}
      {sync?.error && <ErrorLine>Sync: {sync.error}</ErrorLine>}

      {Array.isArray(report.history) ? (
        <Collapsible title={`History · ${report.history.length} runs`}>
          <Lines lines={report.history} />
        </Collapsible>
      ) : (
        <p className="mt-2 text-[11px] font-mono text-muted-foreground">{report.history}</p>
      )}
    </>
  );
}

const SLEEPS: Record<Service, boolean> = { scraper: true, live: false, analysis: true };

function ServiceCard({ service, title, subtitle }: { service: Service; title: string; subtitle: string }) {
  const [data, setData] = useState<ProxyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/services?service=${service}`, { cache: "no-store" });
      setData(await res.json());
    } catch (error) {
      setData({ success: false, url: "", response_ms: 0, fetched_at: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Request failed" });
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col border border-border rounded-lg bg-card p-4 min-w-0">
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="min-w-0">
          <div className="font-serif font-semibold text-foreground leading-tight">{title}</div>
          <div className="text-[11px] text-muted-foreground truncate">{subtitle}</div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          aria-label={`Refresh ${title}`}
          title="Refresh"
          className="p-1.5 rounded-md border border-border text-foreground/70 hover:bg-accent disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1">
        {loading && !data ? (
          <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {SLEEPS[service] ? "Waking the service (up to a minute on a cold start)…" : "Loading…"}
          </div>
        ) : data && !data.success ? (
          <div>
            <StatusBadge label="unreachable" tone="bad" />
            <ErrorLine>{data.error}</ErrorLine>
          </div>
        ) : data?.report ? (
          service === "scraper" ? <ScraperReport report={data.report} />
            : service === "live" ? <LiveReport report={data.report} extra={data.extra} />
              : <AnalysisReport report={data.report} />
        ) : null}
      </div>

      {data && (
        <div
          className="mt-3 pt-2 border-t border-border text-[10px] font-mono text-muted-foreground flex justify-between gap-2"
          title={data.url}
        >
          <span className="truncate">{data.url.replace(/^https?:\/\//, "")}</span>
          <span className="shrink-0">{data.response_ms} ms</span>
        </div>
      )}
    </div>
  );
}

export default function ServiceStatus() {
  return (
    <section>
      <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2">Services</div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        <ServiceCard service="scraper" title="IPO scraper" subtitle="List, details, GMP, logos · twice a day" />
        <ServiceCard service="live" title="Live subscription" subtitle="NSE + ipowatch book · every 10 min" />
        <ServiceCard service="analysis" title="RHP analysis" subtitle="PDF → LLM analysis · ID sync" />
      </div>
    </section>
  );
}
