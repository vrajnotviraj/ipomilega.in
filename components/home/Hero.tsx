/** Home opener: the tagline, what the site shows, and today's open and upcoming counts. */
export function Hero({ openCount, upcomingCount }: { openCount: number; upcomingCount: number }) {
  return (
    <section className="flex flex-col gap-5 py-6 sm:py-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
      <div>
        <h1 className="type-hero text-[32px] sm:text-[40px]">
          Milega? <span className="highlight">Check first.</span>
        </h1>
        <p className="mt-2 max-w-xl text-base text-muted-foreground">
          See the GMP, subscription, your allotment odds and a scored prospectus before you bid.
        </p>
      </div>
      <p className="text-sm text-muted-foreground lg:shrink-0">
        <span className="font-mono font-medium tabular-nums text-foreground">{openCount}</span> open now,{" "}
        <span className="font-mono font-medium tabular-nums text-foreground">{upcomingCount}</span> upcoming
      </p>
    </section>
  );
}
