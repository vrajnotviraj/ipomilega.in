// ClosedIposSection.tsx
'use client';

import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';
import { IpoSectionProps } from '@/app/types/homepage';
import { ClosedIpoRow } from './IpoCard';

export function ClosedIposSection({ ipos, count }: IpoSectionProps) {
  const visibleIpos = ipos.slice(0, 6);

  if (ipos.length === 0) {
    return null;
  }

  return (
    <section className="py-15">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center gap-2 sm:gap-4 mb-2">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold font-serif text-foreground flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="truncate">Bidding closed</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono font-medium uppercase tracking-wide text-chart-5 flex-shrink-0">
              <Lock className="w-3 h-3" />
              Closed
            </span>
          </h2>
          <Link
            href="/ipos?filter=closed"
            aria-label={`View all ${count} closed IPOs`}
            className="text-primary font-sans hover:text-primary/80 font-medium flex items-center space-x-1.5 group text-sm sm:text-base transition-colors duration-200 flex-shrink-0"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="border-t border-border">
          {visibleIpos.map((item) => (
            <ClosedIpoRow key={item._id} ipo={item.ipo} analysis={item.analysis} />
          ))}
        </div>
      </div>
    </section>
  );
}
