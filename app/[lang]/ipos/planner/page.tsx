import { Metadata } from "next";
import { alternatesFor, openGraphBase } from "@/lib/seo/share";
import { setLocale, t } from "@/lib/i18n/server";
import { localePath } from "@/lib/i18n/locales";
import { getPlannerIpos } from "@/lib/queries/planner";
import { dayNumberInIndia } from "@/lib/ipo/format";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PlannerClient } from "@/components/planner/PlannerClient";

// Matches the 5-minute cache on the IPO read; the engine purges both after each write.
export const revalidate = 300;

const path = "/ipos/planner";

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const lang = setLocale((await params).lang);
  const { title, description } = t().planner.meta;
  return {
    title,
    description,
    alternates: alternatesFor(lang, path),
    openGraph: { ...openGraphBase(lang), title, description, url: localePath(lang, path) },
  };
}

/** /ipos/planner: open and upcoming IPOs in planner terms. The browser works out the plan from them. */
export default async function PlannerPage({ params }: Params) {
  setLocale((await params).lang);
  const { common: c, planner: d } = t();
  const { ipos, skipped } = await getPlannerIpos();

  return (
    <div className="app-container pt-24 sm:pt-28">
      <Breadcrumbs crumbs={[{ name: c.nav.home, href: "/" }, { name: c.nav.ipos, href: "/ipos" }, { name: c.nav.planner, href: path }]} />
      <header className="mt-6">
        <h1 className="type-hero text-[44px] text-balance text-foreground sm:text-[60px]">
          {d.hero.before} <span className="highlight">{d.hero.highlight}</span>
        </h1>
        <p className="mt-5 max-w-[65ch] text-lg text-pretty text-muted-foreground">{d.hero.lede}</p>
      </header>

      <PlannerClient ipos={ipos} skipped={skipped} today={dayNumberInIndia(new Date())} />
    </div>
  );
}
