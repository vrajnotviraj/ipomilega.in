import { ArrowUpRight, FileText } from "lucide-react";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { Countdown } from "@/components/shareholder-quota/BuyBefore";
import { StageTrack } from "@/components/shareholder-quota/StageTrack";
import { t } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/locales";
import { formatIpoDate, formatRupees, isPastFivePmIst } from "@/lib/ipo/format";
import { cn } from "@/lib/utils";
import type { BuyBeforeIpo, QuotaIpo } from "@/lib/queries/shareholder-quota";
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

/** The note under the track: bidding shut, the buying deadline (Buy before), or what the stage means. */
function noteOf(ipo: QuotaIpo, buy: BuyBeforeIpo | null, d: Words) {
  if (isPastFivePmIst(ipo.closeDate)) return d.closedNote;
  if (buy?.lastBuyClosed) return d.buyingClosedNote;
  if (buy?.lastBuyDate) return d.buyByNote;
  return d.stageNote[ipo.stage];
}

/**
 * A parent to hold and the IPO it makes you eligible for. Buy before cards lead with the countdown; the rest with the
 * parent and the stage track. Highlighted cards are white with lift; the rest are flat.
 */
export function QuotaCard({ ipo, highlighted }: { ipo: QuotaIpo | BuyBeforeIpo; highlighted: boolean }) {
  const { quota: { card: d }, common } = t();
  const buy = "daysToLastBuy" in ipo ? ipo : null;
  const date = stageDate(ipo, d);
  const closed = isPastFivePmIst(ipo.closeDate);
  const divider = highlighted ? "border-border" : "border-primary/15";
  const heading = (
    <div className={cn(buy && cn("mt-4 border-t pt-4", divider))}>
      <p className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">{d.hold}</p>
      <h3 className="mt-1 font-display text-lg font-bold leading-tight tracking-[-0.015em] text-balance text-foreground sm:text-xl">
        {/* Marigold underline, not marigold text: the brand's emphasis style, as marigold text fails contrast on white. */}
        {ipo.parents.map((parent, index) => (
          <span key={parent}>
            {index > 0 && ` ${common.or} `}
            <span className="highlight">{parent}</span>
          </span>
        ))}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {d.forQuotaIn} <IpoName ipo={ipo} />
      </p>
    </div>
  );
  return (
    // Five rows (lead, heading or track, note, figures, footer) on the list's subgrid, so they line up across a row.
    <article
      className={cn(
        "row-span-5 grid grid-rows-subgrid gap-y-0 rounded-xl p-4 sm:p-5",
        highlighted ? "card-lift border border-border bg-card" : "bg-secondary"
      )}
    >
      {buy ? <Countdown ipo={buy} /> : heading}
      {buy ? heading : closed ? (
        // Bidding is over, so the stage track says nothing; the dates that decided eligibility take its place.
        <dl className={cn("mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t pt-4", divider)}>
          {ipo.lastBuyDate && <Figure label={d.lastDayWas}>{formatIpoDate(ipo.lastBuyDate, true)}</Figure>}
          {date && <Figure label={date.label}>{date.value}</Figure>}
          {ipo.priceBand && <Figure label={common.priceBand}>{ipo.priceBand}</Figure>}
          {ipo.listingDate && <Figure label={d.listedOn}>{formatIpoDate(ipo.listingDate, true)}</Figure>}
        </dl>
      ) : (
        <StageTrack stage={ipo.stage} className={cn("mt-4 border-t pt-4", divider)} />
      )}
      <div className="mt-4 text-sm text-pretty">
        <p className="text-muted-foreground">{noteOf(ipo, buy, d)}</p>
        {ipo.note && <p className="mt-2 text-foreground">{ipo.note}</p>}
      </div>

      {/* Always rendered, empty when nothing is published, so the row stays aligned across the cards. */}
      <div>
        <QuotaFigures ipo={ipo} />
      </div>

      <div className={cn("mt-4 flex flex-wrap items-end gap-x-6 gap-y-2 self-end border-t pt-3", divider)}>
        {!closed && (
          <dl className="flex flex-wrap gap-x-6 gap-y-2">
            {date && <Figure label={date.label}>{date.value}</Figure>}
            {ipo.stage === "dates" && ipo.priceBand && <Figure label={common.priceBand}>{ipo.priceBand}</Figure>}
          </dl>
        )}
        {ipo.documentUrl && <DocumentLink href={ipo.documentUrl} name={ipo.name} />}
      </div>
    </article>
  );
}

const rupees = (value: number) => `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** "1 share ≈ ₹X" per parent with the close it comes from, then issue size and shareholder allocation once published. */
export function QuotaFigures({ ipo }: { ipo: QuotaIpo }) {
  const { quota: { card: d }, common } = t();
  const { issueSizeCr, quotaSizeCr, quotaPercent } = ipo;
  const quota = [quotaSizeCr !== null && `${formatRupees(quotaSizeCr)} Cr`, quotaPercent !== null && fill(d.quotaOfIssue, { percent: quotaPercent })].filter(Boolean).join(" · ");
  if (!ipo.parentQuotes.length && issueSizeCr === null && !quota) return null;
  return (
    <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
      {ipo.parentQuotes.map((quote) => (
        <Figure key={quote.name} label={ipo.parentQuotes.length > 1 ? fill(d.oneShareOf, { name: quote.name }) : d.oneShare}>
          {rupees(quote.price)}
          <span className="ml-1.5 font-sans text-xs font-normal text-muted-foreground">{fill(d.priceOn, { date: formatIpoDate(quote.asOf) ?? "" })}</span>
        </Figure>
      ))}
      {issueSizeCr !== null && <Figure label={common.issueSize}>{formatRupees(issueSizeCr)} Cr</Figure>}
      {quota && <Figure label={d.shareholderQuota}>{quota}</Figure>}
    </dl>
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
