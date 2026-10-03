import type { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis";
import { gainColor } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/analysis/primitives";
import type { FinancialHighlight } from "@/components/analysis/sections/financials/financial-figures";

type Fundamentals = IpoComprehensiveAnalysis["fundamentals"];

/** The latest year's figures as large mono tiles, each with its signed change on the year before. */
export function Highlights({ highlights, period, previousPeriod }: { highlights: FinancialHighlight[]; period: string; previousPeriod: string | null }) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <Eyebrow>
          Period ended <span className="font-mono tabular-nums">{period}</span>
        </Eyebrow>
        {previousPeriod && (
          <span className="text-xs text-muted-foreground">
            Change against <span className="font-mono tabular-nums">{previousPeriod}</span>
          </span>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {highlights.map((highlight) => (
          <HighlightTile key={highlight.label} highlight={highlight} />
        ))}
      </dl>
    </div>
  );
}

function HighlightTile({ highlight: { label, value, change, isLoss } }: { highlight: FinancialHighlight }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-4">
      <dt>
        <Eyebrow className="truncate">{label}</Eyebrow>
      </dt>
      <dd className={cn("mt-1.5 break-words font-mono text-lg font-medium tabular-nums sm:text-3xl", isLoss && "text-score-bad")}>{value}</dd>
      <dd className={cn("mt-1 font-mono text-sm tabular-nums", change ? gainColor(change.value) : "text-muted-foreground")}>
        {change ? change.text : "No prior year"}
      </dd>
    </div>
  );
}

/** A ratio from the feed, or null when it is missing or a placeholder. */
function ratioText(value: string | number | null | undefined, unit = ""): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text || ["n/a", "na", "-", "tba"].includes(text.toLowerCase())) return null;
  return `${text}${unit}`;
}

/**
 * The analysis ratios, then the listed valuation ratios, as a small mono list. Missing ones are left out,
 * and a valuation ratio the analysis already gives is not repeated.
 */
export function RatioList({ fundamentals, valuation }: { fundamentals: Fundamentals; valuation?: Record<string, string> }) {
  const ratios = [
    { label: "Return on equity", value: ratioText(fundamentals.financial_ratios?.return_on_equity) ?? ratioText(valuation?.roe) },
    { label: "Debt to equity", value: ratioText(fundamentals.assets_and_liabilities?.debt_to_equity_ratio) ?? ratioText(valuation?.debt_to_equity_ratio) },
    { label: "Current ratio", value: ratioText(fundamentals.financial_ratios?.current_ratio) },
    { label: "Revenue CAGR", value: ratioText(fundamentals.revenue_details?.revenue_cagr || null, "%") },
    { label: "ROCE", value: ratioText(valuation?.roce) },
    { label: "Return on net worth", value: ratioText(valuation?.return_on_net_worth_ronw) },
    { label: "NAV per share (₹)", value: ratioText(valuation?.net_asset_value_nav) },
    { label: "Price to book", value: ratioText(valuation?.price_to_book_value) },
  ].filter((ratio) => ratio.value);
  if (ratios.length === 0) return null;

  return (
    <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
      {ratios.map(({ label, value }) => (
        <div key={label} className="min-w-0">
          <dt>
            <Eyebrow>{label}</Eyebrow>
          </dt>
          <dd className="mt-0.5 break-words font-mono text-base font-medium tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
