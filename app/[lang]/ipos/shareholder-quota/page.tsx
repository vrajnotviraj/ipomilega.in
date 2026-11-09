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
import { StageGroups, type Group } from "@/components/shareholder-quota/sections";
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

/** /ipos/shareholder-quota: the title and rules, the quota IPOs as tiles grouped by stage (Buy before first), then how it works beside the questions. */
export default async function ShareholderQuotaPage({ params }: Params) {
  const lang = setLocale((await params).lang);
  const { common: c, quota: d } = t();
  const { ipos, buyBefore, approved, filed, rumoured, closed, listed, checkedAt } = await getShareholderQuotaIpos();
  // Empty stages are left out of the grid and the chips.
  const groups: Group[] = [
    { id: "buy", ipos: buyBefore }, { id: "approved", ipos: approved }, { id: "filed", ipos: filed },
    { id: "rumoured", ipos: rumoured }, { id: "closed", ipos: closed }, { id: "listed", ipos: listed },
  ];
  const shown = groups.filter((group) => group.ipos.length > 0);
  const summary = listSummary(ipos, t(), lang);

  return (
    <div className="app-container pt-24 sm:pt-28">
      <JsonLd data={collectionJsonLd({ lang, path, name: titleOf(d.meta.title), description: summary, items: ipos.map((ipo) => ({ name: `${ipo.name} IPO`, href: ipo.slug ? `/analysis/${ipo.slug}` : path })) })} />
      <Breadcrumbs crumbs={[{ name: c.nav.home, href: "/" }, { name: c.nav.ipos, href: "/ipos" }, { name: c.nav.quota, href: path }]} />
      <div className="mt-5">
        <Hero lastChecked={formatIstTimestamp(checkedAt)}>
          {shown.length > 0 && <StageChips groups={shown} />}
        </Hero>
      </div>

      <div className="mt-10">
        {shown.length > 0 ? <StageGroups groups={shown} /> : <EmptyState icon={CalendarClock} title={d.sections.nothingYet} hint={d.sections.empty} />}
      </div>
      <p className="mt-8 max-w-[75ch] text-xs text-pretty text-muted-foreground">{d.disclaimer}</p>

      <div className="mt-12 grid gap-x-12 gap-y-10 lg:grid-cols-2">
        <HowItWorks />
        <Faq />
      </div>
    </div>
  );
}

/** One pill per non-empty stage with its count, linking down to it. */
function StageChips({ groups }: { groups: Group[] }) {
  const d = t().quota.sections;
  return (
    <nav aria-label={d.nav}>
      <ul className="flex flex-wrap gap-1.5">
        {groups.map(({ id, ipos }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="press inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-3.5 text-sm font-medium text-foreground hover:bg-secondary active:bg-secondary motion-reduce:active:transform-none"
            >
              {d[id].title}
              <span className="font-mono tabular-nums text-muted-foreground">{ipos.length}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
