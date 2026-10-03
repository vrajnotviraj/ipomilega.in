import { AllotmentOddsTiles } from '@/components/ipo-shared/AllotmentOddsTiles';
import { formatGmp, formatIssueSize, formatTimes, gainColor, getQibColor, getQibSignal, parseEstListingPercent, parseGainValue } from '@/lib/ipo-format';
import { CardHeader, IpoCardProps, Stat } from './CardParts';

/** Card for an IPO open for bidding: GMP and demand, allotment odds per category, issue size. */
export function LiveIpoCard({ ipo, analysis }: IpoCardProps) {
  const gmpPercent = parseEstListingPercent(ipo?.gmp_price_gain);
  const qibSignal = getQibSignal(ipo);
  const issueSize = formatIssueSize(ipo?.ipo_details?.issue_size) || formatIssueSize(ipo?.ipo_size) || 'Size TBA';
  const qibHint = qibSignal
    ? 'Institutional (QIB) subscription'
    : 'Institutions mostly bid on the closing day, so this is usually near 0x until then';

  return (
    <article className="card-lift flex h-full flex-col gap-4 rounded-xl border border-score-good/20 bg-tint-live p-5">
      <CardHeader ipo={ipo} analysis={analysis} />

      <div data-tour="demand" className="grid grid-cols-3 gap-2">
        <Stat label="GMP" value={formatGmp(gmpPercent)} valueClass={gainColor(gmpPercent)} />
        <Stat label="QIB" value={formatTimes(parseGainValue(ipo?.qib_sr))} valueClass={getQibColor(qibSignal)} className="text-center" title={qibHint} />
        <Stat label="Subscribed" value={formatTimes(parseGainValue(ipo?.total_sr))} className="text-right" />
      </div>

      <AllotmentOddsTiles
        ipo={ipo}
        companyName={ipo?.upcoming_ipo_2025 || 'Company'}
        format="percent"
        variant="compact"
        heading="Allotment odds"
      />

      <div className="mt-auto flex items-baseline justify-between gap-3 border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">Issue size</span>
        <span className="text-right font-mono text-sm font-medium tabular-nums text-foreground">{issueSize}</span>
      </div>
    </article>
  );
}
