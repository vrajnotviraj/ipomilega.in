import type { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis";
import type { Ipo } from "@/types/ipo";
import { getSectionTabs, getShareFacts } from "./analysis-facts";
import { FinancialsSection } from "./financials/FinancialsSection";
import { FlexibilitySection } from "./FlexibilitySection";
import { OverviewSection } from "./OverviewSection";
import { PerformanceSection } from "./PerformanceSection";
import { RiskSection } from "./RiskSection";
import { StickyHeader } from "./StickyHeader";
import { TimingSection } from "./TimingSection";
import { AiDisclaimer } from "@/components/ui/AiDisclaimer";

/** One IPO's full analysis: the sticky header and tabs, then each scored section in order. */
export function AnalysisDetail({ analysis, ipo }: { analysis: IpoComprehensiveAnalysis; ipo: Ipo }) {
  return (
    <div className="min-h-screen bg-background pt-16">
      <StickyHeader
        companyName={analysis.company_name}
        logoUrl={ipo.image_url}
        tabs={getSectionTabs(analysis)}
        shareFacts={getShareFacts(analysis, ipo)}
      />

      <div className="app-container space-y-16 py-10 sm:space-y-24 sm:py-14">
        <OverviewSection analysis={analysis} ipo={ipo} />
        {analysis.time && <TimingSection analysis={analysis} />}
        {analysis.fundamentals && <FinancialsSection analysis={analysis} />}
        {analysis.risk_meter && <RiskSection risk={analysis.risk_meter} />}
        {analysis.performance && <PerformanceSection performance={analysis.performance} />}
        {analysis.flexibility && <FlexibilitySection flexibility={analysis.flexibility} />}

        <AiDisclaimer className="max-w-[65ch] border-t border-border pt-6" />
      </div>
    </div>
  );
}
