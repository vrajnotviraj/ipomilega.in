import { t } from "@/lib/i18n/server";
import { JsonLd } from "@/lib/seo/json-ld";

/** The questions in two columns, with FAQPage structured data. */
export function Faq() {
  const d = t().quota.faq;
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: d.items.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })),
  };
  return (
    <section aria-labelledby="faq-title" className="mt-16">
      <h2 id="faq-title" className="type-h2">{d.title}</h2>
      <dl className="mt-6 grid gap-x-12 border-b border-border lg:grid-cols-2">
        {d.items.map((faq) => (
          <div key={faq.q} className="border-t border-border py-5">
            <dt className="font-display text-lg font-bold tracking-[-0.015em] text-foreground">{faq.q}</dt>
            <dd className="mt-2 max-w-[65ch] text-pretty text-muted-foreground">{faq.a}</dd>
          </div>
        ))}
      </dl>
      <JsonLd data={faqSchema} />
    </section>
  );
}
