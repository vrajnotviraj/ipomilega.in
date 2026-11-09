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

/** The parent to hold, set as the heading, and the IPO it qualifies you for beneath it. */
function Heading({ ipo, accent }: { ipo: QuotaIpo; accent?: boolean }) {
  const { quota: { card: d }, common } = t();
  return (
    <div>
      <h3 className="font-display text-lg font-bold leading-tight tracking-[-0.015em] text-balance break-words text-foreground sm:text-xl">
        {/* Marigold underline only on the Buy before card: one marigold mark per region (DESIGN.md), and rows already carry the stage dot. */}
        {ipo.parents.map((parent, index) => (
          <span key={parent}>
            {index > 0 && ` ${common.or} `}
            <span className={cn(accent && "highlight")}>{parent}</span>
          </span>
        ))}
      </h3>
      <p className="mt-2 text-sm text-pretty text-muted-foreground">
        {d.forQuotaIn} <IpoName ipo={ipo} />
      </p>
    </div>
  );
}

/** The stage note, plus our own note when an admin left one. */
function Notes({ ipo, buy }: { ipo: QuotaIpo; buy: BuyBeforeIpo | null }) {
  const d = t().quota.card;
  return (
    <div className="text-sm text-pretty">
      <p className="text-muted-foreground">{noteOf(ipo, buy, d)}</p>
      {ipo.note && <p className="mt-2 text-foreground">{ipo.note}</p>}
    </div>
  );
}

/** The dates that go with the stage, and the offer document. */
function Footer({ ipo, className }: { ipo: QuotaIpo; className?: string }) {
  const { quota: { card: d }, common } = t();
  const date = stageDate(ipo, d);
  const closed = isPastFivePmIst(ipo.closeDate);
  if (closed && !ipo.documentUrl) return null;
  return (
    <div className={cn("flex flex-wrap items-end gap-x-6 gap-y-2", className)}>
      {!closed && (
        <dl className="flex flex-wrap gap-x-6 gap-y-2">
          {date && <Figure label={date.label}>{date.value}</Figure>}
          {ipo.stage === "dates" && ipo.priceBand && <Figure label={common.priceBand}>{ipo.priceBand}</Figure>}
        </dl>
      )}
      {ipo.documentUrl && <DocumentLink href={ipo.documentUrl} name={ipo.name} />}
    </div>
  );
}

/** A Buy before deadline: the countdown set large, then the parent, the note, the figures and the dates. */
export function QuotaCard({ ipo }: { ipo: BuyBeforeIpo }) {
  return (
    <article className="card-lift rounded-[18px] border border-border bg-card p-5 sm:p-8">
      <Countdown ipo={ipo} />
      <div className="mt-8 border-t border-border pt-8">
        <Heading ipo={ipo} accent />
      </div>
      <div className="mt-4">
        <Notes ipo={ipo} buy={ipo} />
      </div>
      <QuotaFigures ipo={ipo} />
      <Footer ipo={ipo} className="mt-4 border-t border-border pt-3" />
    </article>
  );
}

/**
 * Every other stage, as one full-width row: the parent and the note on the left; the stage track (or, once bidding has
 * shut, the dates that decided eligibility), the figures and the dates on the right.
 */
export function QuotaRow({ ipo }: { ipo: QuotaIpo }) {
  const { quota: { card: d }, common } = t();
  const date = stageDate(ipo, d);
  const closed = isPastFivePmIst(ipo.closeDate);
  return (
    <article className="grid gap-x-8 gap-y-5 py-6 sm:grid-cols-2 sm:py-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,5fr)_auto]">
      <div className="min-w-0">
        <Heading ipo={ipo} />
        <div className="mt-3">
          <Notes ipo={ipo} buy={null} />
        </div>
      </div>
      <div className="min-w-0">
        {closed ? (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
            {ipo.lastBuyDate && <Figure label={d.lastDayWas}>{formatIpoDate(ipo.lastBuyDate, true)}</Figure>}
            {date && <Figure label={date.label}>{date.value}</Figure>}
            {ipo.priceBand && <Figure label={common.priceBand}>{ipo.priceBand}</Figure>}
            {ipo.listingDate && <Figure label={d.listedOn}>{formatIpoDate(ipo.listingDate, true)}</Figure>}
          </dl>
        ) : (
          <StageTrack stage={ipo.stage} />
        )}
        <QuotaFigures ipo={ipo} />
      </div>
      {/* Dates and the document in their own column, so a short row still reaches the right edge. */}
      <Footer ipo={ipo} className="min-w-0 sm:col-span-2 lg:col-span-1 lg:flex-col lg:items-end lg:text-right" />
    </article>
  );
}

const rupees = (value: number) => `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** "1 share ≈ ₹X" per parent with the close it comes from, then issue size and shareholder allocation once published. */
export function QuotaFigures({ ipo }: { ipo: QuotaIpo }) {
  const { quota: { card: d }, common } = t();
  const { issueSizeCr, quotaSizeCr, quotaPercent } = ipo;
  const share = quotaPercent !== null ? fill(d.quotaOfIssue, { percent: quotaPercent }) : null;
  if (!ipo.parentQuotes.length && issueSizeCr === null && quotaSizeCr === null && !share) return null;
  return (
    <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
      {ipo.parentQuotes.map((quote) => (
        <Figure key={quote.name} label={ipo.parentQuotes.length > 1 ? fill(d.oneShareOf, { name: quote.name }) : d.oneShare}>
          {rupees(quote.price)}
          <Note>{fill(d.priceOn, { date: formatIpoDate(quote.asOf) ?? "" })}</Note>
        </Figure>
      ))}
      {issueSizeCr !== null && <Figure label={common.issueSize}>{formatRupees(issueSizeCr)} Cr</Figure>}
      {(quotaSizeCr !== null || share) && (
        <Figure label={d.shareholderQuota}>
          {quotaSizeCr !== null ? `${formatRupees(quotaSizeCr)} Cr` : share}
          {quotaSizeCr !== null && share && <Note>{share}</Note>}
        </Figure>
      )}
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

/** A quiet aside after a figure: the close a price comes from, or the quota's share of the issue. */
function Note({ children }: { children: React.ReactNode }) {
  return <span className="ml-1.5 font-sans text-xs font-normal text-muted-foreground">{children}</span>;
}

function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-nowrap font-mono text-sm font-medium tabular-nums text-foreground">{children}</dd>
    </div>
  );
}
