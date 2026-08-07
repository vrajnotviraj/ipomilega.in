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

// IPO Quality Scoring Factors
const IPO_QUALITY_FACTORS = {
  // Sector scoring (out of 100)
  sectors: {
    'technology': 85,
    'healthcare': 80,
    'financial': 75,
    'consumer': 70,
    'manufacturing': 65,
    'energy': 60,
    'telecom': 65,
    'default': 60
  },
  
  // Company age factor
  companyAge: {
    'new': 60,      // < 5 years
    'established': 75, // 5-15 years
    'mature': 85    // > 15 years
  },
  
  // Price band factor (higher price = lower retail participation)
  priceBand: {
    'low': 80,      // < ₹500
    'medium': 70,   // ₹500-1500
    'high': 60      // > ₹1500
  }
};
interface CalculationDetails {
  categoryAllocation: number;
  expectedSubscription: number;
  investmentTier: string;
  qualityScore: number;
  factors: string[];
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

  // Calculate IPO quality score
  const calculateIpoQualityScore = (ipo: HomePageIpoProps): number => {
    let score = 50; // Base score
    
    // Sector scoring (simplified - you'd need actual sector data)
    const ipoName = ipo.ipo.upcoming_ipo_2025.toLowerCase();
    let sectorScore = IPO_QUALITY_FACTORS.sectors.default;
    
    // Simple keyword-based sector detection (replace with actual sector data)
    if (ipoName.includes('tech') || ipoName.includes('software') || ipoName.includes('digital')) {
      sectorScore = IPO_QUALITY_FACTORS.sectors.technology;
    } else if (ipoName.includes('pharma') || ipoName.includes('health') || ipoName.includes('medical')) {
      sectorScore = IPO_QUALITY_FACTORS.sectors.healthcare;
    } else if (ipoName.includes('bank') || ipoName.includes('finance') || ipoName.includes('insurance')) {
      sectorScore = IPO_QUALITY_FACTORS.sectors.financial;
    }
    
    // Price band factor
    const priceBand = parseInt(ipo.ipo.price_band.replace(/[^\d]/g, ''));
    let priceFactor = IPO_QUALITY_FACTORS.priceBand.low;
    if (priceBand > 1500) {
      priceFactor = IPO_QUALITY_FACTORS.priceBand.high;
    } else if (priceBand > 500) {
      priceFactor = IPO_QUALITY_FACTORS.priceBand.medium;
    }
    
    // Combine factors
    score = (sectorScore * 0.6) + (priceFactor * 0.4);
    
    return Math.min(95, Math.max(20, score));
  };

  // Main allotment calculation logic
  const calculateAllotmentChance = (
    ipo: HomePageIpoProps | null,
    category: keyof typeof CATEGORY_LIMITS,
    investmentAmount: number
  ): { probability: number; details: CalculationDetails } => {
    let probability = 50; // Base probability
    const details: CalculationDetails = {
      factors: [],
      categoryAllocation: 0,
      expectedSubscription: 0,
      investmentTier: '',
      qualityScore: 0
    };

    // Category-wise allocation percentages (standard SEBI guidelines)
    const categoryAllocations = {
      retail: 35,  // 35% reserved for retail
      hni: 15,     // 15% for HNI
      qib: 50      // 50% for QIB
    };

    details.categoryAllocation = categoryAllocations[category];

    // Category-specific calculations
    if (category === 'retail') {
      // Retail category (35% allocation)
      probability = 65; // Base higher chance due to reservation
      
      // Amount tier impact
      if (investmentAmount <= 15000) {
        probability += 15;
        details.investmentTier = 'Small investor bonus';
        details.factors.push('Small investment amount: +15%');
      } else if (investmentAmount <= 50000) {
        probability += 10;
        details.investmentTier = 'Moderate investment';
        details.factors.push('Moderate investment amount: +10%');
      } else if (investmentAmount >= 150000) {
        probability -= 5;
        details.investmentTier = 'High retail investment';
        details.factors.push('High retail investment: -5%');
      }
      
      // Expected subscription impact (retail typically 2-5x subscribed)
      details.expectedSubscription = 3.5;
      probability -= 20; // Reduce due to typical oversubscription
      details.factors.push('Expected retail oversubscription (3.5x): -20%');
      
    } else if (category === 'hni') {
      // HNI category (15% allocation, typically heavily oversubscribed)
      probability = 25; // Lower base due to high competition
      
      // Amount tier impact
      if (investmentAmount >= 5000000) {
        probability += 15;
        details.investmentTier = 'Large HNI investment';
        details.factors.push('Large HNI investment (₹50L+): +15%');
      } else if (investmentAmount >= 1000000) {
        probability += 10;
        details.investmentTier = 'Moderate HNI investment';
        details.factors.push('Moderate HNI investment (₹10L+): +10%');
      } else {
        probability += 5;
        details.investmentTier = 'Entry-level HNI';
        details.factors.push('Entry-level HNI investment: +5%');
      }
      
      // Expected subscription impact (HNI typically 5-20x subscribed)
      details.expectedSubscription = 8.0;
      probability -= 30; // Significant reduction due to oversubscription
      details.factors.push('Expected HNI oversubscription (8x): -30%');
      
    } else if (category === 'qib') {
      // QIB category (50% allocation, institutional investors)
      probability = 70; // Higher base due to reserved allocation
      
      // QIBs typically get better allocation due to large reserved portion
      details.investmentTier = 'Institutional investment';
      details.expectedSubscription = 2.0;
      probability -= 5; // Minimal reduction
      details.factors.push('QIB category advantage: +20%');
      details.factors.push('Expected QIB subscription (2x): -5%');
    }

    // IPO-specific quality adjustment
    if (ipo) {
      const qualityScore = calculateIpoQualityScore(ipo);
      details.qualityScore = qualityScore;
      
      if (qualityScore >= 80) {
        probability -= 15; // High quality = more competition
        details.factors.push('High-quality IPO: -15% (more competition)');
      } else if (qualityScore >= 65) {
        probability -= 8;
        details.factors.push('Good quality IPO: -8% (moderate competition)');
      } else if (qualityScore <= 40) {
        probability += 10;
        details.factors.push('Lower quality IPO: +10% (less competition)');
      }
    } else {
      // General IPO analysis
      probability -= 5;
      details.factors.push('General analysis: -5% (average market conditions)');
    }

    // Market conditions adjustment (you can make this dynamic based on current market)
    let marketSentiment; // This could be fetched from an API
    if (marketSentiment === 'bullish') {
      probability -= 10;
      details.factors.push('Bullish market conditions: -10%');
    } else if (marketSentiment === 'bearish') {
      probability += 15;
      details.factors.push('Bearish market conditions: +15%');
    }
    else{
      probability += 5;
      details.factors.push('Neutral market conditions: +5%');
    }

    // Ensure probability is within realistic bounds
    probability = Math.min(90, Math.max(5, probability));

    return { probability: Math.round(probability), details };
  };

  const handlePredict = async () => {
    // Validation
    setValidationError('');
    
    if (!selectedIpo) {
      setValidationError('Please select an IPO');
      return;
    }

    const selectedIpoData = selectedIpo === ' ' ? null : ipos.find(ipo => ipo._id === selectedIpo);
    let investmentAmount: number;

    if (!amount) {
      // Use maximum allowed for category if no amount specified
      investmentAmount = CATEGORY_LIMITS[investmentCategory].max === Infinity 
        ? 10000000 // Default 1 crore for QIB
        : CATEGORY_LIMITS[investmentCategory].max;
    } else {
      investmentAmount = parseInt(amount);
      const amountError = validateAmount(amount, investmentCategory);
      if (amountError) {
        setValidationError(amountError);
        return;
      }
    }

    setIsLoading(true);
    setShowResult(false);

    // Simulate processing time (remove in production)
    setTimeout(() => {
      const result = calculateAllotmentChance(selectedIpoData!, investmentCategory, investmentAmount);
      setPrediction(result.probability);
      setCalculationDetails(result.details);
      setShowResult(true);
      setIsLoading(false);
    }, 1500);
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
          {showResult && prediction !== null && calculationDetails && (
            <div className="space-y-5 pt-2">
              {/* Meter Card */}
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
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="p-5 bg-white border border-gray-200 rounded-2xl space-y-4 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-2">
                  Calculation Breakdown
                </h4>
                
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="text-xs font-medium text-gray-500">Category Allocation</p>
                    <p className="text-lg sm:text-xl font-black text-blue-600 mt-0.5">
                      {calculationDetails.categoryAllocation}%
                    </p>
                  </div>
                  <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="text-xs font-medium text-gray-500">Est. Oversubscription</p>
                    <p className="text-lg sm:text-xl font-black text-amber-600 mt-0.5">
                      {calculationDetails.expectedSubscription}x
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
                  <strong className="text-gray-800">Methodology:</strong> Predictions combine SEBI quota reservation rules, investor category tiers, demand multipliers, and quality factors. Designed as analytical guidance.
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