import type { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis";
import type { FinancialReport, Ipo } from "@/types/ipo";
import { formatRupees } from "@/lib/ipo-format";
import { Prose, SectionHeading } from "../primitives";
import { FinancialTrendChart } from "./FinancialTrendChart";
import { getFinancialHighlights, sortReports } from "./financial-figures";
import { DebtCard, OfferStructureCard } from "./FundamentalsCards";
import { Highlights, RatioList } from "./Highlights";

/**
 * Numbers first: the latest year's figures and ratios, the trend chart beside the summary,
 * then debt and offer structure side by side.
 */
export function FinancialsSection({ analysis, ipo }: { analysis: IpoComprehensiveAnalysis; ipo: Ipo }) {
  const { fundamentals } = analysis;
  // The scraped issue amounts win over the AI's, so the page shows one number per fact.
  const freshCr = ipo.issue?.fresh_issue_cr;
  const ofsCr = ipo.issue?.offer_for_sale_cr;
  const offer = fundamentals.offer_structure && {
    ...fundamentals.offer_structure,
    ...(typeof freshCr === "number" && { fresh_issue: `${formatRupees(freshCr)} Cr` }),
    ...(typeof ofsCr === "number" && { offer_for_sale: `${formatRupees(ofsCr)} Cr` }),
  };
  const { reports, dated } = sortReports(analysis.financialReport ?? []);
  // Older analyses do not carry debt or offer structure.
  const hasCards = fundamentals.debt || offer;

  return (
    <section id="financials" className="reveal">
      <SectionHeading title="Financials" score={fundamentals.score ?? 0} />

      {reports.length > 0 && <Highlights {...getFinancialHighlights(reports, dated)} />}
      <RatioList fundamentals={fundamentals} valuation={ipo.ipo_valuation} />

      <TrendAndSummary reports={reports} summary={fundamentals.summary} />

      {hasCards && (
        <div className="mt-6 grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          {fundamentals.debt && <DebtCard debt={fundamentals.debt} />}
          {offer && <OfferStructureCard offer={offer} />}
        </div>
      )}
    </section>
  );
}

/** The trend chart on the left and the summary on the right from lg up; the summary alone without reports. */
function TrendAndSummary({ reports, summary }: { reports: FinancialReport[]; summary: string }) {
  if (reports.length === 0) return <Prose className="mt-8">{summary}</Prose>;

  return (
    <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
      <TrendPanel reports={reports} />
      <Prose>{summary}</Prose>
    </div>
  );
}

function TrendPanel({ reports }: { reports: FinancialReport[] }) {
  return (
    <div className="min-w-0 rounded-[18px] bg-secondary p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-bold tracking-[-0.015em] sm:text-xl">Financial performance trend</h3>
        <span className="font-mono text-xs text-muted-foreground">Amount ₹ in crores</span>
      </div>
      <FinancialTrendChart reports={reports} />
    </div>
  );
}
