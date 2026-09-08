"use client";

import { Ipo } from "@/app/models/ipo";

/**
 * Admin-only view of live subscription state for one IPO.
 *
 * Written by the hourly job in the ipo_milega_scrapper repo. Two timestamps are
 * stored and they mean different things:
 *
 *   subscription_captured_at - the exchange's own "updated as on" time
 *   subscription_scraped_at  - when our job polled
 *
 * Freshness is judged on captured_at, because a delayed or retried job would
 * otherwise look fresher than the data actually is. When the job falls back to
 * ipowatch there is no exchange timestamp, so only the poll time exists and the
 * cell says so rather than implying a precision it does not have.
 */

const IST = "Asia/Kolkata";

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function relativeAge(from: Date): string {
  const minutes = Math.floor((Date.now() - from.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatIst(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: IST,
  }).format(date);
}

function multiple(value?: string): string | null {
  if (!value) return null;
  const parsed = parseFloat(String(value).replace(/[^\d.]/g, ""));
  return isNaN(parsed) ? null : `${parsed.toFixed(2)}x`;
}

export default function SubscriptionCell({ ipo }: { ipo: Ipo }) {
  const captured = parseDate(ipo.subscription_captured_at);
  const scraped = parseDate(ipo.subscription_scraped_at);
  // Prefer the exchange timestamp; fall back to poll time so the cell still
  // reports something useful when the ipowatch fallback produced this row.
  const freshness = captured ?? scraped;

  const total = multiple(ipo.total_sr);
  const qib = multiple(ipo.qib_sr);
  const nii = multiple(ipo.nii_sr);
  const rii = multiple(ipo.rii_sr);

  if (!total && !qib && !nii && !rii) {
    return <span className="font-mono text-xs text-muted-foreground">No data</span>;
  }

  // Anything older than two hours during a bidding window means the hourly job
  // is not landing. Surface that instead of showing a stale number as current.
  const ageMinutes = freshness ? (Date.now() - freshness.getTime()) / 60000 : null;
  const stale = ageMinutes !== null && ageMinutes > 120;

  const tooltip = [
    captured ? `Exchange updated: ${formatIst(captured)} IST` : "No exchange timestamp (ipowatch fallback)",
    scraped ? `Job polled: ${formatIst(scraped)} IST` : null,
    ipo.subscription_source ? `Source: ${ipo.subscription_source}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const retailChance = ipo.retail_allotment_probability;
  const provisional = ipo.subscription_is_provisional !== false;

  return (
    <div className="flex flex-col gap-1 font-mono text-[11px] min-w-[170px]" title={tooltip}>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-semibold text-foreground">{total ?? "—"}</span>
        <span className="uppercase tracking-wide text-muted-foreground">total</span>
      </div>

      <div className="text-muted-foreground">
        QIB {qib ?? "—"} · NII {nii ?? "—"} · RII {rii ?? "—"}
      </div>

      {typeof retailChance === "number" && (
        <div className="text-muted-foreground">
          Retail chance <span className="text-foreground">{retailChance}%</span>
          {provisional && (
            <span
              className="ml-1 text-amber-600"
              title="Bidding is still open. This is 'if bidding closed now' — the book will keep growing, so the real odds will be lower."
            >
              prov.
            </span>
          )}
        </div>
      )}

      {freshness ? (
        <div className={stale ? "text-amber-600" : "text-muted-foreground"}>
          {stale ? "⚠ " : ""}
          Updated {relativeAge(freshness)}
          {!captured && " (poll time)"}
        </div>
      ) : (
        <div className="text-muted-foreground">Never updated</div>
      )}
    </div>
  );
}
