"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * How the two Render services last ran, side by side on the admin page.
 *
 *   IPO scraper       ipo_milega_scrapper (branch render-run), twice a day
 *   Live subscription ipo-subscription-live, every 10 minutes in market hours
 *
 * Both reports come through /api/admin/services. Each card loads on its own because the
 * scraper sleeps between runs and can take close to a minute to wake; the live card
 * should not wait on it.
 */

const IST = "Asia/Kolkata";

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
    <Badge variant="outline" className={cn("font-mono text-[11px] uppercase tracking-wide", TONE[tone])}>
      {label}
    </Badge>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-mono text-foreground text-right min-w-0 break-words">{children}</span>
    </div>
  );
}

function Lines({ lines }: { lines: string[] }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-[11px] leading-5 text-foreground">
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
    <div className="mt-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-xs font-mono uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        {title}
      </button>
      {open && children}
    </div>
  );
}

const runTone = (status?: string): Tone =>
  status === "SUCCESS" ? "good" : status === "PARTIAL" || status === "RUNNING" ? "mid" : status ? "bad" : "muted";

function ScraperReport({ report }: { report: any }) {
  const current = report.current_run;
  const last = report.last_run;
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={report.state} tone={report.state === "RUNNING" ? "mid" : "muted"} />
        {last && <StatusBadge label={`last run ${last.status}`} tone={runTone(last.status)} />}
      </div>
      <div className="mt-3">
        <Row label="Next scheduled run">{report.next_run_ist} IST</Row>
        <Row label="Schedule">{report.schedule_ist} IST</Row>
        {last && <Row label="Last run">{last.started_ist} IST · took {last.took}</Row>}
      </div>

      {current && (
        <Collapsible title={`Running now · ${current.took} elapsed`} defaultOpen>
          <Lines lines={current.steps} />
        </Collapsible>
      )}
      {last && (
        <Collapsible title={`Last run steps · ${last.run_id}`} defaultOpen={!current}>
          <Lines lines={last.steps} />
          {last.error && <p className="mt-2 text-xs font-mono text-score-bad break-words">{last.error}</p>}
          {last.site_cache_refresh && (
            <p className="mt-1 text-xs font-mono text-score-mid">Site cache refresh: {last.site_cache_refresh}</p>
          )}
        </Collapsible>
      )}
      {Array.isArray(report.history) ? (
        <Collapsible title={`History · last ${report.history.length} runs`}>
          <Lines lines={report.history} />
        </Collapsible>
      ) : (
        <p className="mt-3 text-xs font-mono text-muted-foreground">{report.history}</p>
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
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={report.ok ? "healthy" : "stale"} tone={report.ok ? "good" : "bad"} />
        <StatusBadge label={report.in_active_window ? "market window" : "outside window"} tone="muted" />
        {report.scheduler?.running && <StatusBadge label="capturing" tone="mid" />}
        {report.database && <StatusBadge label={`db ${report.database}`} tone={report.database === "ok" ? "good" : "bad"} />}
      </div>
      <div className="mt-3">
        <Row label="Last capture">
          {formatIst(report.last_capture_at)}
          {since != null && ` · ${since} min ago`}
        </Row>
        <Row label="Schedule">{report.scheduler?.cron} ({report.scheduler?.timezone})</Row>
        <Row label="Runs since boot">{report.scheduler?.runs ?? "—"}</Row>
      </div>

      {last ? (
        <Collapsible title={`Last capture · ${last.source ?? "scheduled"}`} defaultOpen>
          <div className="mt-2 grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(["open", "inserted", "unchanged", "unmatched", "empty", "errors"] as const).map(key => (
              <div key={key} className="rounded-md border border-border p-2 text-center">
                <div className={cn(
                  "font-mono text-base font-semibold",
                  (key === "errors" || key === "unmatched") && last[key] > 0 ? "text-score-bad" : "text-foreground"
                )}>
                  {last[key] ?? "—"}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">{key}</div>
              </div>
            ))}
          </div>
          {sources.length > 0 && (
            <Lines lines={sources.map(([name, value]) =>
              `${name.padEnd(14)} ${typeof value === "object"
                ? Object.entries(value as object).filter(([k]) => k !== "source").map(([k, v]) => `${k}=${v}`).join(", ")
                : String(value)}`
            )} />
          )}
          {last.unmatched_names?.length > 0 && (
            <p className="mt-2 text-xs font-mono text-score-bad break-words">Unmatched: {last.unmatched_names.join(", ")}</p>
          )}
        </Collapsible>
      ) : (
        <p className="mt-3 text-xs font-mono text-muted-foreground">No capture since the service booted.</p>
      )}

      {gmp && gmp.enabled !== false && (
        <Collapsible title="GMP capture">
          <div className="mt-2">
            <Row label="Schedule">{gmp.cron}</Row>
            <Row label="Runs since boot">{gmp.runs}</Row>
            {gmp.last_run && (
              <Row label="Last run">
                {`seen=${gmp.last_run.seen} inserted=${gmp.last_run.inserted} unchanged=${gmp.last_run.unchanged} errors=${gmp.last_run.errors}`}
              </Row>
            )}
            {gmp.last_error && <p className="text-xs font-mono text-score-bad break-words">{gmp.last_error.message}</p>}
          </div>
        </Collapsible>
      )}
      {extra?.last_error && (
        <p className="mt-3 text-xs font-mono text-score-bad break-words">
          Last error ({formatIst(extra.last_error.at)}): {extra.last_error.message}
        </p>
      )}
    </>
  );
}

function ServiceCard({ service, title, subtitle }: { service: "scraper" | "live"; title: string; subtitle: string }) {
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
    <div className="border border-border rounded-lg bg-card p-5 min-w-0">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="font-serif font-semibold text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          aria-label={`Refresh ${title}`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-xs text-foreground/80 hover:bg-accent disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {loading && !data ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {service === "scraper" ? "Waking the scraper (up to a minute on a cold start)…" : "Loading…"}
        </div>
      ) : data && !data.success ? (
        <div className="py-2">
          <StatusBadge label="unreachable" tone="bad" />
          <p className="mt-2 text-sm text-score-bad break-words">{data.error}</p>
        </div>
      ) : data?.report ? (
        service === "scraper" ? <ScraperReport report={data.report} /> : <LiveReport report={data.report} extra={data.extra} />
      ) : null}

      {data && (
        <div className="mt-4 pt-3 border-t border-border text-[11px] font-mono text-muted-foreground flex flex-wrap justify-between gap-2">
          <span className="truncate">{data.url}</span>
          <span>checked {formatIst(data.fetched_at)} · {data.response_ms} ms</span>
        </div>
      )}
    </div>
  );
}

export default function ServiceStatus() {
  return (
    <section>
      <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2">Services</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ServiceCard service="scraper" title="IPO scraper" subtitle="ipowatch list, details, GMP, logos · twice a day" />
        <ServiceCard service="live" title="Live subscription" subtitle="NSE + ipowatch book · every 10 min in market hours" />
      </div>
    </section>
  );
}
