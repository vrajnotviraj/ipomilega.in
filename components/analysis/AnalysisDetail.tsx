import type { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis";
import type { Blog, Ipo } from "@/types/ipo";
import { getSectionTabs, getShareFacts } from "./analysis-facts";
import { FinancialsSection } from "@/components/analysis/sections/financials/FinancialsSection";
import { FlexibilitySection } from "@/components/analysis/sections/FlexibilitySection";
import { OverviewSection } from "@/components/analysis/overview/OverviewSection";
import { PerformanceSection } from "@/components/analysis/sections/PerformanceSection";
import { RiskSection } from "@/components/analysis/sections/RiskSection";
import { StickyHeader } from "@/components/analysis/header/StickyHeader";
import { TimingSection } from "@/components/analysis/sections/TimingSection";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { IpoArticleLinks } from "@/components/blog/IpoArticleLinks";

/** One IPO's full analysis: the sticky header and tabs, the breadcrumb, each scored section in order, then the IPO's articles. */
export function AnalysisDetail({ analysis, ipo, articles }: { analysis: IpoComprehensiveAnalysis; ipo: Ipo; articles: Blog[] }) {
  const name = `${analysis.company_name} IPO`;
  return (
    <div className="min-h-screen bg-background pt-16">
      <StickyHeader
        companyName={analysis.company_name}
        logoUrl={ipo.image_url}
        tabs={getSectionTabs(analysis)}
        shareFacts={getShareFacts(analysis, ipo)}
      />

      <div className="app-container pt-6">
        <Breadcrumbs crumbs={[{ name: "Home", href: "/" }, { name: "IPOs", href: "/ipos" }, { name, href: `/analysis/${ipo.slug}` }]} />
      </div>

      <div className="app-container space-y-16 pt-6 pb-10 sm:space-y-24 sm:pb-14">
        <OverviewSection analysis={analysis} ipo={ipo} />
        {analysis.time && <TimingSection analysis={analysis} />}
        {analysis.fundamentals && <FinancialsSection analysis={analysis} ipo={ipo} />}
        {analysis.risk_meter && <RiskSection risk={analysis.risk_meter} />}
        {analysis.performance && <PerformanceSection performance={analysis.performance} />}
        {analysis.flexibility && <FlexibilitySection flexibility={analysis.flexibility} />}
        <IpoArticleLinks title={`Latest on ${name}`} blogs={articles} />

        <Disclaimer className="border-t border-border pt-6 text-pretty" />
      </div>
    </div>
  );
}
