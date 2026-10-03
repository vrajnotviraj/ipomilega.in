import { Ipo } from '@/types/ipo';
import { ArrowUpRight } from 'lucide-react';
import { ProgressLink } from '@/components/progress/ProgressLink';

// Company name linking to its analysis page, or plain text when there is no analysis yet.
export function IpoTitleLink({ ipo, hasAnalysis }: { ipo: Ipo | null; hasAnalysis: boolean }) {
  const name = ipo?.upcoming_ipo_2025 || '';

  if (!hasAnalysis || !ipo?.slug) {
    return <span>{name}</span>;
  }

  // Underline and arrow show at rest because phones have no hover.
  return (
    <ProgressLink
      href={`/analysis/${ipo.slug}`}
      className="underline decoration-dotted decoration-primary/50 underline-offset-4 hover:text-primary hover:decoration-solid active:text-primary transition-colors"
    >
      {name}
      <ArrowUpRight aria-hidden className="inline-block w-[0.8em] h-[0.8em] ml-0.5 -mt-0.5 align-middle text-primary/70" />
    </ProgressLink>
  );
}
