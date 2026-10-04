import { ArrowUpRight, FileText } from "lucide-react";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { formatIpoDate } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";
import type { QuotaIpo, QuotaStage } from "@/lib/queries/shareholder-quota";

// The stage track runs from the weakest stage to the strongest.
const TRACK: { stage: QuotaStage; name: string }[] = [
  { stage: "announced", name: "Announced" },
  { stage: "filed", name: "DRHP filed" },
  { stage: "approved", name: "SEBI approved" },
  { stage: "dates", name: "Dates set" },
];

/** One sentence per stage: what it means for someone holding the parent. */
const STAGE_NOTE: Record<QuotaStage, string> = {
  dates: "The RHP is out, so the eligibility date may already have passed. Check the RHP before you buy the parent.",
  approved: "SEBI has cleared the draft. Dates usually follow within months. Hold the parent before the RHP date.",
  filed: "The draft offer document has a shareholder quota. It is waiting for SEBI's approval.",
  announced: "The quota comes from the company's announcement. There is no offer document yet, so it could still change.",
};

/** The fact that dates the stage: the bidding window, or when the DRHP reached its latest step. */
function stageFact(ipo: QuotaIpo): { label: string; value: string } | null {
  if (ipo.stage === "dates" && ipo.openDate) {
    const open = formatIpoDate(ipo.openDate);
    const close = formatIpoDate(ipo.closeDate);
    return { label: "Bidding", value: close ? `${open} – ${close}` : `Opens ${open}` };
  }
  if (!ipo.drhpDate) return null;
  return { label: ipo.stage === "approved" ? "Approved on" : "Filed on", value: formatIpoDate(ipo.drhpDate, true) ?? "" };
}

/**
 * A parent to hold and the child IPO it qualifies you for. Stages 1 and 2 (dates set, SEBI approved) are the highlighted
 * white card with lift; the rest are the flat surface card.
 */
export function QuotaCard({ ipo, highlighted }: { ipo: QuotaIpo; highlighted: boolean }) {
  const fact = stageFact(ipo);
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-xl p-4 sm:p-5",
        highlighted ? "card-lift border border-border bg-card" : "bg-secondary"
      )}
    >
      <p className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">Hold 1 share of</p>
      <h3 className="mt-1 font-display text-lg font-bold leading-tight tracking-[-0.015em] text-balance text-foreground sm:text-xl">
        {ipo.parents.join(" or ")}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        for the shareholder quota in{" "}
        {ipo.slug ? (
          <ProgressLink
            href={`/analysis/${ipo.slug}`}
            className="font-medium text-foreground underline decoration-dotted decoration-primary/50 underline-offset-4 transition-colors hover:decoration-solid"
          >
            {ipo.name}
            <ArrowUpRight aria-hidden className="ml-0.5 -mt-0.5 inline-block size-[0.9em] align-middle text-primary/70" />
          </ProgressLink>
        ) : (
          <span className="font-medium text-foreground">{ipo.name}</span>
        )}
      </p>

      <StageTrack stage={ipo.stage} className={cn("mt-4 border-t pt-4", highlighted ? "border-border" : "border-primary/15")} />

      <p className="mt-4 text-sm text-pretty text-muted-foreground">{STAGE_NOTE[ipo.stage]}</p>

      <div className={cn("mt-auto flex flex-wrap items-end gap-x-6 gap-y-2 border-t pt-3", highlighted ? "border-border" : "border-primary/15")}>
        <dl className="flex flex-wrap gap-x-6 gap-y-2">
          {fact && <Fact label={fact.label}>{fact.value}</Fact>}
          {ipo.stage === "dates" && ipo.priceBand && <Fact label="Price band">{ipo.priceBand}</Fact>}
        </dl>
        <a
          href={ipo.sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="ml-auto inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          <FileText aria-hidden className="size-4" strokeWidth={2} />
          Source
          <span className="sr-only"> for {ipo.name} (opens in a new tab)</span>
        </a>
      </div>
    </article>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-nowrap font-mono text-sm font-medium tabular-nums text-foreground">{children}</dd>
    </div>
  );
}

/** Announced → DRHP filed → SEBI approved → Dates set as dots on a line: reached is ink, the current stage marigold, the rest hollow. */
function StageTrack({ stage, className }: { stage: QuotaStage; className?: string }) {
  const current = TRACK.findIndex((step) => step.stage === stage);
  return (
    <ol aria-label={`Stage: ${TRACK[current].name}, step ${current + 1} of ${TRACK.length}`} className={cn("grid grid-cols-4", className)}>
      {TRACK.map((step, index) => (
        <li key={step.stage} className="relative flex flex-col items-center text-center">
          {index < TRACK.length - 1 && (
            <span aria-hidden className={cn("absolute left-1/2 top-1 h-px w-full", index < current ? "grow-in bg-primary" : "bg-border")} />
          )}
          <span
            aria-hidden
            className={cn(
              "relative size-[9px] rounded-full",
              index < current && "bg-primary",
              index === current && "bg-brand-accent ring-2 ring-primary/80",
              index > current && "border border-muted-foreground/60 bg-card"
            )}
          />
          <span className={cn("mt-1.5 text-xs leading-tight", index === current ? "font-medium text-foreground" : "text-muted-foreground")}>
            {step.name}
          </span>
        </li>
      ))}
    </ol>
  );
}
