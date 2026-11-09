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
import { BuySection, QuotaRows, QuotaSection, RumourList } from "@/components/shareholder-quota/sections";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarClock } from "lucide-react";
import { Faq } from "@/components/shareholder-quota/Faq";

export const revalidate = 300;

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

/** /ipos/shareholder-quota: what to buy by when (Buy before) and the rules in the hero, how it works, what is coming, then questions. */
export default async function ShareholderQuotaPage({ params }: Params) {
  const lang = setLocale((await params).lang);
  const { common: c, quota: d } = t();
  const { ipos, buyBefore, approved, filed, rumoured, closed, listed, checkedAt } = await getShareholderQuotaIpos();
  // Empty sections are left out of the page and the chips.
  const sections = [
    { id: "buy", ipos: buyBefore }, { id: "approved", ipos: approved }, { id: "filed", ipos: filed },
    { id: "rumoured", ipos: rumoured }, { id: "closed", ipos: closed }, { id: "listed", ipos: listed },
  ] as const;
  const shown = sections.filter((section) => section.ipos.length > 0);
  const lastChecked = formatIstTimestamp(checkedAt);
  const summary = listSummary(ipos, t(), lang);

  return (
    <div className="app-container pt-24 sm:pt-28">
      <JsonLd data={collectionJsonLd({ lang, path, name: titleOf(d.meta.title), description: summary, items: ipos.map((ipo) => ({ name: `${ipo.name} IPO`, href: ipo.slug ? `/analysis/${ipo.slug}` : path })) })} />
      <Breadcrumbs crumbs={[{ name: c.nav.home, href: "/" }, { name: c.nav.ipos, href: "/ipos" }, { name: c.nav.quota, href: path }]} />
      <div className="mt-10">
        <Hero aside={buyBefore.length > 0 && <BuySection {...d.sections.buy} ipos={buyBefore} />}>
          {shown.length > 0 && (
            <nav aria-label={d.sections.nav}>
              <ul className="flex flex-wrap gap-2">
                {shown.map(({ id, ipos: list }) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className="press inline-flex min-h-11 whitespace-nowrap items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary active:bg-secondary"
                    >
                      {d.sections[id].title}
                      <span className="font-mono tabular-nums text-muted-foreground">{list.length}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </Hero>
      </div>

      {ipos.length + rumoured.length === 0 && (
        <div className="mt-12">
          <EmptyState icon={CalendarClock} title={d.sections.nothingYet} hint={d.sections.empty} />
        </div>
      )}
      <HowItWorks />

      {shown.filter(({ id }) => id !== "buy").map(({ id, ipos: list }) => (
        <QuotaSection key={id} id={id} {...d.sections[id]} quiet={id === "rumoured"}>
          {id === "rumoured" ? <RumourList ipos={list} /> : <QuotaRows ipos={list} />}
        </QuotaSection>
      ))}
      {lastChecked && (
        // Under the list column, at the foot of the last list.
        <p className="mt-8 text-sm text-muted-foreground lg:ml-[calc(4/12*100%+0.667rem)]">
          {d.lastChecked} <span className="font-mono tabular-nums">{lastChecked}</span>.
        </p>
      )}

      <Faq />

      <p className="mt-16 max-w-[55ch] text-xs text-pretty text-muted-foreground">{d.disclaimer}</p>
    </div>
  );
}
