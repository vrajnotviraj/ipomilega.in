import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Info, AlertTriangle, Sparkles, ShieldCheck } from 'lucide-react';
import { HomePageIpoProps } from '@/app/types/homepage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface IpoAllotmentModalProps {
  ipos: HomePageIpoProps[];
  isOpen: boolean;
  onClose: () => void;
  preSelectedIpoId?: string;
}

// IPO Category Limits (in INR)
const CATEGORY_LIMITS = {
  retail: { min: 10000, max: 200000, name: 'Retail Individual Investor' },
  hni: { min: 200001, max: 10000000, name: 'High Net Worth Individual' },
  qib: { min: 10000000, max: Infinity, name: 'Qualified Institutional Buyer' }
};

// Which live subscription field backs each investor category.
const CATEGORY_FIELD: Record<keyof typeof CATEGORY_LIMITS, 'rii_sr' | 'nii_sr' | 'qib_sr'> = {
  retail: 'rii_sr',
  hni: 'nii_sr',
  qib: 'qib_sr',
};

interface CalculationDetails {
  /** Live subscription multiple for the chosen category, from the hourly job. */
  categoryMultiple: number | null;
  /** Only retail is allotted by lottery, so only retail gets a percentage. */
  isLottery: boolean;
  /** True while bidding is open: the book will keep growing. */
  isProvisional: boolean;
  /** Exchange's own "updated as on" time, when available. */
  capturedAt: string | null;
  /** Present when no figure could be produced, explaining why. */
  unavailableReason: string | null;
  factors: string[];
}

function parseMultiple(value?: string): number | null {
  if (!value) return null;
  const parsed = parseFloat(String(value).replace(/[^\d.]/g, ''));
  return isNaN(parsed) || parsed <= 0 ? null : parsed;
}

const IpoAllotmentModal: React.FC<IpoAllotmentModalProps> = ({
  ipos,
  isOpen,
  onClose,
  preSelectedIpoId
}) => {
  const [selectedIpo, setSelectedIpo] = useState('');
  const [investmentCategory, setInvestmentCategory] = useState<keyof typeof CATEGORY_LIMITS>('retail');
  const [amount, setAmount] = useState('');
  const [prediction, setPrediction] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [calculationDetails, setCalculationDetails] = useState<CalculationDetails | null>(null);

  // Set pre-selected IPO when modal opens
  useEffect(() => {
    if (isOpen && preSelectedIpoId) {
      setSelectedIpo(preSelectedIpoId);
    } else if (isOpen && !preSelectedIpoId) {
      setSelectedIpo('');
    }
  }, [isOpen, preSelectedIpoId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedIpo('');
      setInvestmentCategory('retail');
      setAmount('');
      setPrediction(null);
      setShowResult(false);
      setValidationError('');
      setCalculationDetails(null);
    }
  }, [isOpen]);

  // Validate investment amount
  const validateAmount = (amt: string, category: keyof typeof CATEGORY_LIMITS): string => {
    if (!amt) return '';
    
    const numAmount = parseInt(amt);
    const limits = CATEGORY_LIMITS[category];
    
    if (numAmount < limits.min) {
      return `Minimum investment for ${limits.name} is ₹${limits.min.toLocaleString()}`;
    }
    
    if (numAmount > limits.max) {
      return `Maximum investment for ${limits.name} is ₹${limits.max.toLocaleString()}`;
    }
    
    return '';
  };
  // Allotment estimate from live subscription data.
  //
  // Written hourly by the ipo_milega_scrapper job into qib_sr / nii_sr / rii_sr.
  // Only RETAIL is estimated as a percentage: when retail is oversubscribed the
  // minimum lot is allotted by draw of lots, so the odds really are 1/multiple.
  // HNI and QIB use proportionate allotment rather than a lottery, so no honest
  // single percentage exists for them -- those categories get the live demand
  // figure and an explanation instead of an invented number.
  const calculateAllotmentChance = (
    ipo: HomePageIpoProps | null,
    category: keyof typeof CATEGORY_LIMITS
  ): { probability: number | null; details: CalculationDetails } => {
    const base: CalculationDetails = {
      categoryMultiple: null,
      isLottery: category === 'retail',
      isProvisional: ipo?.ipo?.subscription_is_provisional !== false,
      capturedAt: ipo?.ipo?.subscription_captured_at ?? ipo?.ipo?.subscription_scraped_at ?? null,
      unavailableReason: null,
      factors: [],
    };

    if (!ipo) {
      return { probability: null, details: { ...base, unavailableReason: 'Select an IPO to see live demand.' } };
    }

    const multiple = parseMultiple(ipo.ipo?.[CATEGORY_FIELD[category]]);
    if (multiple === null) {
      return {
        probability: null,
        details: {
          ...base,
          unavailableReason:
            'Live subscription data is not available yet. Figures appear once bidding opens.',
        },
      };
    }

    const factors: string[] = [
      `${CATEGORY_LIMITS[category].name} demand: ${multiple.toFixed(2)}x subscribed`,
    ];
    if (base.isProvisional) {
      factors.push('Bidding is still open — demand will keep rising');
    }

    if (category !== 'retail') {
      factors.push('Allotment in this category is proportionate, not a lottery');
      return {
        probability: null,
        details: { ...base, categoryMultiple: multiple, factors },
      };
    }

    // Retail lottery: one lot per successful applicant when oversubscribed.
    const probability = Math.min(100, (1 / multiple) * 100);
    factors.push(
      multiple <= 1
        ? 'Retail is not yet fully subscribed — all valid applications should be allotted'
        : `Roughly 1 in ${multiple.toFixed(2)} single-lot applications receives an allotment`
    );
    factors.push('Assumes a one-lot application; larger applications do not improve lottery odds');

    return {
      probability: Math.round(probability * 10) / 10,
      details: { ...base, categoryMultiple: multiple, factors },
    };
  };

  const handlePredict = async () => {
    // Validation
    setValidationError('');
    
    if (!selectedIpo) {
      setValidationError('Please select an IPO');
      return;
    }

    const selectedIpoData = selectedIpo === ' ' ? null : ipos.find(ipo => ipo._id === selectedIpo) ?? null;

    // The amount decides which category the applicant falls in, and that is
    // validated here. It does not affect lottery odds: in an oversubscribed
    // retail book every applicant competes for the same single lot regardless
    // of how much they bid, so it is no longer an input to the estimate.
    if (amount) {
      const amountError = validateAmount(amount, investmentCategory);
      if (amountError) {
        setValidationError(amountError);
        return;
      }
    }

    setIsLoading(true);
    setShowResult(false);

    setTimeout(() => {
      const result = calculateAllotmentChance(selectedIpoData, investmentCategory);
      setPrediction(result.probability);
      setCalculationDetails(result.details);
      setShowResult(true);
      setIsLoading(false);
    }, 600);
  };

  const formatCapturedAt = (value: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return null;
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    }).format(parsed);
  };

  const getMeterColor = (percentage: number) => {
    if (percentage >= 70) return 'text-emerald-600';
    if (percentage >= 50) return 'text-amber-600';
    if (percentage >= 30) return 'text-orange-600';
    return 'text-rose-600';
  };

  const getMeterMessage = (percentage: number) => {
    if (percentage >= 80) return 'Excellent chances! High probability of allotment.';
    if (percentage >= 60) return 'Good chances! Solid opportunity for allotment.';
    if (percentage >= 40) return 'Moderate chances. Consider market conditions.';
    if (percentage >= 20) return 'Lower chances. High competition expected.';
    return 'Challenging odds. Very high competition likely.';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 font-ibm-plex flex items-center justify-center z-50 p-3 sm:p-6 transition-opacity duration-200">
      <Card className="w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto bg-white border border-gray-200 rounded-2xl shadow-xl p-0 font-ibm-plex">
        
        {/* Top Gradient Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 w-full" />

        {/* Header */}
        <CardHeader className="flex flex-row items-start justify-between space-y-0 p-5 sm:p-7 pb-4 sm:pb-5 border-b border-gray-200 font-ibm-plex bg-gray-50">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                <Sparkles className="w-3 h-3 text-blue-700" /> SEBI Quota Engine
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-700 border border-gray-300">
                <ShieldCheck className="w-3 h-3 text-gray-600" /> High Precision
              </span>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight font-ibm-plex">
              IPO Allotment Predictor
            </CardTitle>
            <p className="text-gray-600 text-xs sm:text-sm font-medium mt-1 leading-relaxed">
              Calculates allocation probability based on market data, demand multiplier, and subscription quotas.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900 transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        {/* Form Content */}
        <CardContent className="space-y-6 p-5 sm:p-7 pt-6">
          {/* IPO Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 font-ibm-plex">
              Select Target IPO
            </label>
            <Select value={selectedIpo} onValueChange={setSelectedIpo}>
              <SelectTrigger className="w-full h-11 sm:h-12 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-semibold font-ibm-plex transition-all">
                <SelectValue placeholder="All IPOs (General Market Analysis)" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
                <SelectItem value=" " className="font-semibold text-gray-800 cursor-pointer">
                  All IPOs (General Market Analysis)
                </SelectItem>
                {ipos.map((ipo) => (
                  <SelectItem key={ipo._id} value={ipo._id} className="cursor-pointer font-medium">
                    {ipo.ipo.upcoming_ipo_2025} <span className="text-gray-500 font-normal">(₹{ipo.ipo.price_band})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category & Amount Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Category */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 font-ibm-plex">
                Investor Category
              </label>
              <Select value={investmentCategory} onValueChange={(value: keyof typeof CATEGORY_LIMITS) => {
                setInvestmentCategory(value);
                setValidationError('');
              }}>
                <SelectTrigger className="w-full h-11 sm:h-12 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-semibold font-ibm-plex transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
                  <SelectItem value="retail" className="font-medium cursor-pointer">
                    Retail Individual (₹10K - ₹2L)
                  </SelectItem>
                  <SelectItem value="hni" className="font-medium cursor-pointer">
                    HNI Investor (₹2L - ₹1Cr)
                  </SelectItem>
                  <SelectItem value="qib" className="font-medium cursor-pointer">
                    QIB Institutional (₹1Cr+)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 font-ibm-plex">
                Investment Amount <span className="text-gray-500 font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₹</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setValidationError('');
                  }}
                  placeholder={`Max: ₹${CATEGORY_LIMITS[investmentCategory].max === Infinity ? '1Cr+' : CATEGORY_LIMITS[investmentCategory].max.toLocaleString()}`}
                  className="pl-8 h-11 sm:h-12 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-semibold font-ibm-plex placeholder:text-gray-400"
                />
              </div>
              {!amount && (
                <p className="text-[11px] text-gray-500 font-medium">
                  Defaults to maximum limit for {CATEGORY_LIMITS[investmentCategory].name}
                </p>
              )}
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-700 text-sm font-medium">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Predict Button */}
          <Button
            onClick={handlePredict}
            disabled={!selectedIpo || isLoading || !!validationError}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base rounded-xl shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Analyzing Market Data...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <span>Calculate Allotment Probability</span>
              </div>
            )}
          </Button>

          {/* Results Section */}
          {showResult && calculationDetails && (
            <div className="space-y-5 pt-2">
              {/* No live figure: either nothing scraped yet, or a category that
                  is not allotted by lottery so no honest percentage exists. */}
              {prediction === null && (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl space-y-3 shadow-sm">
                  {calculationDetails.unavailableReason ? (
                    <>
                      <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        No estimate available
                      </div>
                      <p className="text-gray-700 font-medium text-sm">
                        {calculationDetails.unavailableReason}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Live demand
                      </div>
                      <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-blue-600">
                        {calculationDetails.categoryMultiple?.toFixed(2)}x
                      </div>
                      <p className="text-gray-700 font-medium text-sm max-w-md">
                        {CATEGORY_LIMITS[investmentCategory].name} applications are allotted
                        <strong> proportionately</strong>, not by lottery, so there is no single
                        percentage chance. Higher demand means a smaller share of what you applied for.
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Meter Card */}
              {prediction !== null && (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center text-center shadow-sm">

                {/* SVG Meter Gauge */}
                <div className="relative w-64 h-36 sm:w-72 sm:h-40 mb-2">
                  <svg viewBox="0 0 300 180" className="w-full h-full">
                    <defs>
                      <linearGradient id="redToYellow" x1="0%" y1="0%" x2="50%" y2="0%">
                        <stop offset="0%" stopColor="#EF4444" />
                        <stop offset="100%" stopColor="#F59E0B" />
                      </linearGradient>
                      <linearGradient id="yellowToGreen" x1="50%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                    </defs>

                    {/* Base Track */}
                    <path
                      d="M 50 150 A 100 100 0 0 1 250 150"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="18"
                      strokeLinecap="round"
                    />

                    {/* Gradient Arc 1 */}
                    <path
                      d="M 50 150 A 100 100 0 0 1 150 50"
                      fill="none"
                      stroke="url(#redToYellow)"
                      strokeWidth="18"
                      strokeLinecap="round"
                    />

                    {/* Gradient Arc 2 */}
                    <path
                      d="M 150 50 A 100 100 0 0 1 250 150"
                      fill="none"
                      stroke="url(#yellowToGreen)"
                      strokeWidth="18"
                      strokeLinecap="round"
                    />

                    {/* Needle */}
                    <g transform={`rotate(${(-90 + (prediction / 100) * 180)} 150 150)`} className="transition-transform duration-700 ease-out">
                      <line
                        x1="150"
                        y1="150"
                        x2="150"
                        y2="62"
                        stroke="#111827"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      <circle cx="150" cy="150" r="7" fill="#111827" stroke="#FFFFFF" strokeWidth="2" />
                    </g>
                  </svg>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Estimated Chance
                  </div>
                  <div className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${getMeterColor(prediction)}`}>
                    {prediction}%
                  </div>
                  <p className="text-gray-700 font-semibold text-sm sm:text-base max-w-md pt-1">
                    {getMeterMessage(prediction)}
                  </p>
                  {calculationDetails.isProvisional && (
                    <p className="text-xs text-amber-700 font-medium max-w-md pt-1">
                      Bidding is still open. This is the chance <em>if bidding closed now</em> —
                      demand will keep rising, so the final odds will be lower.
                    </p>
                  )}
                </div>
              </div>
              )}

              {/* Breakdown Grid */}
              <div className="p-5 bg-white border border-gray-200 rounded-2xl space-y-4 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-2">
                  Calculation Breakdown
                </h4>
                
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="text-xs font-medium text-gray-500">
                      {CATEGORY_LIMITS[investmentCategory].name} demand
                    </p>
                    <p className="text-lg sm:text-xl font-black text-amber-600 mt-0.5">
                      {calculationDetails.categoryMultiple !== null
                        ? `${calculationDetails.categoryMultiple.toFixed(2)}x`
                        : '—'}
                    </p>
                  </div>
                  <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="text-xs font-medium text-gray-500">Data as of</p>
                    <p className="text-sm font-bold text-gray-800 mt-1 leading-snug">
                      {formatCapturedAt(calculationDetails.capturedAt) ?? 'Not yet available'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Factors Applied:</p>
                  <div className="space-y-1.5">
                    {calculationDetails.factors.map((factor: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0"></div>
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Info Methodology */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-3 text-xs sm:text-sm text-gray-600">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="leading-relaxed font-medium">
                  <strong className="text-gray-800">Methodology:</strong> Based on live exchange
                  subscription data, refreshed hourly while bidding is open. For retail, an
                  oversubscribed book is allotted by draw of lots at one lot per successful
                  applicant, so the chance shown is 1 ÷ the retail subscription multiple. It assumes
                  a single-lot application and reflects demand at the timestamp above, not the final
                  demand at close. This is information, not investment advice.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IpoAllotmentModal;