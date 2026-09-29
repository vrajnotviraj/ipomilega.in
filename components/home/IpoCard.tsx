import { useState } from 'react';
import { Clock, TrendingUp, Layers, User, Users, Landmark, Building2, ChevronRight, ArrowUpRight } from 'lucide-react';
import { Ipo } from '@/types/ipo';
import { IpoComprehensiveAnalysis } from '@/types/ipo-comprehensive-analysis';
import { Badge } from '@/components/ui/badge';
import { IpoTitleLink } from '@/components/ipo/IpoTitleLink';
import { IpoLogo } from '@/components/ipo/IpoLogo';
import { AllotmentPredictorModal } from '@/components/ipo/AllotmentPredictorModal';
import {
  getDaysUntilClosing,
  getRiskTextColor,
  getAllotmentProbability,
  parseGainValue,
  parseEstListingPercent,
  getIpoType,
  getProbabilityColor,
  formatAllotmentPercent,
  formatShortDateOrToday,
  formatIssueSize,
  ALLOTMENT_CATEGORIES,
  getAllotmentRatio,
  AllotmentCategoryDef,
  getQibSignal,
  getQibColor,
  applyQibAdjustment,
  describeQibAdjustment,
  getAllotmentCheckUrl,
} from '@/lib/ipo-format';

const ALLOTMENT_ICONS: Record<AllotmentCategoryDef['key'], typeof User> = {
  retail: User,
  shni: Users,
  bhni: Landmark,
};

// Phones have no hover, so tappable tiles show a tinted border and chevron at rest.
const TAPPABLE_TILE =
  'group relative flex flex-col items-center gap-1 text-center py-2 rounded-lg border border-primary/25 bg-primary/[0.04] hover:border-primary/60 hover:bg-accent active:scale-[0.97] transition-all cursor-pointer';

interface IpoCardProps {
  ipo: Ipo | null;
  analysis: IpoComprehensiveAnalysis | null;
}

const formatGmp = (percent: number | null) => (percent === null ? 'N/A' : `${percent >= 0 ? '+' : ''}${percent}%`);
const gmpColor = (percent: number | null, noGmpColor: string) =>
  percent === null ? noGmpColor : percent >= 0 ? 'text-score-good' : 'text-score-bad';
const formatTimes = (ratio: number | null) => (ratio === null ? 'N/A' : `${ratio}x`);

export function LiveIpoCard({ ipo, analysis }: IpoCardProps) {
  const [predictorCategory, setPredictorCategory] = useState<AllotmentCategoryDef['key'] | null>(null);

  const days = getDaysUntilClosing(ipo);
  const riskScore = analysis?.risk_meter?.score || 0;
  const closesInLabel = days < 0 ? 'TBA' : days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'}`;
  const closesInColor = days === 0 ? 'text-score-bad' : days === 1 || days === 2 ? 'text-score-mid' : 'text-foreground';

  const qibSignal = getQibSignal(ipo);
  const gmpPercent = parseEstListingPercent(ipo?.gmp_price_gain);

  const allotmentCategories = ALLOTMENT_CATEGORIES.map((cat) => {
    const { lottery } = getAllotmentRatio(ipo, cat);
    return {
      ...cat,
      icon: ALLOTMENT_ICONS[cat.key],
      probability: getAllotmentProbability(lottery),
      odds: formatAllotmentPercent(lottery),
    };
  });

  return (
    <div className="w-full max-w-sm mx-auto h-full flex flex-col rounded-xl border border-border bg-card p-5 font-sans">
      <div className="mb-4">
        <Badge variant="outline" className="rounded-md border-border bg-transparent text-foreground text-[11px] font-mono font-medium uppercase tracking-wide px-2 py-1">
          {getIpoType(ipo)}
        </Badge>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <IpoLogo src={ipo?.image_url} name={ipo?.upcoming_ipo_2025} size="lg" />
        <h2 data-tour="ipo-name" className="text-lg font-semibold font-serif text-foreground leading-snug min-w-0">
          <IpoTitleLink ipo={ipo} hasAnalysis={riskScore > 0} />
        </h2>
      </div>

      <div data-tour="demand" className="grid grid-cols-3 gap-2 mb-4">
        <div>
          <div className="text-xs text-foreground/70 flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3" /> GMP
          </div>
          <div className="font-mono text-sm font-medium flex items-center gap-1.5">
            <span className={gmpColor(gmpPercent, 'text-foreground')}>{formatGmp(gmpPercent)}</span>
          </div>
        </div>
        {/* QIB apart from the total, colored only once it means something (see getQibSignal). */}
        <div
          className="text-center"
          title={qibSignal ? 'Institutional (QIB) subscription' : 'Institutions mostly bid on the closing day, so this is usually near 0x until then'}
        >
          <div className="text-xs text-foreground/70 flex items-center gap-1 mb-1 justify-center">
            <Building2 className="w-3 h-3" /> QIB
          </div>
          <div className={`font-mono text-sm font-medium ${getQibColor(qibSignal)}`}>{formatTimes(parseGainValue(ipo?.qib_sr))}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-foreground/70 flex items-center gap-1 mb-1 justify-end">
            <Layers className="w-3 h-3" /> Total
          </div>
          <div className="font-mono text-sm font-medium text-foreground">{formatTimes(parseGainValue(ipo?.total_sr))}</div>
        </div>
      </div>

      <div data-tour="odds" className="mb-4">
        <div className="text-xs text-foreground/70 mb-1.5">Allotment odds</div>
        <div className="grid grid-cols-3 gap-2">
          {allotmentCategories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setPredictorCategory(cat.key)}
              className={TAPPABLE_TILE}
              aria-label={`${cat.label} allotment odds ${cat.odds}, tap for details`}
            >
              <ChevronRight className="absolute top-1 right-1 w-3 h-3 text-primary/60 group-hover:text-primary transition-colors" />
              <cat.icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className={`font-mono text-sm font-semibold whitespace-nowrap ${getProbabilityColor(cat.probability)}`}>{cat.odds}</span>
              <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground leading-tight">
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <hr className="border-border mb-4" />

      <div className="mt-auto flex items-start justify-between">
        <div>
          <div className="text-xs text-foreground/70 flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3" /> {closesInLabel === 'Today' ? 'Closes' : 'Closes in'}
          </div>
          <div className={`font-mono text-base font-semibold ${closesInColor}`}>{closesInLabel}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-foreground/70 flex items-center gap-1 mb-1 justify-end">
            <Layers className="w-3 h-3" /> Issue size
          </div>
          <div className="font-mono text-sm font-semibold text-foreground">{formatIssueSize(ipo?.ipo_details?.issue_size) || formatIssueSize(ipo?.ipo_size) || 'Size TBA'}</div>
        </div>
      </div>

      <AllotmentPredictorModal
        ipo={ipo}
        companyName={ipo?.upcoming_ipo_2025 || 'Company'}
        initialCategory={predictorCategory}
        onClose={() => setPredictorCategory(null)}
      />
    </div>
  );
}

// Bidding has ended but the stock has not listed: final GMP, subscription, listing date and allotment link.
export function ClosedIpoCard({ ipo, analysis }: IpoCardProps) {
  const baseScore = analysis?.risk_meter?.score || 0;
  const qibSignal = getQibSignal(ipo);
  const riskScore = applyQibAdjustment(baseScore, qibSignal);

  const gmpPercent = parseEstListingPercent(ipo?.gmp_price_gain);
  const allotmentCheckUrl = getAllotmentCheckUrl(ipo);

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-secondary p-4 font-sans">
      <div className="flex items-center gap-3">
        <IpoLogo src={ipo?.image_url} name={ipo?.upcoming_ipo_2025} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="font-serif font-semibold text-foreground truncate">
            <IpoTitleLink ipo={ipo} hasAnalysis={riskScore > 0} />
          </div>
          <div className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">{getIpoType(ipo)}</div>
        </div>
        <span
          className={`font-serif font-semibold text-xl flex-shrink-0 ${riskScore > 0 ? getRiskTextColor(riskScore) : 'text-muted-foreground/40'}`}
          title={describeQibAdjustment(baseScore, qibSignal)}
        >
          {riskScore > 0 ? riskScore : '–'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">GMP</div>
          <div className={`font-mono font-medium ${gmpColor(gmpPercent, 'text-muted-foreground/40')}`}>{formatGmp(gmpPercent)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Subscribed</div>
          <div className="font-mono font-medium text-foreground">{formatTimes(parseGainValue(ipo?.total_sr))}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Lists</div>
          <div className="font-mono font-medium text-foreground">{formatShortDateOrToday(ipo?.ipo_dates?.ipo_listing_date)}</div>
        </div>
      </div>

      {allotmentCheckUrl && (
        <a
          href={allotmentCheckUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-tour="check-allotment"
          className="inline-flex items-center justify-center gap-1 rounded-md bg-primary py-2 text-xs font-mono font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          Check allotment
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}
