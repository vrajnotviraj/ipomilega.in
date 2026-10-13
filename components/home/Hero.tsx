import { Walkthrough } from '@/components/home/Walkthrough';

/** Home opener: the tagline, what the site shows and the tour button. */
export function Hero() {
  return (
    <section className="py-6 sm:py-8">
      <h1 className="type-hero text-[32px] sm:text-[40px]">
        Milega? <span className="highlight">Check first.</span>
      </h1>
      <p className="mt-2 max-w-xl text-base text-muted-foreground">
        See the GMP, subscription, your allotment odds and a scored prospectus before you bid.
      </p>
      <Walkthrough />
    </section>
  );
}
