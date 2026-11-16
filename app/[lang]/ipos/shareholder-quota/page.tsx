import { Metadata } from "next";
import { CalendarClock } from "lucide-react";
import { alternatesFor, openGraphBase, titleFor } from "@/lib/seo/share";
import { collectionJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { setLocale, t } from "@/lib/i18n/server";
import { fill, localePath, type Locale } from "@/lib/i18n/locales";
import { formatIstTimestamp } from "@/lib/ipo/format";
import { getShareholderQuotaIpos, type QuotaIpo } from "@/lib/queries/shareholder-quota";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { listSummary } from "@/components/shareholder-quota/summary";
import { Hero } from "@/components/shareholder-quota/hero/Hero";
import { StageChips } from "@/components/shareholder-quota/stages/StageChips";
import { StageGroups, type Group } from "@/components/shareholder-quota/stages/StageGroups";
import { HowToApply } from "@/components/shareholder-quota/guide/HowToApply";
import { Faq } from "@/components/shareholder-quota/guide/Faq";

export const revalidate = 300;

const path = "/ipos/shareholder-quota";

type Params = { params: Promise<{ lang: string }> };

const pageTitle = () => fill(t().quota.meta.title, { year: new Date().getFullYear() });

/** The IPOs on the list, then the rule in one line. */
const pageDescription = (ipos: QuotaIpo[], lang: Locale) => `${listSummary(ipos, t(), lang)} ${t().quota.hero.lede}`;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const lang = setLocale((await params).lang);
  const { ipos } = await getShareholderQuotaIpos();
  const title = pageTitle();
  const description = pageDescription(ipos, lang);
  return {
    title: titleFor(title),
    description,
    alternates: alternatesFor(lang, path),
    openGraph: { ...openGraphBase(lang), title, description, url: localePath(lang, path) },
  };
}

/** /ipos/shareholder-quota: the title and the two-pools panel, the IPOs grouped by stage, how to apply, then the questions. */
export default async function ShareholderQuotaPage({ params }: Params) {
  const lang = setLocale((await params).lang);
  const { common: c, quota: d } = t();
  const { ipos, buyBefore, approved, filed, rumoured, closed, listed, checkedAt } = await getShareholderQuotaIpos();
  const stages: Group[] = [
    { id: "buy", ipos: buyBefore }, { id: "approved", ipos: approved }, { id: "filed", ipos: filed },
    { id: "rumoured", ipos: rumoured }, { id: "closed", ipos: closed }, { id: "listed", ipos: listed },
  ];
  const shown = stages.filter((stage) => stage.ipos.length > 0);
  const listJsonLd = collectionJsonLd({
    lang,
    path,
    name: pageTitle(),
    description: pageDescription(ipos, lang),
    items: ipos.map((ipo) => ({ name: `${ipo.name} IPO`, href: ipo.slug ? `/analysis/${ipo.slug}` : path })),
  });

  return (
    <div className="app-container pt-24 sm:pt-28">
      <JsonLd data={{ ...listJsonLd, ...(checkedAt && { dateModified: checkedAt }) }} />
      <Breadcrumbs crumbs={[{ name: c.nav.home, href: "/" }, { name: c.nav.ipos, href: "/ipos" }, { name: c.nav.quota, href: path }]} />

      <div className="mt-5">
        <Hero lastChecked={formatIstTimestamp(checkedAt)}>{shown.length > 0 && <StageChips groups={shown} />}</Hero>
      </div>

      <div className="mt-10">
        {shown.length > 0 ? <StageGroups groups={shown} /> : <EmptyState icon={CalendarClock} title={d.sections.nothingYet} hint={d.sections.empty} />}
      </div>
      <p className="mt-8 max-w-[75ch] text-xs text-pretty text-muted-foreground">{d.disclaimer}</p>

      <div className="mt-14 grid gap-y-14 border-t border-border pt-12">
        <HowToApply />
        <Faq />
      </div>
    </div>
  );
}
