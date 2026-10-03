import type { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis";
import type { Ipo } from "@/types/ipo";
import { ArrowUpRight } from "lucide-react";
import {
  formatIssueSize,
  formatIstTimestamp,
  formatPriceBand,
  getAllotmentCheckUrl,
  getIpoType,
  getIssueStage,
  getRiskTextColor,
  getScoreTrustLabel,
  type IssueStage,
} from "@/lib/ipo-format";
import { overallScoreOf } from "@/lib/seo/share";
import { RESEARCH_AUTHOR } from "@/lib/seo/json-ld";
import { formatBlogDate } from "@/lib/blog-format";
import { cn } from "@/lib/utils";
import { ProgressLink } from "@/components/progress/ProgressLink";
import { IpoLogo } from "@/components/ipo-shared/IpoLogo";
import { LiveLabel } from "@/components/ui/LiveLabel";
import { getAboutLine, getIssueDates, getLotShares, formatMinInvestment, getVerdict } from "./analysis-facts";
import { getHeadlineFigures, type HeadlineFigure } from "./headline-figures";
import { Eyebrow } from "./primitives";

/**
 * The top of the page: company, what it does and its status, the overall score with a one-line verdict, the three numbers
 * to check before bidding, and the issue's key facts. A server component, so "today" comes from the ISR render.
 */
export function SummaryPanel({ analysis, ipo }: { analysis: IpoComprehensiveAnalysis; ipo: Ipo }) {
  const { opening, closing } = getIssueDates(analysis);
  const allotmentUrl = getAllotmentCheckUrl(ipo);
  const gmpUpdatedAt = formatIstTimestamp(ipo.gmp_updated_at);

  return (
    <div className="rounded-[18px] border border-border bg-card p-5 sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <IpoLogo src={ipo.image_url} name={analysis.company_name} size="lg" />
        <BoardChip board={getIpoType(ipo)} />
        <StageChip stage={getIssueStage(opening, closing).stage} />
      </div>
      <h1 className="type-hero mt-4 text-balance break-words text-[44px] sm:text-[60px]">{analysis.company_name}</h1>
      <AboutLine text={getAboutLine(analysis)} />
      <Byline published={analysis.created_at} updated={analysis.updated_at} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
        <ScoreVerdict score={overallScoreOf(analysis)} verdict={getVerdict(analysis)} />
        <div className="min-w-0 space-y-6">
          <div>
            <HeadlineFigures figures={getHeadlineFigures(analysis, ipo)} />
            <p className="mt-2 text-xs text-muted-foreground">
              GMP is an unofficial grey market indication.
              {gmpUpdatedAt && (
                <> GMP updated <span className="font-mono tabular-nums">{gmpUpdatedAt}</span>.</>
              )}
            </p>
          </div>
          <KeyFacts analysis={analysis} />
          {allotmentUrl && <AllotmentCheckLink href={allotmentUrl} />}
        </div>
      </div>
    </div>
  );
}

/** Who wrote the analysis and when, matching the Article markup. The update date shows only when it falls on another day. */
function Byline({ published, updated }: { published?: Date | string; updated?: Date | string }) {
  const publishedOn = published ? formatBlogDate(String(published)) : null;
  const updatedOn = updated ? formatBlogDate(String(updated)) : null;
  return (
    <p className="mt-3 text-sm text-muted-foreground">
      By{" "}
      <ProgressLink href="/about" className="underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground">
        {RESEARCH_AUTHOR}
      </ProgressLink>
      {publishedOn && (
        <>
          {" · "}Published <time dateTime={String(published)} className="font-mono tabular-nums">{publishedOn}</time>
        </>
      )}
      {updatedOn && updatedOn !== publishedOn && (
        <>
          {" · "}Updated <time dateTime={String(updated)} className="font-mono tabular-nums">{updatedOn}</time>
        </>
      )}
    </p>
  );
}

/** One line on what the company does, under the name. */
function AboutLine({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p className="mt-3 line-clamp-2 max-w-[65ch] text-pretty text-base text-muted-foreground">
      <span className="font-medium text-foreground">What they do: </span>
      {text}
    </p>
  );
}

/**
 * The exchange's allotment checker in a new tab, as an outlined pill.
 * ponytail: plain anchor because ArrowLink has no target prop; switch to ArrowLink once it passes target and rel.
 */
function AllotmentCheckLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium transition-[transform,background-color] hover:bg-secondary active:scale-[0.98]"
    >
      Check allotment
      <ArrowUpRight className="size-4" strokeWidth={2} aria-hidden="true" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

function ScoreVerdict({ score, verdict }: { score: number; verdict: string | null }) {
  return (
    <div>
      <Eyebrow>Our score</Eyebrow>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={cn("font-display text-7xl font-bold leading-none tracking-[-0.035em] tabular-nums sm:text-8xl", getRiskTextColor(score))}>
          {score.toFixed(1)}
        </span>
        <span className="font-mono text-lg tabular-nums text-muted-foreground">/10</span>
        <span className={cn("ml-1 text-sm font-medium", getRiskTextColor(score))}>{getScoreTrustLabel(score)}</span>
      </div>
      {verdict && <p className="mt-4 max-w-[48ch] text-pretty text-base text-muted-foreground">{verdict}</p>}
    </div>
  );
}

/** Three large mono figures on surface tiles. On phones GMP takes the full first row so every figure fits. */
function HeadlineFigures({ figures }: { figures: HeadlineFigure[] }) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
      {figures.map(({ label, value, caption, color }) => (
        <div key={label} className="min-w-0 rounded-lg bg-secondary p-3 first:col-span-2 sm:p-4 sm:first:col-span-1">
          <dt>
            <Eyebrow className="truncate">{label}</Eyebrow>
          </dt>
          <dd className={cn("mt-1.5 truncate font-mono text-2xl font-medium tabular-nums sm:text-3xl lg:text-2xl xl:text-3xl", color)}>{value}</dd>
          <dd className="mt-1 truncate font-mono text-xs tabular-nums text-muted-foreground">{caption}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Price band, lot, cost of one lot and issue size. */
function KeyFacts({ analysis }: { analysis: IpoComprehensiveAnalysis }) {
  const lotShares = getLotShares(analysis);
  const facts = [
    { label: "Price band", value: formatPriceBand(analysis.ipo_details?.price_band) },
    { label: "Lot size", value: lotShares ? `${lotShares} shares` : "N/A" },
    { label: "Min. investment", value: formatMinInvestment(analysis) },
    { label: "Issue size", value: formatIssueSize(analysis.ipo_details?.issue_size) ?? "N/A" },
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
      {facts.map(({ label, value }) => (
        <div key={label} className="min-w-0">
          <dt>
            <Eyebrow>{label}</Eyebrow>
          </dt>
          <dd className="mt-1 break-words font-mono text-base font-medium tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function BoardChip({ board }: { board: string }) {
  return (
    <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium uppercase tracking-[0.04em]">{board}</span>
  );
}

function StageChip({ stage }: { stage: IssueStage | null }) {
  if (stage === null) return null;
  if (stage === "live") return <LiveLabel className="px-1" />;

  const isPast = stage === "past";
  return (
    <span className={cn("rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium uppercase tracking-[0.04em]", isPast && "text-muted-foreground")}>
      {isPast ? "Closed" : "Upcoming"}
    </span>
  );
}
