import { Metadata } from "next";
import { alternatesFor, openGraphBase } from "@/lib/seo/share";
import { setLocale, t } from "@/lib/i18n/server";
import { localePath } from "@/lib/i18n/locales";
import { ScoreMethodology } from "@/components/home/ScoreMethodology";

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const lang = setLocale((await params).lang);
  const { title, description } = t().about.meta;
  return {
    title,
    description,
    alternates: alternatesFor(lang, "/about"),
    openGraph: { ...openGraphBase(lang), title, description, url: localePath(lang, "/about") },
  };
}

/** The /about page: what the site does, how scores work, where data comes from, how content is made, corrections and what it isn't. */
export default async function AboutPage({ params }: Params) {
  setLocale((await params).lang);
  const d = t().about;
  return (
    <div className="app-container pt-24 sm:pt-28">
      <section className="max-w-3xl py-8">
        <h1 className="type-hero mb-5 text-[44px] sm:text-[72px]">
          {d.titleStart} <span className="highlight">{d.titleHighlight}</span>
        </h1>
        <p className="max-w-[65ch] text-lg text-muted-foreground">{d.intro}</p>
      </section>

      <section className="py-16">
        <h2 className="type-h2">{d.whatWeDo.heading}</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">{d.whatWeDo.lead}</p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          {d.whatWeDo.items.map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <h3 className="mb-2 text-lg font-bold tracking-[-0.015em] sm:text-xl">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <ScoreMethodology />

      <section className="max-w-3xl py-16">
        <h2 className="type-h2 mb-4">{d.data.heading}</h2>
        <p className="mb-4 max-w-[65ch] text-muted-foreground">{d.data.body}</p>

        <h2 id="how-content-is-made" className="type-h2 mt-12 mb-4 scroll-mt-24">{d.content.heading}</h2>
        {d.content.paragraphs.map((paragraph) => (
          <p key={paragraph} className="mb-4 max-w-[65ch] text-muted-foreground">{paragraph}</p>
        ))}

        <h2 className="type-h2 mt-12 mb-4">{d.corrections.heading}</h2>
        <p className="mb-4 max-w-[65ch] text-muted-foreground">
          {d.corrections.before}{" "}
          <a
            href="https://x.com/ipomilega"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
          >
            @ipomilega
          </a>{" "}
          {d.corrections.after}
        </p>

        <h2 className="type-h2 mt-12 mb-4">{d.notAdvice.heading}</h2>
        <p className="max-w-[65ch] text-muted-foreground">{d.notAdvice.body}</p>
      </section>
    </div>
  );
}
