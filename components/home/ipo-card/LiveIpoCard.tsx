import { ArrowRight, Clock, FileText } from 'lucide-react';
import { AllotmentOddsTiles } from '@/components/ipo-shared/AllotmentOddsTiles';
import { ProgressLink } from '@/components/progress/ProgressLink';
import { cn } from '@/lib/utils';
import { formatGmp, formatIssueSize, formatTimes, gainColor, gainMotion, parseEstListingPercent, parseGainValue } from '@/lib/ipo-format';
import { getQibColor, getQibSignal, scoreOf } from '@/lib/ipo-score';
import { CardHeader, IpoCardProps, Stat } from './CardParts';

/** Card for an IPO open for bidding. Shows demand and odds once bids are in, else GMP and a link to the analysis. */
export function LiveIpoCard({ ipo, analysis }: IpoCardProps) {
  const hasBids = parseGainValue(ipo?.qib_sr) !== null || parseGainValue(ipo?.total_sr) !== null;

  return (
    <article className="card-lift flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <CardHeader ipo={ipo} analysis={analysis} />
      {hasBids ? <BidStats ipo={ipo} /> : <PreBidStats ipo={ipo} hasAnalysis={scoreOf({ analysis }) > 0} />}
    </article>
  );
}

function issueSizeOf(ipo: IpoCardProps['ipo']) {
  return formatIssueSize(ipo?.ipo_details?.issue_size) || formatIssueSize(ipo?.ipo_size) || 'Size TBA';
}

function GmpStat({ ipo }: { ipo: IpoCardProps['ipo'] }) {
  const gmpPercent = parseEstListingPercent(ipo?.gmp_price_gain);
  return <Stat label="GMP" value={formatGmp(gmpPercent)} valueClass={cn(gainColor(gmpPercent), gainMotion(gmpPercent))} />;
}

/** GMP, QIB and total subscription, the odds per category, then issue size. */
function BidStats({ ipo }: { ipo: IpoCardProps['ipo'] }) {
  const qibSignal = getQibSignal(ipo);
  const qibHint = qibSignal
    ? 'Institutional (QIB) subscription'
    : 'Institutions mostly bid on the closing day, so this is usually near 0x until then';

  return (
    <>
      <div data-tour="demand" className="grid grid-cols-3 gap-2">
        <GmpStat ipo={ipo} />
        <Stat label="QIB" value={formatTimes(parseGainValue(ipo?.qib_sr))} valueClass={getQibColor(qibSignal)} className="text-center" title={qibHint} />
        <Stat label="Subscribed" value={formatTimes(parseGainValue(ipo?.total_sr))} className="text-right" />
      </div>

      <AllotmentOddsTiles ipo={ipo} companyName={ipo?.upcoming_ipo_2025 || 'Company'} format="percent" variant="compact" heading="Allotment odds" />

      <div className="mt-auto flex items-baseline justify-between gap-3 border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">Issue size</span>
        <span className="text-right font-mono text-sm font-medium tabular-nums text-foreground">{issueSizeOf(ipo)}</span>
      </div>
    </>
  );
}

/** GMP and issue size, a note that odds come later, then the analysis link. */
function PreBidStats({ ipo, hasAnalysis }: { ipo: IpoCardProps['ipo']; hasAnalysis: boolean }) {
  return (
    <>
      <div data-tour="demand" className="flex items-start justify-between gap-3">
        <GmpStat ipo={ipo} />
        <Stat label="Issue size" value={issueSizeOf(ipo)} className="text-right" />
      </div>

      <p className="text-xs text-muted-foreground">Subscription and allotment odds show up once bidding numbers come in.</p>

      <div className="mt-auto border-t border-border pt-4">
        {hasAnalysis && ipo?.slug ? <AnalysisLink slug={ipo.slug} /> : <AnalysisComingSoon />}
      </div>
    </>
  );
}

const PILL = 'flex w-full items-center justify-center gap-1.5 rounded-full py-2';

function AnalysisLink({ slug }: { slug: string }) {
  return (
    <ProgressLink
      href={`/analysis/${slug}`}
      className={cn(PILL, 'group press border border-primary/25 text-sm font-medium text-foreground hover:border-primary/40 hover:bg-secondary')}
    >
      <FileText className="size-4 text-primary/70" strokeWidth={2} aria-hidden />
      Read the analysis
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} aria-hidden />
    </ProgressLink>
  );
}

function AnalysisComingSoon() {
  return (
    <div className={cn(PILL, 'border border-dashed border-border text-xs text-muted-foreground')}>
      <Clock className="size-3.5" strokeWidth={2} aria-hidden />
      Analysis coming soon
    </div>
  );
}
