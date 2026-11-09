import { ArrowUpRight, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { t } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/locales";
import { formatIpoDate, formatRupees, isPastFivePmIst } from "@/lib/ipo/format";
import { cn } from "@/lib/utils";
import type { BuyBeforeIpo, QuotaIpo } from "@/lib/queries/shareholder-quota";
import type { Dictionary } from "@/messages";

type Words = Dictionary["quota"]["card"];

/** The date that goes with the stage: the bidding window, or when the DRHP was filed or approved. */
export function stageDate(ipo: QuotaIpo, d: Words) {
  if (ipo.stage === "dates" && ipo.openDate) {
    const close = formatIpoDate(ipo.closeDate);
    return { label: d.bidding, value: `${formatIpoDate(ipo.openDate)}${close ? ` – ${close}` : ""}` };
  }
  if (!ipo.drhpDate) return null;
  return { label: ipo.stage === "approved" ? d.approvedOn : d.filedOn, value: formatIpoDate(ipo.drhpDate, true) };
}

/** The note for a card: bidding shut, the buying deadline, or what the stage means. */
function noteOf(ipo: QuotaIpo, buy: BuyBeforeIpo | null, d: Words) {
  if (isPastFivePmIst(ipo.closeDate)) return d.closedNote;
  if (buy?.lastBuyClosed) return d.buyingClosedNote;
  if (buy?.lastBuyDate) return d.buyByNote;
  return d.stageNote[ipo.stage];
}

/** The parent to hold as the heading, and the IPO it qualifies you for under it. `accent` adds the marigold underline. */
export function Heading({ ipo, accent }: { ipo: QuotaIpo; accent?: boolean }) {
  const { quota: { card: d }, common } = t();
  return (
    <div>
      <h3 className="font-display text-lg font-bold leading-tight tracking-[-0.015em] text-balance break-words text-foreground sm:text-xl">
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

/** The stage note, plus the admin's note when there is one. */
export function Notes({ ipo, buy }: { ipo: QuotaIpo; buy: BuyBeforeIpo | null }) {
  const d = t().quota.card;
  return (
    <div className="text-sm text-pretty">
      <p className="text-muted-foreground">{noteOf(ipo, buy, d)}</p>
      {ipo.note && <p className="mt-2 text-foreground">{ipo.note}</p>}
    </div>
  );
}

/** The stage's dates and the offer document link. */
export function Footer({ ipo, className }: { ipo: QuotaIpo; className?: string }) {
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
      {ipo.documentUrl && (
        <OutLink href={ipo.documentUrl} icon={FileText} label={d.offerDocument} srText={fill(d.documentFor, { name: ipo.name })} />
      )}
    </div>
  );
}

const rupees = (value: number) => `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** "1 share ≈ ₹X" for each parent, then the issue size and the shareholder allocation once published. */
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

/** A link to a document on another site, opening in a new tab. */
export function OutLink({ href, icon: Icon, label, srText }: { href: string; icon: LucideIcon; label: string; srText: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="ml-auto inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
      <Icon aria-hidden className="size-4" strokeWidth={2} />
      {label}
      <span className="sr-only"> {srText}</span>
    </a>
  );
}

/** A small grey aside after a figure. */
function Note({ children }: { children: React.ReactNode }) {
  return <span className="ml-1.5 font-sans text-xs font-normal text-muted-foreground">{children}</span>;
}

/** A labelled number. */
export function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-nowrap font-mono text-sm font-medium tabular-nums text-foreground">{children}</dd>
    </div>
  );
}
