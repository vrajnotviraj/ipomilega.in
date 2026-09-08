import React, { useState } from 'react';
import { Calendar, CheckCircle, ClockAlert, Clock, ArrowUpRight, TrendingUp, Layers, User, Users, Landmark } from 'lucide-react';
import { Ipo } from '@/app/models/ipo';
import { IpoComprehensiveAnalysis } from '@/app/models/ipo_comprehensive_analysis';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useProgressRouter } from '../Progressbar/useProgressRouter';
import { AllotmentPredictorModal } from './AllotmentPredictorModal';
import {
  getRiskBorderColor,
  getRiskTextColor,
  parseCardDate,
  getAllotmentProbability,
  parseGainValue,
  getIpoType,
  getProbabilityColor,
  ALLOTMENT_CATEGORIES,
  AllotmentCategoryDef,
} from './ipoFormat';

const ALLOTMENT_ICONS: Record<AllotmentCategoryDef['key'], typeof User> = {
  retail: User,
  shni: Users,
  bhni: Landmark,
};

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
  const router = useProgressRouter();
  const [predictorCategory, setPredictorCategory] = useState<AllotmentCategoryDef['key'] | null>(null);

  const handleViewAnalysis = (ipo: Ipo) => {
    router.push(`/analysis/${ipo?.slug}`);
  };
  const getDaysUntilClosing = () => {
    const dateStr = ipo?.ipo_dates?.ipo_close_date || ipo?.closing_date;
    const closingDate = parseCardDate(dateStr);
    if (!closingDate) return -1;

    closingDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = closingDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilClosing = getDaysUntilClosing();
  const riskScore = analysis?.risk_meter?.score || 0;
  const closesInLabel =
    daysUntilClosing < 0 ? 'TBA' : daysUntilClosing === 0 ? 'Today' : `${daysUntilClosing} day${daysUntilClosing === 1 ? '' : 's'}`;
  const closesInColor =
    daysUntilClosing < 0 ? 'text-foreground' : daysUntilClosing <= 0 ? 'text-score-bad' : daysUntilClosing <= 2 ? 'text-score-mid' : 'text-foreground';

  const totalSubscription = parseGainValue(ipo?.total_sr);
  const ipoType = getIpoType(ipo);

  const gmpPercent = parseGainValue(ipo?.gmp_ipo_gmp);
  const gmpIsPositive = gmpPercent !== null && gmpPercent >= 0;

  const allotmentCategories = ALLOTMENT_CATEGORIES.map((cat) => ({
    ...cat,
    icon: ALLOTMENT_ICONS[cat.key],
    probability: getAllotmentProbability(parseGainValue(ipo?.[cat.ratioField])),
  }));

  return (
    <div className="w-full max-w-sm mx-auto h-full flex flex-col rounded-xl border border-border bg-card p-5 font-sans">
      <div className="flex items-start justify-between mb-4">
        <Badge variant="outline" className="rounded-md border-border bg-transparent text-foreground text-[11px] font-mono font-medium uppercase tracking-wide px-2 py-1">
          {ipoType}
        </Badge>
        {riskScore > 0 ? (
          <button
            onClick={() => handleViewAnalysis(ipo!)}
            className="text-muted-foreground hover:text-primary transition-colors"
            aria-label="View analysis"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        ) : (
          <ArrowUpRight className="w-4 h-4 text-muted-foreground/30" aria-hidden="true" />
        )}
      </div>

      <h2 className="text-lg font-semibold font-serif text-foreground leading-snug mb-4">
        {ipo?.upcoming_ipo_2025 || 'Company Name'}
      </h2>

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3" /> GMP
          </div>
          <div className="font-mono text-sm font-medium text-foreground flex items-center gap-1.5">
            <span>{ipo?.gmp_price_gain ? `₹${ipo.gmp_price_gain}` : 'N/A'}</span>
            {gmpPercent !== null && (
              <span className={`text-xs font-semibold ${gmpIsPositive ? 'text-score-good' : 'text-score-bad'}`}>
                ({gmpIsPositive ? '+' : ''}{gmpPercent}%)
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1 justify-end">
            <Layers className="w-3 h-3" /> Subscription
          </div>
          <div className="font-mono text-sm font-medium text-foreground">{totalSubscription !== null ? `${totalSubscription}x` : 'N/A'}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {allotmentCategories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setPredictorCategory(cat.key)}
            className="flex flex-col items-center gap-1 text-center py-2 rounded-lg border border-border bg-background/40 hover:border-primary/50 hover:bg-accent transition-colors cursor-pointer"
            aria-label={`Predict ${cat.label} allotment chance`}
          >
            <cat.icon className="w-3.5 h-3.5 text-muted-foreground" />
            <span className={`font-mono text-sm font-semibold ${getProbabilityColor(cat.probability)}`}>{cat.probability !== null ? `${cat.probability}%` : 'N/A'}</span>
            <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">{cat.label}</span>
          </button>
        ))}
      </div>

      <hr className="border-border mb-4" />

      <div className="mt-auto">
        <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
          <Clock className="w-3 h-3" /> Closes in
        </div>
        <div className={`font-mono text-sm font-semibold ${closesInColor}`}>{closesInLabel}</div>
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
              <p className="text-sm text-muted-foreground font-mono truncate">{ipo?.ipo_details?.issue_size || 'N/A'}</p>
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
              <span className={`text-xs sm:text-sm text-score-good font-mono font-semibold`}>₹{ipo?.gmp_price_gain || 'TBA'}</span>
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
              <p className="text-sm text-muted-foreground font-mono truncate">{ipo?.ipo_size || 'N/A'}</p>
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