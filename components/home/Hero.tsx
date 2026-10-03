import { ProgressLink } from '@/components/progress/ProgressLink';

/** Home opener: the tagline and what the site shows, beside today's open, awaiting-listing and upcoming counts. */
export function Hero({ openCount, closedCount, upcomingCount }: { openCount: number; closedCount: number; upcomingCount: number }) {
  const stats = [
    { count: openCount, label: 'Open now', href: '/ipos?filter=live' },
    { count: closedCount, label: 'Awaiting listing', href: '/ipos?filter=closed' },
    { count: upcomingCount, label: 'Upcoming', href: '/ipos?filter=upcoming' },
  ];

  return (
    <section className="flex flex-col gap-6 py-6 sm:py-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
      <div>
        <h1 className="type-hero text-[32px] sm:text-[40px]">
          Milega? <span className="highlight">Check first.</span>
        </h1>
        <p className="mt-2 max-w-xl text-base text-muted-foreground">
          See the GMP, subscription, your allotment odds and a scored prospectus before you bid.
        </p>
      </div>
      <nav aria-label="IPOs by stage" className="grid grid-cols-3 gap-2 sm:gap-3 lg:w-[26rem] lg:shrink-0">
        {stats.map(({ count, label, href }) => (
          <ProgressLink
            key={label}
            href={href}
            className="card-lift group rounded-xl border border-border bg-card px-3 py-2.5 active:scale-[0.98] sm:px-4 sm:py-3"
          >
            <span className="block font-mono text-2xl font-medium tabular-nums text-foreground">{count}</span>
            <span className="block truncate text-xs text-muted-foreground transition-colors group-hover:text-foreground">{label}</span>
          </ProgressLink>
        ))}
      </nav>
    </section>
  );
}
