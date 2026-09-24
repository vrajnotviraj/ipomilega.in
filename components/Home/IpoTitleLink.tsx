'use client';

import { Ipo } from '@/app/models/ipo';
import { ArrowUpRight } from 'lucide-react';
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

  // Underline and arrow are visible at rest, not just on hover: phones have no hover, and testers
  // didn't realise the name opened anything.
  return (
    <ProgressLink
      href={`/analysis/${ipo.slug}`}
      className={`underline decoration-dotted decoration-primary/50 underline-offset-4 hover:text-primary hover:decoration-solid active:text-primary transition-colors ${className}`}
    >
      {name}
      <ArrowUpRight aria-hidden className="inline-block w-[0.8em] h-[0.8em] ml-0.5 -mt-0.5 align-middle text-primary/70" />
    </ProgressLink>
  );
}
