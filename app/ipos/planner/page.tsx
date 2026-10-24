import { Metadata } from "next";
import { openGraphBase } from "@/lib/seo/share";
import { getPlannerIpos } from "@/lib/queries/planner";
import { dayNumberInIndia } from "@/lib/ipo/format";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PlannerClient } from "@/components/planner/PlannerClient";

// Matches the 5-minute cache on the IPO read; the engine purges both after each write.
export const revalidate = 300;

const path = "/ipos/planner";
const title = "IPO planner: where to bid with your money and accounts";
const description =
  "Enter your money and family accounts. The planner picks which open and upcoming IPOs to bid on, in which category, and when your blocked money comes back.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path },
  openGraph: { ...openGraphBase(), title, description, url: path },
};

/** /ipos/planner: open and upcoming IPOs in planner terms. The browser works out the plan from them. */
export default async function PlannerPage() {
  const { ipos, skipped } = await getPlannerIpos();

  return (
    <div className="app-container pt-24 sm:pt-28">
      <Breadcrumbs crumbs={[{ name: "Home", href: "/" }, { name: "IPOs", href: "/ipos" }, { name: "Planner", href: path }]} />
      <header className="mt-6">
        <h1 className="type-hero text-[44px] text-balance text-foreground sm:text-[60px]">
          Plan your <span className="highlight">IPO bids</span>
        </h1>
        <p className="mt-5 max-w-[65ch] text-lg text-pretty text-muted-foreground">
          Tell us your money and how many family accounts can bid. We pick the IPOs, the category and the accounts that give the best
          expected gain, and line up the dates so money freed from one IPO pays for the next.
        </p>
      </header>

      <PlannerClient ipos={ipos} skipped={skipped} today={dayNumberInIndia(new Date())} />
    </div>
  );
}
