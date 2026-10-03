import { IpoLogo } from "@/components/ipo-shared/IpoLogo";
import { IpoTitleLink } from "@/components/ipo-shared/IpoTitleLink";
import { LiveLabel } from "@/components/ui/LiveLabel";
import { formatGmp, gainColor, parseEstListingPercent, parseGainValue, scoreOf } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";
import { ScorePill } from "@/components/ipos/ScorePill";
import { Row, daysToCloseOf, hasAnalysis, subscribedText } from "@/components/ipos/rows";

const MAX_CARDS = 6;

/** Surface panel of the IPOs closing soonest, the rest are in the table below. Scrolls sideways on phones. */
export function OpenNowStrip({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return null;
  const byClosing = [...rows].sort((a, b) => (daysToCloseOf(a) ?? Infinity) - (daysToCloseOf(b) ?? Infinity));
  const shown = byClosing.slice(0, MAX_CARDS);
  const hiddenCount = rows.length - shown.length;

  return (
    <section aria-labelledby="open-now-title" className="rounded-[18px] bg-secondary p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <h2 id="open-now-title" className="font-display text-xl font-bold tracking-[-0.015em] text-foreground">Open now</h2>
        <LiveLabel />
        {hiddenCount > 0 && (
          <p className="ml-auto text-sm text-muted-foreground">
            <span className="font-mono tabular-nums">{hiddenCount}</span> more in the table below
          </p>
        )}
      </div>
      <ul className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3">
        {shown.map((row) => (
          <li key={row._id} className="w-[280px] shrink-0 snap-start sm:w-auto">
            <OpenCard row={row} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Compact card: company, score, then time left, GMP and subscription as large figures. */
function OpenCard({ row }: { row: Row }) {
  const gmp = parseEstListingPercent(row.ipo?.gmp_price_gain);
  const score = scoreOf(row);
  return (
    <article className="card-lift flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <IpoLogo src={row.ipo?.image_url} name={row.ipo?.upcoming_ipo_2025} />
        <h3 className="min-w-0 flex-1 font-display font-bold leading-tight tracking-[-0.015em] text-foreground">
          <IpoTitleLink ipo={row.ipo} hasAnalysis={hasAnalysis(row)} />
        </h3>
        <ScorePill value={score} />
      </div>
      <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-3">
        <BigFigure label="Closes"><ClosesValue days={daysToCloseOf(row)} /></BigFigure>
        <BigFigure label="GMP" className={gainColor(gmp)}>{formatGmp(gmp)}</BigFigure>
        <BigFigure label="Subscribed">{subscribedText(parseGainValue(row.ipo?.total_sr))}</BigFigure>
      </dl>
    </article>
  );
}

/** Days left to bid, in the loss colour when it closes today. */
function ClosesValue({ days }: { days: number | null }) {
  if (days === 0) return <span className="text-score-bad">Today</span>;
  if (days === null) return <>TBA</>;
  if (days === 1) return <>1 day</>;
  return <>{days} days</>;
}

function BigFigure({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("mt-1 whitespace-nowrap font-mono text-base font-medium leading-none tabular-nums text-foreground sm:text-lg", className)}>{children}</dd>
    </div>
  );
}
