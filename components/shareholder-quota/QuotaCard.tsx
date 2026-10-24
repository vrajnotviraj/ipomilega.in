import { ArrowUpRight, FileText } from "lucide-react";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { StageTrack } from "@/components/shareholder-quota/StageTrack";
import { t } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/locales";
import { daysFromToday, formatIpoDate, isPastFivePmIst } from "@/lib/ipo/format";
import { cn } from "@/lib/utils";
import type { QuotaIpo } from "@/lib/queries/shareholder-quota";
import type { Dictionary } from "@/messages";

type Words = Dictionary["quota"]["card"];

/** The date that goes with the stage: the bidding window, or when the DRHP was filed or approved. */
function stageDate(ipo: QuotaIpo, d: Words) {
  if (ipo.stage === "dates" && ipo.openDate) {
    const close = formatIpoDate(ipo.closeDate);
    return { label: d.bidding, value: `${formatIpoDate(ipo.openDate)}${close ? ` – ${close}` : ""}` };
  }
  if (!ipo.drhpDate) return null;
  return { label: ipo.stage === "approved" ? d.approvedOn : d.filedOn, value: formatIpoDate(ipo.drhpDate, true) };
}

/** Whether the last day to buy the parent has passed (null when unknown): after it, buying no longer makes you eligible. */
const eligibilityClosed = (ipo: QuotaIpo) => {
  const days = daysFromToday(ipo.lastBuyDate);
  return days === null ? null : days < 0;
};

/** The note under the stage track: bidding shut, or the buying deadline passed, else what the stage means. */
function noteOf(ipo: QuotaIpo, d: Words) {
  if (isPastFivePmIst(ipo.closeDate)) return d.closedNote;
  if (eligibilityClosed(ipo)) return d.eligibilityClosedNote;
  if (ipo.lastBuyDate) return d.buyByNote;
  return d.stageNote[ipo.stage];
}

/** A parent to hold and the IPO it makes you eligible for. Highlighted cards are white with lift; the rest are flat. */
export function QuotaCard({ ipo, highlighted }: { ipo: QuotaIpo; highlighted: boolean }) {
  const { quota: { card: d }, common } = t();
  const date = stageDate(ipo, d);
  const closed = isPastFivePmIst(ipo.closeDate);
  const divider = highlighted ? "border-border" : "border-primary/15";
  return (
    // Four rows (heading, track, note, footer) on the list's subgrid, so they line up across the cards in a row.
    <article
      className={cn(
        "row-span-4 grid grid-rows-subgrid gap-y-0 rounded-xl p-4 sm:p-5",
        highlighted ? "card-lift border border-border bg-card" : "bg-secondary"
      )}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">{d.hold}</p>
        <h3 className="mt-1 font-display text-lg font-bold leading-tight tracking-[-0.015em] text-balance text-foreground sm:text-xl">
          {ipo.parents.join(` ${common.or} `)}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {d.forQuotaIn} <IpoName ipo={ipo} />
        </p>
      </div>

      {closed ? (
        // Bidding is over, so the stage track says nothing; the dates that decided eligibility take its place.
        <dl className={cn("mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t pt-4", divider)}>
          {ipo.lastBuyDate && <Figure label={d.lastDayWas}>{formatIpoDate(ipo.lastBuyDate, true)}</Figure>}
          {date && <Figure label={date.label}>{date.value}</Figure>}
          {ipo.priceBand && <Figure label={common.priceBand}>{ipo.priceBand}</Figure>}
        </dl>
      ) : (
        <StageTrack stage={ipo.stage} className={cn("mt-4 border-t pt-4", divider)} />
      )}
      <p className="mt-4 text-sm text-pretty text-muted-foreground">{noteOf(ipo, d)}</p>

      <div className={cn("mt-4 flex flex-wrap items-end gap-x-6 gap-y-2 self-end border-t pt-3", divider)}>
        {!closed && (
          <dl className="flex flex-wrap gap-x-6 gap-y-2">
            {ipo.lastBuyDate && <Figure label={eligibilityClosed(ipo) ? d.lastDayWas : d.lastDay}>{formatIpoDate(ipo.lastBuyDate, true)}</Figure>}
            {date && <Figure label={date.label}>{date.value}</Figure>}
            {ipo.stage === "dates" && ipo.priceBand && <Figure label={common.priceBand}>{ipo.priceBand}</Figure>}
          </dl>
        )}
        {ipo.documentUrl && <DocumentLink href={ipo.documentUrl} name={ipo.name} />}
      </div>
    </article>
  );
}

/** The IPO's name, linked to its page on this site when we track it. */
function IpoName({ ipo }: { ipo: QuotaIpo }) {
  if (!ipo.slug) return <span className="font-medium text-foreground">{ipo.name}</span>;
  return (
    <ProgressLink
      href={`/analysis/${ipo.slug}`}
      className="font-medium text-foreground underline decoration-dotted decoration-primary/50 underline-offset-4 transition-colors hover:decoration-solid"
    >
      {ipo.name}
      <ArrowUpRight aria-hidden className="ml-0.5 -mt-0.5 inline-block size-[0.9em] align-middle text-primary/70" />
    </ProgressLink>
  );
}

function DocumentLink({ href, name }: { href: string; name: string }) {
  const d = t().quota.card;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="ml-auto inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
      <FileText aria-hidden className="size-4" strokeWidth={2} />
      {d.offerDocument}
      <span className="sr-only"> {fill(d.documentFor, { name })}</span>
    </a>
  );
}

function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-nowrap font-mono text-sm font-medium tabular-nums text-foreground">{children}</dd>
    </div>
  );
}
