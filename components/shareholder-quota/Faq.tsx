import { t } from "@/lib/i18n/server";
import { JsonLd } from "@/lib/seo/json-ld";

/** The questions, all open (they are what people search for), in two columns from lg, with FAQPage structured data. */
export function Faq() {
  const d = t().quota.faq;
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: d.items.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })),
  };
  return (
    <section aria-labelledby="faq-title" className="min-w-0">
      <h2 id="faq-title" className="font-display text-xl font-bold tracking-[-0.015em] text-foreground sm:text-2xl">{d.title}</h2>
      <dl className="mt-3 grid gap-x-12 lg:grid-cols-2">
        {d.items.map((faq) => (
          <div key={faq.q} className="border-t border-border py-4">
            <dt className="font-display text-base font-bold leading-snug tracking-[-0.01em] text-foreground">{faq.q}</dt>
            <dd className="mt-0.5 max-w-[70ch] text-pretty text-muted-foreground">{faq.a}</dd>
          </div>
        ))}
      </dl>
      <JsonLd data={faqSchema} />
    </section>
  );
}
