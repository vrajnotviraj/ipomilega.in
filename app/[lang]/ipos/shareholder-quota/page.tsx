import { Metadata } from "next";
import { alternatesFor, openGraphBase } from "@/lib/seo/share";
import { setLocale, t } from "@/lib/i18n/server";
import { fill, localePath } from "@/lib/i18n/locales";
import { formatIstTimestamp } from "@/lib/ipo/format";
import { getShareholderQuotaIpos } from "@/lib/queries/shareholder-quota";
import { collectionJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { listSummary } from "@/components/shareholder-quota/summary";
import { Hero, HowItWorks } from "@/components/shareholder-quota/Intro";
import { QuotaSection } from "@/components/shareholder-quota/QuotaSection";
import { Faq } from "@/components/shareholder-quota/Faq";

export const revalidate = 3600;

const path = "/ipos/shareholder-quota";
const titleOf = (template: string) => fill(template, { year: new Date().getFullYear() });

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const lang = setLocale((await params).lang);
  const d = t().quota;
  const { ipos } = await getShareholderQuotaIpos();
  const title = titleOf(d.meta.title);
  const description = listSummary(ipos, t(), lang);
  return {
    title,
    description,
    alternates: alternatesFor(lang, path),
    openGraph: { ...openGraphBase(lang), title, description, url: localePath(lang, path) },
  };
}

/** /ipos/shareholder-quota: how the quota works, the parents to hold (closest to launch first), then questions. */
export default async function ShareholderQuotaPage({ params }: Params) {
  const lang = setLocale((await params).lang);
  const { common: c, quota: d } = t();
  const { ipos, closed, checkedAt } = await getShareholderQuotaIpos();
  const closeToLaunch = ipos.filter((ipo) => ipo.stage === "dates" || ipo.stage === "approved");
  const furtherOut = ipos.filter((ipo) => ipo.stage === "filed" || ipo.stage === "announced");
  const lastChecked = formatIstTimestamp(checkedAt);
  const summary = listSummary(ipos, t(), lang);

  return (
    <div className="app-container pt-24 sm:pt-28">
      <JsonLd data={collectionJsonLd({ lang, path, name: titleOf(d.meta.title), description: summary, items: ipos.map((ipo) => ({ name: `${ipo.name} IPO`, href: ipo.slug ? `/analysis/${ipo.slug}` : path })) })} />
      <Breadcrumbs crumbs={[{ name: c.nav.home, href: "/" }, { name: c.nav.ipos, href: "/ipos" }, { name: c.nav.quota, href: path }]} />
      <div className="mt-6">
        <Hero summary={summary} />
      </div>
      <HowItWorks />

      <QuotaSection id="soon" {...d.sections.soon} ipos={closeToLaunch} highlighted />
      <QuotaSection id="later" {...d.sections.later} ipos={furtherOut} highlighted={false} />
      {closed.length > 0 && <QuotaSection id="closed" {...d.sections.closed} ipos={closed} highlighted={false} />}
      {lastChecked && (
        <p className="mt-6 text-sm text-muted-foreground">
          {d.lastChecked} <span className="font-mono tabular-nums">{lastChecked}</span>.
        </p>
      )}

      <Faq />

      <p className="mt-8 text-xs text-pretty text-muted-foreground">{d.disclaimer}</p>
    </div>
  );
}
