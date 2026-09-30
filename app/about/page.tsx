import { Metadata } from "next";
import { openGraphBase } from "@/lib/seo/share";
import { Footer } from "@/components/layout/Footer";
import { ScoreMethodology } from "@/components/home/ScoreMethodology";

const title = "About";
const description = "What IPO Milega is, where its IPO data comes from, and how we score every RHP/DRHP by the same rules.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/about" },
  openGraph: { ...openGraphBase(), title, description, url: "/about" },
};

const WHAT_WE_DO = [
  {
    title: "One place for every Indian IPO",
    body: "Live, closed, upcoming and past issues in one list: dates, price band, lot size, subscription and listing performance, updated as the calendar moves.",
  },
  {
    title: "The prospectus, read for you",
    body: "An RHP runs to hundreds of pages. We read every filing the same way and pull out the financials, the named risks and the peer comparison, so you can get through it in a few minutes.",
  },
  {
    title: "A score you can pick apart",
    body: "Each IPO gets an overall score backed by six modules. The breakdown sits next to the number, so you can see which parts carried it and which dragged it down.",
  },
  {
    title: "Context around the numbers",
    body: "Allotment odds, investor quota splits, multi-year financial charts and a written take, so you know what the numbers mean for this issue.",
  },
];

/** The /about page: what the site does, how scores work, where data comes from and what it isn't. */
export default function AboutPage() {
  return (
    <div className="app-container pt-24 sm:pt-28">
      <section className="max-w-3xl py-8">
        <h1 className="type-hero mb-5 text-[44px] sm:text-[72px]">
          About IPO <span className="highlight">Milega</span>
        </h1>
        <p className="max-w-[65ch] text-lg text-muted-foreground">
          IPO Milega tracks every Indian IPO and turns the filings behind it into something a regular
          investor can read. You get the prospectus, the financials and the risks, laid out the same way
          for every issue. We don&apos;t give tips or tell you what to buy.
        </p>
      </section>

      <section className="py-16">
        <h2 className="type-h2">What we do</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">Four things, done the same way for every issue.</p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          {WHAT_WE_DO.map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <h3 className="mb-2 text-lg font-bold tracking-[-0.015em] sm:text-xl">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <ScoreMethodology />

      <section className="max-w-3xl py-16">
        <h2 className="type-h2 mb-4">Where the data comes from</h2>
        <p className="mb-4 max-w-[65ch] text-muted-foreground">
          IPO details, subscription figures and listing prices come from public filings and exchange
          disclosures. We generate the analysis from the RHP/DRHP a company files with SEBI and review it
          before it goes live. Live numbers, subscription and grey market premium especially, move through
          the day, so treat what you see as the latest reading.
        </p>

        <h2 className="type-h2 mt-12 mb-4">A note on what this isn&apos;t</h2>
        <p className="max-w-[65ch] text-muted-foreground">
          Nothing on IPO Milega is investment advice, and we aren&apos;t a registered investment adviser. A
          score sums up what the filing says. It can&apos;t tell you what the stock will do after listing.
          Read the prospectus, weigh your own position, and speak to a qualified adviser before you apply.
        </p>
      </section>

      <Footer />
    </div>
  );
}
