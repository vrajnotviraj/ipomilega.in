import { Metadata } from "next";
import { Footer } from "@/components/Home/Footer";
import { ScoreMethodology } from "@/components/Home/ScoreMethodology";

export const metadata: Metadata = {
  title: "About",
  description:
    "What IPO Milega is, where its IPO data comes from, and how we score every RHP/DRHP by the same rules.",
  alternates: { canonical: "/about" },
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
    body: "Each IPO gets an overall score backed by six modules. The breakdown is on the page next to the number, so you can see which parts carried it and which dragged it down.",
  },
  {
    title: "Context around the numbers",
    body: "Allotment odds, investor quota splits, multi-year financial charts and a written take, so you know what the numbers mean for this issue.",
  },
];

export default function AboutPage() {
  return (
    <div className="app-container pt-24 sm:pt-28">
      <section className="py-8 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-semibold font-serif text-foreground mb-4">
          About IPO Milega
        </h1>
        <p className="text-muted-foreground font-sans text-base sm:text-lg leading-relaxed">
          IPO Milega tracks every Indian IPO and turns the filings behind it into
          something a regular investor can actually read. You get the prospectus, the
          financials and the risks, laid out the same way for every issue. We don&apos;t
          give tips or tell you what to buy.
        </p>
      </section>

      <section className="py-8">
        <h2 className="text-2xl md:text-3xl font-semibold font-serif text-foreground mb-2">
          What we do
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base font-sans max-w-2xl">
          Four things, done the same way for every issue.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-8">
          {WHAT_WE_DO.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <h3 className="font-serif font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <ScoreMethodology />

      <section className="py-8 max-w-3xl">
        <h2 className="text-2xl md:text-3xl font-semibold font-serif text-foreground mb-4">
          Where the data comes from
        </h2>
        <p className="text-muted-foreground font-sans text-sm sm:text-base leading-relaxed mb-4">
          IPO details, subscription figures and listing prices come from public filings
          and exchange disclosures. We generate the analysis from the RHP/DRHP a company
          files with SEBI and review it before it goes live. Live numbers (subscription
          and grey market premium especially) move through the day, so treat what you
          see as the latest reading.
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold font-serif text-foreground mb-4 mt-10">
          A note on what this isn&apos;t
        </h2>
        <p className="text-muted-foreground font-sans text-sm sm:text-base leading-relaxed">
          Nothing on IPO Milega is investment advice, and we aren&apos;t a registered
          investment adviser. A score sums up what the filing says. It can&apos;t tell you
          what the stock will do after listing. Read the prospectus, weigh your own position, and speak
          to a qualified adviser before you apply.
        </p>
      </section>

      <Footer />
    </div>
  );
}
