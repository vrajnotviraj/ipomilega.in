'use client';

import { Ipo } from '@/app/models/ipo';
import { ProgressLink } from '../Progressbar/ProgressLink';

/**
 * The company name is the navigation affordance on every IPO card and row -- clicking it opens
 * the analysis page. It replaced the small "↗" button that used to sit in each card's top-right
 * corner, so this renders a real <a> (middle-click, open-in-new-tab and crawlers all work).
 * Falls back to plain text when there is no published analysis to link to yet.
 */
export function IpoTitleLink({
  ipo,
  hasAnalysis,
  className = '',
}: {
  ipo: Ipo | null;
  hasAnalysis: boolean;
  className?: string;
}) {
  const name = ipo?.upcoming_ipo_2025 || 'Company Name';

  if (!hasAnalysis || !ipo?.slug) {
    return <span className={className}>{name}</span>;
  }

  return (
    <ProgressLink
      href={`/analysis/${ipo.slug}`}
      className={`hover:text-primary hover:underline underline-offset-4 decoration-primary/40 transition-colors ${className}`}
    >
      {name}
    </ProgressLink>
  );
}
