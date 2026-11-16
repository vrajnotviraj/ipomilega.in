import { ArrowUpRight, FileText, type LucideIcon } from "lucide-react";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { t } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/locales";
import { formatIpoDate, formatRupees } from "@/lib/ipo/format";
import { cn } from "@/lib/utils";
import type { QuotaIpo } from "@/lib/queries/shareholder-quota";
import type { Dictionary } from "@/messages";

type Words = Dictionary["quota"]["card"];
export type DateLine = { label: string; value: string } | null;

/** Every tile has four rows: head, date row, stage track, foot. */
export const TILE_ROWS = 4;

const rupees = (value: number) => `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** The date for the IPO's stage: the bidding window, or when the draft was filed or approved. */
export function stageDate(ipo: QuotaIpo, d: Words): DateLine {
  if (ipo.stage === "dates" && ipo.openDate) {
    const close = formatIpoDate(ipo.closeDate);
    return { label: d.bidding, value: `${formatIpoDate(ipo.openDate)}${close ? ` – ${close}` : ""}` };
  }
  if (!ipo.drhpDate) return null;
  return { label: ipo.stage === "approved" ? d.approvedOn : d.filedOn, value: formatIpoDate(ipo.drhpDate, true) ?? "" };
}

/** A tile on the stage grid. Its four rows are shared with the tiles beside it, so their parts line up. "go" is the Buy before tile, "quiet" a closed one. */
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

/** The IPO name, linked to its analysis page when there is one, a document link, and "Hold 1 share of <parent>". */
export function TileHead({ ipo, accent, link, children }: { ipo: QuotaIpo; accent?: boolean; link?: React.ReactNode; children?: React.ReactNode }) {
  const { quota: { card: d }, common } = t();
  const [before, after] = d.holdShareOf.split("{parents}");
  return (
    <div className="min-w-0">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 font-display text-[17px] font-bold leading-snug tracking-[-0.015em] text-balance break-words text-foreground">
          {ipo.slug ? (
            <ProgressLink href={`/analysis/${ipo.slug}`} className="underline decoration-dotted decoration-primary/50 underline-offset-4 hover:decoration-solid">
              {ipo.name}
              <ArrowUpRight aria-hidden className="ml-0.5 -mt-0.5 inline-block size-[0.9em] align-middle text-primary/70" />
            </ProgressLink>
          ) : (
            ipo.name
          )}
        </h3>
        {link && <div className="-mr-2 -mt-2.5 shrink-0">{link}</div>}
      </div>
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

/** A hairline row with a label and a date, or a line of text when there is no date. */
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

/** The bottom of a tile: an optional note, the admin's note, then the figures. */
export function Foot({ note, adminNote, children }: { note?: string; adminNote: string | null; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-end gap-3">
      {note && <p className="text-sm text-pretty text-muted-foreground">{note}</p>}
      {adminNote && <p className="text-sm text-pretty text-foreground">{adminNote}</p>}
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 text-sm">{children}</dl>
    </div>
  );
}

/** A label and its value in mono, with an optional line under the value. */
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

/** Each parent's last closing price, the issue size and the quota size. */
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

/** A round icon link to a document on another site, opening in a new tab. */
export function OutLink({ href, icon: Icon, label, srText }: { href: string; icon: LucideIcon; label: string; srText: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      title={label}
      className="press inline-flex size-11 items-center justify-center rounded-full text-primary hover:bg-secondary motion-reduce:active:transform-none"
    >
      <Icon aria-hidden className="size-[18px]" strokeWidth={2} />
      <span className="sr-only">{label} {srText}</span>
    </a>
  );
}

/** The link to the IPO's offer document, or nothing when there is none. */
export function DocumentLink({ ipo }: { ipo: QuotaIpo }) {
  const d = t().quota.card;
  if (!ipo.documentUrl) return null;
  return <OutLink href={ipo.documentUrl} icon={FileText} label={d.offerDocument} srText={fill(d.documentFor, { name: ipo.name })} />;
}
