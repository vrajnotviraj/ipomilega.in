import React, { useState } from 'react';
import { Calendar, CheckCircle, ClockAlert, Clock, TrendingUp, Layers, User, Users, Landmark, Building2, ChevronRight, ArrowUpRight } from 'lucide-react';
import { Ipo } from '@/app/models/ipo';
import { IpoComprehensiveAnalysis } from '@/app/models/ipo_comprehensive_analysis';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useProgressRouter } from '../Progressbar/useProgressRouter';
import { IpoTitleLink } from './IpoTitleLink';
import { IpoLogo } from './IpoLogo';
import { AllotmentPredictorModal } from './AllotmentPredictorModal';
import {
  getDaysUntilClosing,
  getRiskBorderColor,
  getRiskTextColor,
  parseCardDate,
  getAllotmentProbability,
  parseGainValue,
  parseEstListingPercent,
  getIpoType,
  getProbabilityColor,
  formatAllotmentPercent,
  formatShortDateOrToday,
  formatIssueSize,
  ALLOTMENT_CATEGORIES,
  AllotmentCategoryDef,
  getQibSignal,
  getQibColor,
  applyQibAdjustment,
  describeQibAdjustment,
  getAllotmentCheckUrl,
} from './ipoFormat';

const ALLOTMENT_ICONS: Record<AllotmentCategoryDef['key'], typeof User> = {
  retail: User,
  shni: Users,
  bhni: Landmark,
};

// Tappable tiles need to *look* tappable on phones, where there is no hover to discover them:
// a primary-tinted border and a chevron at rest, plus press feedback. (Testers tapped a plain
// number, saw nothing change, and concluded nothing on the card was clickable.)
const TAPPABLE_TILE =
  'group relative flex flex-col items-center gap-1 text-center py-2 rounded-lg border border-primary/25 bg-primary/[0.04] hover:border-primary/60 hover:bg-accent active:scale-[0.97] transition-all cursor-pointer';

interface IpoCardProps {
  ipo: Ipo | null;
  analysis: IpoComprehensiveAnalysis | null;
}

// Utility function for getting company initials
const getInitials = (name: string) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((word: string) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Live IPO Card Component
export function LiveIpoCard({ ipo, analysis }: IpoCardProps) {
  const [predictorCategory, setPredictorCategory] = useState<AllotmentCategoryDef['key'] | null>(null);

  const daysUntilClosing = getDaysUntilClosing(ipo);
  const riskScore = analysis?.risk_meter?.score || 0;
  const closesInLabel =
    daysUntilClosing < 0 ? 'TBA' : daysUntilClosing === 0 ? 'Today' : `${daysUntilClosing} day${daysUntilClosing === 1 ? '' : 's'}`;
  const closesInColor =
    daysUntilClosing < 0 ? 'text-foreground' : daysUntilClosing <= 0 ? 'text-score-bad' : daysUntilClosing <= 2 ? 'text-score-mid' : 'text-foreground';

  const totalSubscription = parseGainValue(ipo?.total_sr);
  const qibSubscription = parseGainValue(ipo?.qib_sr);
  const qibSignal = getQibSignal(ipo);
  const ipoType = getIpoType(ipo);

  const gmpPercent = parseEstListingPercent(ipo?.gmp_price_gain);
  const gmpIsPositive = gmpPercent !== null && gmpPercent >= 0;

  const allotmentCategories = ALLOTMENT_CATEGORIES.map((cat) => {
    const ratio = parseGainValue(ipo?.[cat.ratioField]);
    return {
      ...cat,
      icon: ALLOTMENT_ICONS[cat.key],
      probability: getAllotmentProbability(ratio),
      odds: formatAllotmentPercent(ratio),
    };
  });

  return (
    <div className="w-full max-w-sm mx-auto h-full flex flex-col rounded-xl border border-border bg-card p-5 font-sans">
      <div className="mb-4">
        <Badge variant="outline" className="rounded-md border-border bg-transparent text-foreground text-[11px] font-mono font-medium uppercase tracking-wide px-2 py-1">
          {ipoType}
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
            <span className={gmpPercent !== null ? (gmpIsPositive ? 'text-score-good' : 'text-score-bad') : 'text-foreground'}>
              {gmpPercent !== null ? `${gmpIsPositive ? '+' : ''}${gmpPercent}%` : 'N/A'}
            </span>
          </div>
        </div>
        {/* QIB on its own: institutions bid on the closing day, and their demand is the signal
            a blended total hides. Coloured only once it can mean something -- see getQibSignal. */}
        <div
          className="text-center"
          title={qibSignal ? 'Institutional (QIB) subscription' : 'Institutions mostly bid on the closing day, so this is usually near 0x until then'}
        >
          <div className="text-xs text-foreground/70 flex items-center gap-1 mb-1 justify-center">
            <Building2 className="w-3 h-3" /> QIB
          </div>
          <div className={`font-mono text-sm font-medium ${getQibColor(qibSignal)}`}>{qibSubscription !== null ? `${qibSubscription}x` : 'N/A'}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-foreground/70 flex items-center gap-1 mb-1 justify-end">
            <Layers className="w-3 h-3" /> Total
          </div>
          <div className="font-mono text-sm font-medium text-foreground">{totalSubscription !== null ? `${totalSubscription}x` : 'N/A'}</div>
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

// Closed IPO Card — bidding has ended but the stock hasn't listed yet. Deliberately lighter than
// the live card: final GMP and subscription, the listing date, and where to check allotment
// once it's out. ClosedIposSection groups these by allotment day.
export function ClosedIpoCard({ ipo, analysis }: IpoCardProps) {
  const baseScore = analysis?.risk_meter?.score || 0;
  const qibSignal = getQibSignal(ipo);
  const riskScore = applyQibAdjustment(baseScore, qibSignal);

  const gmpPercent = parseEstListingPercent(ipo?.gmp_price_gain);
  const gmpIsPositive = gmpPercent !== null && gmpPercent >= 0;
  const totalSubscription = parseGainValue(ipo?.total_sr);
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
          <div className={`font-mono font-medium ${gmpPercent !== null ? (gmpIsPositive ? 'text-score-good' : 'text-score-bad') : 'text-muted-foreground/40'}`}>
            {gmpPercent !== null ? `${gmpIsPositive ? '+' : ''}${gmpPercent}%` : 'N/A'}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Subscribed</div>
          <div className="font-mono font-medium text-foreground">{totalSubscription !== null ? `${totalSubscription}x` : 'N/A'}</div>
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

// Upcoming IPO Card Component
export function UpcomingIpoCard({ ipo, analysis }: IpoCardProps) {
  const router = useProgressRouter();

  const handleViewAnalysis = (ipo: Ipo) => {
    router.push(`/analysis/${ipo?.slug}`);
  };
  const getDaysUntilOpening = () => {
    const dateStr = ipo?.ipo_dates?.ipo_open_date || ipo?.open_date;
    const openingDate = parseCardDate(dateStr);
    if (!openingDate) return -1;

    openingDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = openingDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilOpening = getDaysUntilOpening();
  const riskScore = analysis?.risk_meter?.score || 0;
  const riskBorderColor = getRiskBorderColor(riskScore);
  const riskTextColor = getRiskTextColor(riskScore);

  return (
    <Card className={`w-full max-w-sm mx-auto h-full border-b-6 ${riskBorderColor} shadow-sm font-sans`} style={{ borderRadius: '8px', borderTop: 'none', borderLeft: 'none', borderRight: 'none', boxShadow: 'none' }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="w-full">
          <div className="flex flex-col sm:flex-row gap-2">
            <Badge variant="outline" className="bg-secondary border-border text-foreground text-xs font-medium w-fit">
              {ipo?.ipo_type || 'N/A'}
            </Badge>
            <Badge variant="secondary"
              suppressHydrationWarning
              className="bg-card text-primary text-xs font-medium border border-primary/30 w-fit">
              📅 <span className="font-mono">{daysUntilOpening < 0 ? "TBA" : daysUntilOpening + "d to go"}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-left justify-left">
          <div className="flex flex-row items-center justify-left gap-3">
            <Avatar className="w-15 h-15 sm:w-16 sm:h-16 flex-shrink-0">
              {ipo?.image_url ? (
                <AvatarImage
                  src={ipo.image_url}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <AvatarFallback className="text-primary-foreground bg-primary border-primary border-2 text-xs font-medium">
                  {getInitials(ipo?.upcoming_ipo_2025 || '')}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col items-left justify-left min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold font-serif truncate">{ipo?.upcoming_ipo_2025 || 'Company Name'}</h2>
              <p className="text-sm text-muted-foreground font-mono truncate">{formatIssueSize(ipo?.ipo_details?.issue_size) || formatIssueSize(ipo?.ipo_size) || 'Size TBA'}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-left justify-center mt-3">
          <div className="flex flex-row items-left justify-center gap-3">
            <div className="w-full py-3">
              <h3 className="text-sm sm:text-md text-foreground flex items-left space-x-1 font-semibold mb-1">
                <Calendar className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                <span className="text-sm sm:text-md font-semibold font-sans">Timeline</span>
              </h3>
              <div className="text-left flex flex-row items-left justify-between gap-2">
                <span className="font-normal block font-sans text-sm text-muted-foreground">Expected Opening Date</span>
                <span className="font-medium block font-mono text-sm">{ipo?.ipo_dates?.ipo_open_date || 'TBA'}</span>
              </div>
              <div className="text-left flex flex-row items-left justify-between gap-2">
                <span className="font-normal block font-sans text-sm text-muted-foreground">Expected Closing Date</span>
                <span className="font-medium block font-mono text-sm">{ipo?.ipo_dates?.ipo_close_date || 'TBA'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
          <div className={`text-center p-2 sm:p-3 bg-card rounded-lg border border-border shadow-sm`}>
            <h4 className={`text-xs font-medium mb-1 text-muted-foreground`}>Expected GMP</h4>
            <div className="flex items-center justify-center space-x-1">
              <span className={`text-xs sm:text-sm text-score-good font-mono font-semibold`}>₹{ipo?.gmp_ipo_gmp || 'TBA'}</span>
            </div>
          </div>
          <div className={`text-center p-2 sm:p-3 bg-card rounded-lg border border-border shadow-sm`}>
            <h4 className={`text-xs font-medium mb-1 text-muted-foreground`}>Risk Score</h4>
            <span className={`text-sm sm:text-base ${riskTextColor} font-serif font-semibold`}>{riskScore}/10</span>
          </div>
        </div>
        <hr className="my-4 border-border" />
        <div className="mt-6">
          {
            riskScore > 0 ? (
              <Button variant="outline" className="w-full bg-primary text-primary-foreground border-primary hover:bg-background hover:text-primary text-sm py-2 font-medium transition-colors" onClick={() => handleViewAnalysis(ipo!)}>
                Pre-Analysis
              </Button>
            ) : (
              <Button variant="outline" disabled className="w-full bg-muted text-muted-foreground cursor-not-allowed text-sm py-2 font-medium">
                <ClockAlert className="w-4 h-4 mr-2" />
                Analysis Unavailable
              </Button>
            )
          }
        </div>
      </CardContent>
    </Card>
  );
}

// Past IPO Card Component
export function PastIpoCard({ ipo, analysis }: IpoCardProps) {
  const router = useProgressRouter();

  const handleViewAnalysis = (ipo: Ipo) => {
    router.push(`/analysis/${ipo?.slug}`);
  };
  const riskScore = analysis?.risk_meter?.score || 0;
  const riskBorderColor = getRiskBorderColor(riskScore);

  return (
    <Card className={`w-full max-w-sm mx-auto h-full border-b-6 ${riskBorderColor} shadow-sm font-sans`} style={{ borderRadius: '8px', borderTop: 'none', borderLeft: 'none', borderRight: 'none', boxShadow: 'none' }} >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="w-full">
          <div className="flex flex-col sm:flex-row gap-2">
            <Badge variant="outline" className="bg-secondary border-border text-foreground text-xs font-medium w-fit">
              {ipo?.ipo_type || 'N/A'}
            </Badge>
            <Badge variant="secondary"
              className="bg-card text-score-good text-xs font-medium border border-score-good/30 w-fit">
              ✅ Listed
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-left justify-left">
          <div className="flex flex-row items-center justify-left gap-3">
            <Avatar className="w-15 h-15 sm:w-16 sm:h-16 flex-shrink-0">
              {ipo?.image_url ? (
                <AvatarImage
                  src={ipo.image_url}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <AvatarFallback className="text-primary-foreground bg-primary border-primary border-2 text-xs font-medium">
                  {getInitials(ipo?.upcoming_ipo_2025 || '')}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col items-left justify-left min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold font-serif truncate">{ipo?.upcoming_ipo_2025 || 'Company Name'}</h2>
              <p className="text-sm text-muted-foreground font-mono truncate">{formatIssueSize(ipo?.ipo_size) || 'Size TBA'}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-left justify-center mt-3">
          <div className="flex flex-row items-left justify-center gap-3">
            <div className="w-full py-3">
              <h3 className="text-sm sm:text-md text-foreground flex items-left space-x-1 font-semibold mb-1">
                <CheckCircle className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                <span className="text-sm sm:text-md font-semibold font-sans">Performance</span>
              </h3>
              <div className="text-left flex flex-row items-left justify-between gap-2">
                <span className="font-medium block font-sans text-sm text-muted-foreground">Listed</span>
                <span className="font-medium block font-mono text-sm">{ipo?.ipo_dates?.ipo_listing_date || 'N/A'}</span>
              </div>
              <div className="text-left flex flex-row items-left justify-between gap-2">
                <span className="font-medium block font-sans text-sm text-muted-foreground">Listing Price</span>
                <span className="font-medium block font-mono text-sm">₹{ipo?.listing_price || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
          <div className={`text-center p-2 sm:p-3 bg-card rounded-lg border border-border shadow-sm`}>
            <h4 className={`text-xs font-medium mb-1 text-muted-foreground`}>Current Price</h4>
            <span className={`text-xs sm:text-sm font-mono font-semibold`}>₹{ipo?.listing_price || 'N/A'}</span>
          </div>
          <div className={`text-center p-2 sm:p-3 bg-card rounded-lg border border-border shadow-sm`}>
            <h4 className={`text-xs font-medium mb-1 text-muted-foreground`}>Total Return</h4>
            <span className={`text-xs sm:text-sm text-score-good font-mono font-semibold`}>{ipo?.listing_gain || 'N/A'}</span>
          </div>
        </div>
        <hr className="my-4 border-border" />
        <div className="mt-6">
          {
            riskScore > 0 ? (
              <Button variant="outline" className="w-full bg-primary text-primary-foreground border-primary hover:bg-background hover:text-primary text-sm py-2 font-medium transition-colors" onClick={() => handleViewAnalysis(ipo!)}>
                View Analysis
              </Button>
            ) : (
              <Button variant="outline" disabled className="w-full bg-muted text-muted-foreground cursor-not-allowed text-sm py-2 font-medium">
                <ClockAlert className="w-4 h-4 mr-2" />
                Analysis Unavailable
              </Button>
            )
          }
        </div>
      </CardContent>
    </Card>
  );
}