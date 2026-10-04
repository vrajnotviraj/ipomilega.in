import { Metadata } from "next";
import { CalendarClock } from "lucide-react";
import { openGraphBase } from "@/lib/seo/share";
import { getShareholderQuotaIpos, QuotaIpo } from "@/lib/queries/shareholder-quota";
import { QuotaCard } from "@/components/ipos/QuotaCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatIstTimestamp } from "@/lib/ipo-format";

export const revalidate = 3600;

const path = "/ipos/shareholder-quota";
const title = "Shareholder quota IPOs: which parent shares to hold";
const description =
  "Upcoming IPOs that reserve shares for the parent company's shareholders. See which listed parent to hold, how far each IPO has got, and how the quota works.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path },
  openGraph: { ...openGraphBase(), title, description, url: path },
};

const STEPS = [
  {
    title: "Hold one share of the parent",
    body: "A single share of the listed parent is usually enough. The RHP sets the exact rule, so check it for each IPO.",
  },
  {
    title: "Have it in demat by the RHP date",
    body: "Eligibility is fixed on the date of the red herring prospectus, often about a week before the IPO opens. Buy at least a day before so the trade settles.",
  },
  {
    title: "Apply in the shareholder category",
    body: "Bid up to ₹2 lakh as a shareholder. You can still apply as retail or HNI too, and the two are not counted as multiple bids.",
  },
  {
    title: "A separate pool to be allotted from",
    body: "The quota, up to 10% of the issue, is allotted only among eligible shareholders. That pool is apart from retail, not instead of it.",
  },
];

const FAQS = [
  {
    q: "What is a shareholder quota in an IPO?",
    a: "When a listed company takes a subsidiary or group company public, the IPO can set aside up to 10% of the issue for the listed parent's shareholders. Only people who hold the parent's shares on the eligibility date can bid in that portion.",
  },
  {
    q: "When do I need to own the parent's shares?",
    a: "On the date of the red herring prospectus (RHP), or the record date the RHP names. The shares must be in your demat account by then, so a purchase on that day may be too late.",
  },
  {
    q: "Can the shareholder quota be dropped?",
    a: "Yes. A draft offer document (DRHP) can change before the final RHP, and a company that only announced an IPO has not committed to anything yet. That is why each IPO here shows its stage and a link to its source.",
  },
  {
    q: "How is this list made?",
    a: "A job reads chittorgarh's DRHP and shareholder-quota reports once a day and checks each IPO's page for a shareholder reservation and the parent named for it. IPOs drop off once they list, or when a SEBI approval lapses without dates.",
  },
];

/** The /ipos/shareholder-quota page: how the quota works, then the parents to hold, IPOs closest to launch first. */
export default async function ShareholderQuotaPage() {
  const { ipos, checkedAt } = await getShareholderQuotaIpos();
  const soon = ipos.filter((ipo) => ipo.stage === "dates" || ipo.stage === "approved");
  const later = ipos.filter((ipo) => ipo.stage === "filed" || ipo.stage === "announced");
  const updated = formatIstTimestamp(checkedAt);

  return (
    <div className="app-container min-h-screen pt-24 pb-16 sm:pt-28">
      <header className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">Shareholder quota</p>
        <h1 className="type-hero mt-3 text-[44px] text-balance text-foreground sm:text-[60px]">
          Hold the parent, get a <span className="highlight">second shot</span> at the IPO
        </h1>
        <p className="mt-5 max-w-[65ch] text-lg text-pretty text-muted-foreground">
          When a listed company takes a subsidiary public, it can reserve part of the IPO for its own shareholders. These are
          the upcoming IPOs that do, and the parent you would need to hold.
        </p>
      </header>

      <section aria-labelledby="how-title" className="mt-10 rounded-[18px] bg-secondary p-4 sm:p-6">
        <h2 id="how-title" className="font-display text-xl font-bold tracking-[-0.015em] text-foreground">How it works</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3 sm:block">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary font-mono text-sm font-medium tabular-nums text-primary-foreground">
                {index + 1}
              </span>
              <div className="min-w-0 sm:mt-3">
                <h3 className="font-display font-bold leading-tight tracking-[-0.015em] text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm text-pretty text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <QuotaSection
        id="soon"
        title="Closest to launch"
        hint="SEBI has approved these, or their dates are set. Highest chance of opening soon."
        ipos={soon}
        highlighted
        empty="No shareholder-quota IPO has SEBI approval or dates right now."
      />
      <QuotaSection
        id="later"
        title="Further out"
        hint="Draft filed with SEBI, or announced by the company. These can take months, and the quota can still change."
        ipos={later}
        highlighted={false}
        empty="No other upcoming IPO with a shareholder quota right now."
      />

      {updated && (
        <p className="mt-6 text-sm text-muted-foreground">
          Updated daily. Last checked <span className="font-mono tabular-nums">{updated}</span>.
        </p>
      )}

      <section aria-labelledby="faq-title" className="mt-16 max-w-3xl">
        <h2 id="faq-title" className="type-h2">Questions</h2>
        <dl className="mt-6 divide-y divide-border border-y border-border">
          {FAQS.map((faq) => (
            <div key={faq.q} className="py-5">
              <dt className="font-display text-lg font-bold tracking-[-0.015em] text-foreground">{faq.q}</dt>
              <dd className="mt-2 max-w-[65ch] text-pretty text-muted-foreground">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-8 max-w-[65ch] text-xs text-muted-foreground">
        This list is gathered automatically from public filings and IPO trackers and is not reviewed by hand. It is not a
        recommendation to buy any share, and IPO Milega accepts no responsibility for losses arising from any investment
        decision. A shareholder quota is only final once it appears in the RHP. Investments in the securities market are subject to
        market risks. Read the offer document carefully before investing.
      </p>

      <script
        type="application/ld+json"
        // FAQ answers are static copy from this file.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })),
          }),
        }}
      />
    </div>
  );
}

function QuotaSection({ id, title, hint, ipos, highlighted, empty }: {
  id: string;
  title: string;
  hint: string;
  ipos: QuotaIpo[];
  highlighted: boolean;
  empty: string;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className="mt-12">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h2 id={`${id}-title`} className="type-h2 text-balance">{title}</h2>
        <span className="font-mono text-sm tabular-nums text-muted-foreground">{ipos.length}</span>
      </div>
      <p className="mt-2 max-w-[65ch] text-muted-foreground">{hint}</p>
      {ipos.length === 0 ? (
        <EmptyState icon={CalendarClock} title="Nothing here yet" hint={empty} />
      ) : (
        <ul className="reveal-stagger mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ipos.map((ipo) => (
            <li key={ipo.id}>
              <QuotaCard ipo={ipo} highlighted={highlighted} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
