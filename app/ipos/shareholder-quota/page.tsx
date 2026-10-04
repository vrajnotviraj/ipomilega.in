import { Metadata } from "next";
import { openGraphBase } from "@/lib/seo/share";
import { formatIstTimestamp } from "@/lib/ipo-format";
import { getShareholderQuotaIpos } from "@/lib/queries/shareholder-quota";
import { collectionJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { listSummary } from "@/components/shareholder-quota/summary";
import { Hero, HowItWorks } from "@/components/shareholder-quota/Intro";
import { QuotaSection } from "@/components/shareholder-quota/QuotaSection";
import { Faq } from "@/components/shareholder-quota/Faq";

export const revalidate = 3600;

const path = "/ipos/shareholder-quota";
const titleOf = () => `Upcoming IPOs with Shareholder Quota ${new Date().getFullYear()}`;

export async function generateMetadata(): Promise<Metadata> {
  const { ipos } = await getShareholderQuotaIpos();
  const title = titleOf();
  const description = listSummary(ipos);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...openGraphBase(), title, description, url: path },
  };
}

/** /ipos/shareholder-quota: how the quota works, the parents to hold (closest to launch first), then questions. */
export default async function ShareholderQuotaPage() {
  const { ipos, checkedAt } = await getShareholderQuotaIpos();
  const closeToLaunch = ipos.filter((ipo) => ipo.stage === "dates" || ipo.stage === "approved");
  const furtherOut = ipos.filter((ipo) => ipo.stage === "filed" || ipo.stage === "announced");
  const lastChecked = formatIstTimestamp(checkedAt);
  const summary = listSummary(ipos);

  return (
    <div className="app-container pt-24 sm:pt-28">
      <JsonLd data={collectionJsonLd({ path, name: titleOf(), description: summary, items: ipos.map((ipo) => ({ name: `${ipo.name} IPO`, href: ipo.slug ? `/analysis/${ipo.slug}` : path })) })} />
      <Breadcrumbs crumbs={[{ name: "Home", href: "/" }, { name: "IPOs", href: "/ipos" }, { name: "Shareholder quota", href: path }]} />
      <div className="mt-6">
        <Hero summary={summary} />
      </div>
      <HowItWorks />

      <QuotaSection
        id="soon"
        title="Closest to launch"
        hint="SEBI has approved these, or their dates are set. Highest chance of opening soon."
        empty="No shareholder-quota IPO has SEBI approval or dates right now."
        ipos={closeToLaunch}
        highlighted
      />
      <QuotaSection
        id="later"
        title="Further out"
        hint="Draft filed with SEBI, or announced by the company. These can take months, and the quota can still change."
        empty="No other upcoming IPO with a shareholder quota right now."
        ipos={furtherOut}
        highlighted={false}
      />
      {lastChecked && (
        <p className="mt-6 text-sm text-muted-foreground">
          Updated daily. Last checked <span className="font-mono tabular-nums">{lastChecked}</span>.
        </p>
      )}

      <Faq />

      <p className="mt-8 text-xs text-pretty text-muted-foreground">
        This list is gathered automatically from offer documents and exchange filings and is not reviewed by hand. It is not a
        recommendation to buy any share, and IPO Milega accepts no responsibility for losses arising from any investment decision. A
        shareholder quota is only final once it appears in the RHP. Investments in the securities market are subject to market risks.
        Read the offer document carefully before investing.
      </p>
    </div>
  );
}
