import { ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { t } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/locales";
import { formatIpoDate, formatRupees, isPastFivePmIst } from "@/lib/ipo/format";
import { cn } from "@/lib/utils";
import type { BuyBeforeIpo, QuotaIpo } from "@/lib/queries/shareholder-quota";
import type { Dictionary } from "@/messages";

type Words = Dictionary["quota"]["card"];
type DateLine = { label: string; value: string } | null;

const rupees = (value: number) => `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** The date that goes with the stage: the bidding window, or when the DRHP was filed or approved. */
export function stageDate(ipo: QuotaIpo, d: Words): DateLine {
  if (ipo.stage === "dates" && ipo.openDate) {
    const close = formatIpoDate(ipo.closeDate);
    return { label: d.bidding, value: `${formatIpoDate(ipo.openDate)}${close ? ` – ${close}` : ""}` };
  }
  if (!ipo.drhpDate) return null;
  return { label: ipo.stage === "approved" ? d.approvedOn : d.filedOn, value: formatIpoDate(ipo.drhpDate, true) ?? "" };
}

/** The Buy before tile's note: bidding shut, the buying deadline, or what the stage means. Other tiles skip it: their stage heading says it. */
export function noteOf(ipo: BuyBeforeIpo, d: Words) {
  if (isPastFivePmIst(ipo.closeDate)) return d.closedNote;
  if (ipo.lastBuyClosed) return d.buyingClosedNote;
  if (ipo.lastBuyDate) return d.buyByNote;
  return d.stageNote[ipo.stage];
}

/**
 * One tile on the stage grid. It takes exactly four parts (head, date row, stage track, foot) and lays them on
 * rows it shares with the tiles beside it, so every tile in a row has the same height and its parts line up.
 * "go" is the Buy before tile, "quiet" the closed and listed ones.
 */
export function Tile({ tone, children }: { tone?: "go" | "quiet"; children: React.ReactNode }) {
  return (
    <li
      className={cn(
        "row-span-4 grid min-w-0 grid-rows-subgrid gap-y-3 rounded-xl p-4",
        tone === "quiet" ? "bg-secondary" : "border bg-card shadow-card",
        tone === "go" ? "border-2 border-primary" : "border-border"
      )}
    >
      {children}
    </li>
  );
}

/** The IPO's name, linked to its page here when we track it, and "Hold 1 share of <parent>" under it. `accent` underlines the parent in marigold. */
export function TileHead({ ipo, accent, children }: { ipo: QuotaIpo; accent?: boolean; children?: React.ReactNode }) {
  const { quota: { card: d }, common } = t();
  const [before, after] = d.holdShareOf.split("{parents}");
  return (
    <div className="min-w-0">
      <h3 className="font-display text-[17px] font-bold leading-snug tracking-[-0.015em] text-balance break-words text-foreground">
        {ipo.slug ? (
          <ProgressLink href={`/analysis/${ipo.slug}`} className="underline decoration-dotted decoration-primary/50 underline-offset-4 hover:decoration-solid">
            {ipo.name}
            <ArrowUpRight aria-hidden className="ml-0.5 -mt-0.5 inline-block size-[0.9em] align-middle text-primary/70" />
          </ProgressLink>
        ) : (
          ipo.name
        )}
      </h3>
      <p className="mt-1 text-[15px] text-pretty text-muted-foreground">
        {before}
        {ipo.parents.map((parent, index) => (
          <span key={parent}>
            {index > 0 && ` ${common.or} `}
            <span className={cn("font-medium text-foreground", accent && "highlight")}>{parent}</span>
          </span>
        ))}
        {after}
      </p>
      {children}
    </div>
  );
}

/** The hairline row: a label left and the date in mono right, or a line of words when there is no date. Always drawn, so the hairlines line up. */
export function DateRow({ date, text }: { date: DateLine; text?: string }) {
  return (
    <div className="flex min-w-0 justify-between gap-3 self-start border-t border-border pt-3 text-sm text-muted-foreground">
      {date ? (
        <>
          <span>{date.label}</span>
          <span className="whitespace-nowrap text-right font-mono font-medium tabular-nums text-foreground">{date.value}</span>
        </>
      ) : (
        <span className="text-pretty">{text}</span>
      )}
    </div>
  );
}

/** Text cut to a set number of lines on screen; the full text is in the tooltip, and screen readers get it once, uncut. */
export function Clamped({ text, lines, className }: { text: string; lines: "line-clamp-1" | "line-clamp-2"; className?: string }) {
  return (
    <p title={text} className={className}>
      <span aria-hidden className={lines}>{text}</span>
      <span className="sr-only">{text}</span>
    </p>
  );
}

/** The tile's last part, pinned to its foot: a muted note, the admin's note, the figures, then any links. */
export function Foot({ note, adminNote, children, links }: { note?: string; adminNote: string | null; children: React.ReactNode; links?: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-end gap-3">
      {note && <p className="text-sm text-pretty text-muted-foreground">{note}</p>}
      {adminNote && <p className="text-sm text-pretty text-foreground">{adminNote}</p>}
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 text-sm">{children}</dl>
      {links && <div className="flex flex-wrap gap-2">{links}</div>}
    </div>
  );
}

/** One label and its value in mono, with an optional aside under the value. */
export function Fact({ label, children, aside }: { label: string; children: React.ReactNode; aside?: string | null }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="whitespace-nowrap text-right">
        <span className="font-mono font-medium tabular-nums text-foreground">{children}</span>
        {aside && <span className="block text-xs text-muted-foreground">{aside}</span>}
      </dd>
    </>
  );
}

/** Each parent's closing share price with its day on one line, then the issue size and the shareholder quota when published. */
export function QuotaFacts({ ipo }: { ipo: QuotaIpo }) {
  const { quota: { card: d }, common } = t();
  const { issueSizeCr, quotaSizeCr, quotaPercent } = ipo;
  const share = quotaPercent !== null ? fill(d.quotaOfIssue, { percent: quotaPercent }) : null;
  return (
    <>
      {ipo.parentQuotes.map((quote) => (
        <Fact
          key={quote.name}
          label={fill(ipo.parentQuotes.length > 1 ? d.oneShareOf : d.oneShare, { name: quote.name, date: formatIpoDate(quote.asOf) ?? "" })}
        >
          {rupees(quote.price)}
        </Fact>
      ))}
      {issueSizeCr !== null && <Fact label={common.issueSize}>{formatRupees(issueSizeCr)} Cr</Fact>}
      {(quotaSizeCr !== null || share) && (
        <Fact label={d.shareholderQuota} aside={quotaSizeCr !== null ? share : null}>
          {quotaSizeCr !== null ? `${formatRupees(quotaSizeCr)} Cr` : share}
        </Fact>
      )}
    </>
  );
}

/** A link to a document on another site, opening in a new tab. */
export function OutLink({ href, icon: Icon, label, srText }: { href: string; icon: LucideIcon; label: string; srText: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="press inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-medium text-primary hover:bg-secondary motion-reduce:active:transform-none"
    >
      <Icon aria-hidden className="size-4" strokeWidth={2} />
      {label}
      <span className="sr-only"> {srText}</span>
    </a>
  );
}
