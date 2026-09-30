import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/** Home section title on the left, with an optional badge and subtitle, and an optional "View all" link on the right. */
export function SectionHeading({
  title,
  badge,
  subtitle,
  href,
  linkLabel,
  linkText = 'View all',
}: {
  title: string;
  badge?: React.ReactNode;
  subtitle?: string;
  href?: string;
  /** Screen-reader name for the link, e.g. "View all 12 live IPOs". */
  linkLabel?: string;
  linkText?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="type-h2 flex flex-wrap items-center gap-x-3 gap-y-1 text-balance text-foreground">
          {title}
          {badge}
        </h2>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          aria-label={linkLabel}
          className="group inline-flex shrink-0 items-center gap-1 pb-1 text-sm font-medium text-primary transition-transform active:scale-[0.98] sm:text-base"
        >
          {linkText}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}
