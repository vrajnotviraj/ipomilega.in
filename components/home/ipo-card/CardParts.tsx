import { Ipo } from '@/types/ipo';
import { IpoComprehensiveAnalysis } from '@/types/ipo-comprehensive-analysis';
import { IpoLogo } from '@/components/ipo-shared/IpoLogo';
import { IpoTitleLink } from '@/components/ipo-shared/IpoTitleLink';
import { Score } from '@/components/ui/Score';
import { applyQibAdjustment, describeQibAdjustment, getQibSignal, scoreOf } from '@/lib/ipo-score';
import { cn } from '@/lib/utils';

export interface IpoCardProps {
  ipo: Ipo | null;
  analysis: IpoComprehensiveAnalysis | null;
}

/** One labelled figure in a card's stats row. */
export function Stat({
  label,
  value,
  valueClass = 'text-foreground',
  className,
  title,
}: {
  label: string;
  value: string;
  valueClass?: string;
  className?: string;
  title?: string;
}) {
  return (
    <div className={className} title={title}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn('mt-1 font-mono text-sm font-medium tabular-nums', valueClass)}>{value}</div>
    </div>
  );
}

/** Top row of a home IPO card: logo, company name, and the QIB-adjusted analysis score unless `aside` replaces it. */
export function CardHeader({ ipo, analysis, aside }: IpoCardProps & { aside?: React.ReactNode }) {
  const baseScore = scoreOf({ analysis });
  const qibSignal = getQibSignal(ipo);
  const score = applyQibAdjustment(baseScore, qibSignal);

  return (
    <div className="flex items-center gap-3">
      <IpoLogo src={ipo?.image_url} name={ipo?.upcoming_ipo_2025} size="lg" />
      <h4 data-tour="ipo-name" className="min-w-0 flex-1 font-display text-lg font-bold leading-tight tracking-[-0.015em] text-foreground sm:text-xl">
        <IpoTitleLink ipo={ipo} hasAnalysis={score > 0} />
      </h4>
      {aside ?? <Score value={score} title={describeQibAdjustment(baseScore, qibSignal)} />}
    </div>
  );
}
