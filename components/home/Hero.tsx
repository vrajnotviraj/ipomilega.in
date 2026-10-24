import { Walkthrough } from '@/components/home/Walkthrough';
import { t } from '@/lib/i18n/server';

/** Home opener: the tagline, what the site shows and the tour button. */
export function Hero() {
  const d = t().home.hero;
  return (
    <section className="py-6 sm:py-8">
      <h1 className="type-hero text-[32px] sm:text-[40px]">
        {d.milega} <span className="highlight">{d.checkFirst}</span>
      </h1>
      <p className="mt-2 max-w-xl text-base text-muted-foreground">
        {d.lead}
      </p>
      <Walkthrough />
    </section>
  );
}
