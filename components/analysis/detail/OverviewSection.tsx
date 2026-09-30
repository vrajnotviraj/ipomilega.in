import type { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis";
import type { Ipo } from "@/types/ipo";
import { gainColor, parseEstListingPercent } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";
import { AllotmentOddsTiles } from "@/components/ipo/AllotmentOddsTiles";
import { GmpTrendChart } from "./gmp-trend/GmpTrendChart";
import { getGmp, getIssueDates, getQuotaSplit, hasAllotmentOdds, nonBlank } from "./analysis-facts";
import { IssueTimeline } from "./IssueTimeline";
import { Eyebrow } from "./primitives";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { StrengthsAndConcerns } from "./StrengthsAndConcerns";
import { SummaryPanel } from "./SummaryPanel";
import { WhoGetsShares } from "./WhoGetsShares";

/** The top of the page: summary, dates, odds and GMP, the score breakdown, strengths and concerns, and who gets shares. */
export function OverviewSection({ analysis, ipo }: { analysis: IpoComprehensiveAnalysis; ipo: Ipo }) {
  const applicationRows = analysis.investorSplit?.filter((row) => row.application.toLowerCase() !== "application") ?? [];

  return (
    <section id="overview" className="space-y-6 sm:space-y-8">
      <SummaryPanel analysis={analysis} ipo={ipo} />
      {/* Keeps the heading order h1, h2, h3 for the block titles below. */}
      <h2 className="sr-only">Overview</h2>

      <div className="rounded-[18px] bg-secondary p-5 sm:p-6">
        <Eyebrow className="mb-4">Issue timeline</Eyebrow>
        <IssueTimeline {...getIssueDates(analysis)} />
      </div>

      <OddsAndGmp analysis={analysis} ipo={ipo} />

      <div className="reveal pt-4">
        <ScoreBreakdown analysis={analysis} />
      </div>

      <div className="reveal pt-4">
        <StrengthsAndConcerns
          strengths={nonBlank(analysis.performance?.key_achievements)}
          concerns={nonBlank(analysis.risk_meter?.key_risks)}
        />
      </div>

      <div className="reveal pt-4">
        <WhoGetsShares slices={getQuotaSplit(analysis, ipo)} applicationRows={applicationRows} />
      </div>
    </section>
  );
}

/**
 * Allotment odds and the estimated listing beside the GMP trend. Before bids come in there are no odds,
 * so the listing strip and the trend each take the full width.
 */
function OddsAndGmp({ analysis, ipo }: { analysis: IpoComprehensiveAnalysis; ipo: Ipo }) {
  const estimatedListing = <EstimatedListing value={getGmp(analysis, ipo).estimatedListing} />;
  // Fetches its own series in the browser, so the ISR cache does not freeze it.
  const gmpTrend = <GmpTrendChart ipoId={ipo._id} companyName={analysis.company_name} />;

  if (!hasAllotmentOdds(ipo)) {
    return (
      <div className="space-y-4 pt-4">
        {estimatedListing}
        {gmpTrend}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 pt-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8">
      <div className="space-y-4">
        <AllotmentOddsTiles
          ipo={ipo}
          companyName={analysis.company_name}
          format="ratio"
          variant="card"
          heading="Your odds"
          caption="Estimated from the current subscription figures. Tap a category to work it out for your application size."
        />
        {estimatedListing}
      </div>
      {gmpTrend}
    </div>
  );
}

/** The GMP-implied listing price, or a note that there is no grey market quote to go on. */
function EstimatedListing({ value }: { value: string | null }) {
  if (!value) {
    return (
      <div className="rounded-xl bg-secondary px-4 py-3 sm:px-5">
        <Eyebrow className="mb-2">Estimated listing</Eyebrow>
        <p className="text-sm text-muted-foreground">
          Grey market data isn&apos;t available for this issue, so the gains estimate uses fundamentals only and ignores listing-day sentiment.
        </p>
      </div>
    );
  }

  const percent = parseEstListingPercent(value);
  const signed = value.replace(/\(\s*(?=\d)/, "(+");
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-xl bg-secondary px-4 py-3 sm:px-5">
      <Eyebrow>Estimated listing</Eyebrow>
      <p className={cn("font-mono text-xl font-medium tabular-nums sm:text-2xl", gainColor(percent))}>
        ₹{signed}
      </p>
    </div>
  );
}
