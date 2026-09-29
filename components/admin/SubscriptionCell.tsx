"use client";

import { Ipo } from "@/types/ipo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import SubscriptionDetails from "@/components/admin/SubscriptionDetails";

const STALE_AFTER_MINUTES = 120;

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatIst(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Kolkata" }).format(date);
}

function multiple(value?: string): string | null {
  if (!value) return null;
  const parsed = parseFloat(String(value).replace(/[^\d.]/g, ""));
  return isNaN(parsed) ? null : `${parsed.toFixed(2)}x`;
}

/** Admin view of live subscription for one IPO: total inline, breakdown and freshness in a tooltip. */
export default function SubscriptionCell({ ipo }: { ipo: Ipo }) {
  const captured = parseDate(ipo.subscription_captured_at);
  const scraped = parseDate(ipo.subscription_scraped_at);
  // Judge freshness by the exchange time, not the poll time, so a delayed job never looks fresher than its data.
  const freshness = captured ?? scraped;

  const total = multiple(ipo.total_sr);
  const qib = multiple(ipo.qib_sr);
  const nii = multiple(ipo.nii_sr);
  const rii = multiple(ipo.rii_sr);

  if (!total && !qib && !nii && !rii) {
    return <span className="font-mono text-xs text-muted-foreground">No data</span>;
  }

  const stale = freshness !== null && (Date.now() - freshness.getTime()) / 60000 > STALE_AFTER_MINUTES;

  const exchangeTooltip = [
    captured ? `Exchange updated: ${formatIst(captured)} IST` : "No exchange timestamp (ipowatch fallback)",
    scraped && `Job polled: ${formatIst(scraped)} IST`,
    ipo.subscription_source && `Source: ${ipo.subscription_source}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-baseline gap-1.5 font-mono text-[11px] cursor-default w-fit" title={exchangeTooltip}>
          <span className="text-sm font-semibold text-foreground">{total ?? "—"}</span>
          <span className="uppercase tracking-wide text-muted-foreground">total</span>
          {stale && <span className="text-score-mid">⚠</span>}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">
        <SubscriptionDetails
          qib={qib}
          nii={nii}
          rii={rii}
          retailChance={ipo.retail_allotment_probability}
          provisional={ipo.subscription_is_provisional !== false}
          freshness={freshness}
          captured={!!captured}
          stale={stale}
        />
      </TooltipContent>
    </Tooltip>
  );
}
