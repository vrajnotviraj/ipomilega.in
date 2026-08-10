    /* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
    import { Button } from '@/components/ui/button';
    import { Badge } from '@/components/ui/badge';
    import { Textarea } from '@/components/ui/textarea';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
    import { Card, CardContent } from '@/components/ui/card';
    import {
        Plus,
        ChevronRight,
        ChevronLeft,
        CheckCircle,
        AlertTriangle,
        LineChart,
        Shield,
        Activity,
        Clock,
        TrendingUp,
        Save,
        Copy,
        ExternalLink,
        Link as LinkIcon,
        ArrowLeftCircle,
        Edit,
        Sparkles
    } from 'lucide-react';
    import { toast } from 'sonner';
    import { cn } from '@/lib/utils';
    import { Ipo } from '@/app/models/ipo';
    import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';

    // Type definitions for analysis data
    interface RiskAnalysis {
        score: number;
        summary: string;
        key_risks: string[];
        risk_categories: {
            financial_risks: string[];
            market_risks: string[];
            operational_risks: string[];
            regulatory_risks: string[];
        };
        risk_mitigation: string;
    }

    interface PerformanceAnalysis {
        score: number;
        summary: string;
        historical_growth: {
            pattern: string;
            rate: string;
            consistency: string;
        };
        key_achievements: string[];
        management_quality: {
            experience: string;
            track_record: string;
            score: number;
        };
        market_comparison: string;
        future_potential: {
            growth_forecast: string;
            upcoming_projects: string[];
        };
        consistency_analysis: {
            operational_years: number;
            revenue_stability: string;
            rationale: string;
        };
    }

    interface FlexibilityAnalysis {
        score: number;
        summary: string;
        market_adaptability: {
            score: number;
            description: string;
        };
        financial_stability: {
            score: number;
            description: string;
        };
        operational_agility: {
            score: number;
            description: string;
        };
        product_diversification: string;
        pivoting_history: string[];
        future_adaptability_potential: string;
    }

    interface FundamentalsAnalysis {
        score: number;
        summary: string;
        market_position: string;
        business_model: string;
        revenue_details: {
            total_revenue: number;
            revenue_cagr: number;
            revenue_trend: string;
        };
        profit_analysis: {
            net_profit: number;
            profit_margin: number;
            ebitda: number | null;
            profit_trend: string;
        };
        assets_and_liabilities: {
            total_assets: number;
            total_liabilities: number | null;
            debt_to_equity_ratio: number | null;
        };
        financial_ratios: {
            current_ratio: string | null;
            quick_ratio: string | null;
            return_on_equity: string | null;
        };
    }


    interface TimeAnalysis {
        score: number;
        summary: string;
        issue_dates: {
            opening: string;
            closing: string;
        };
        listing_details: {
            expected_date: string;
            exchanges: string[];
        };
        allotment_timeline: {
            date: string;
            process: string;
        };
        key_milestones: Array<{
            date: string;
            event: string;
        }>;
        market_timing_assessment: string;
        time_to_market: {
            score: number;
            rationale: string;
        };
    }

    interface SummaryAnalysis {
        approximate_gains_potential: number;
        gains_rationale: string;
        profitability_of_allotment: {
            score: number;
            assessment: string;
        };
    }



    // Analysis data type union
    type AnalysisDataType = RiskAnalysis | PerformanceAnalysis | FlexibilityAnalysis | FundamentalsAnalysis | TimeAnalysis | SummaryAnalysis;

    // Complete analysis data interface
    interface AnalysisData {
        risk_meter?: RiskAnalysis;
        performance?: PerformanceAnalysis;
        flexibility?: FlexibilityAnalysis;
        fundamentals?: FundamentalsAnalysis;
        time?: TimeAnalysis;
        summary?: SummaryAnalysis;
    }

    // Updated prompts to include summary
    const analysisPrompts = {
        all: `**CRITICAL: Do not mention page numbers. Keep all summaries and descriptions under 30 words.** Analyze all factors for this IPO in one shot.

Return a single JSON object with this exact structure:
{
  "risk_factors": {
    "score": number (1-10, lower is better),
    "summary": "string (Max 30 words)",
    "key_risks": ["array of 5-7 risk strings"],
    "risk_categories": {
      "financial_risks": ["array of strings"],
      "market_risks": ["array of strings"],
      "operational_risks": ["array of strings"],
      "regulatory_risks": ["array of strings"]
    },
    "risk_mitigation": "string (Max 30 words)"
  },
  "performance": {
    "score": number (1-10),
    "summary": "string (Max 30 words)",
    "historical_growth": {
      "pattern": "string",
      "rate": "string",
      "consistency": "string"
    },
    "key_achievements": ["array of strings"],
    "management_quality": {
      "experience": "string (Max 30 words)",
      "track_record": "string (Max 30 words)",
      "score": number (1-10)
    },
    "market_comparison": "string (Max 30 words)",
    "future_potential": {
      "growth_forecast": "string (Max 30 words)",
      "upcoming_projects": ["array of strings"]
    },
    "consistency_analysis": {
      "operational_years": number,
      "revenue_stability": "string",
      "rationale": "string (Max 30 words)"
    }
  },
  "flexibility": {
    "score": number (1-10),
    "summary": "string (Max 30 words)",
    "market_adaptability": {
      "score": number (1-10),
      "description": "string (Max 30 words)"
    },
    "financial_stability": {
      "score": number,
      "description": "string (Max 30 words)"
    },
    "operational_agility": {
      "score": number (1-10),
      "description": "string (Max 30 words)"
    },
    "product_diversification": "string (Max 30 words)",
    "pivoting_history": ["array of strings"],
    "future_adaptability_potential": "string (Max 30 words)"
  },
  "financial_fundamentals": {
    "score": number (1-10),
    "summary": "string (Max 30 words)",
    "market_position": "string (Max 30 words)",
    "business_model": "string (Max 30 words)",
    "revenue_details": {
      "total_revenue": number,
      "revenue_cagr": number,
      "revenue_trend": "string"
    },
    "profit_analysis": {
      "net_profit": number,
      "profit_margin": number,
      "ebitda": number | null,
      "profit_trend": "string"
    },
    "assets_and_liabilities": {
      "total_assets": number,
      "total_liabilities": number | null,
      "debt_to_equity_ratio": number | null
    },
    "financial_ratios": {
      "current_ratio": "string",
      "quick_ratio": "string",
      "return_on_equity": "string"
    }
  },
  "timing": {
    "score": number (1-10),
    "summary": "string (Max 30 words)",
    "issue_dates": {
      "opening": "YYYY-MM-DD",
      "closing": "YYYY-MM-DD"
    },
    "listing_details": {
      "expected_date": "YYYY-MM-DD",
      "exchanges": ["array of exchange strings"]
    },
    "allotment_timeline": {
      "date": "YYYY-MM-DD",
      "process": "string"
    },
    "key_milestones": [
      { "date": "YYYY-MM-DD", "event": "string" }
    ],
    "market_timing_assessment": "string (Max 30 words)",
    "time_to_market": {
      "score": number (1-10),
      "rationale": "string (Max 30 words)"
    }
  },
  "final_summary": {
    "approximate_gains_potential": number,
    "gains_rationale": "string (Max 30 words)",
    "profitability_of_allotment": {
      "score": number (1-10),
      "assessment": "string (Max 30 words)"
    }
  }
}`,
        risk_meter: `**CRITICAL: Do not mention page numbers. Keep all summaries and descriptions under 20 words.** Analyze risk factors for this IPO.

    RISK FACTORS TEXT (RHP): READ THE REFERENCE FROM THE PDF
    SCRAPED DATA CONTEXT: READ THE REFERENCE FROM THE PDF

    Return JSON with this exact structure:
    {
    "score": number (1-10, lower is better),
    "summary": "string (A summary explaining risk severity. Max 30 words.)",
    "key_risks": ["array of 5-7 significant risk strings"],
    "risk_categories": {
        "financial_risks": ["array of financial risk strings"],
        "market_risks": ["array of market/competition risk strings"],
        "operational_risks": ["array of operational risk strings"],
        "regulatory_risks": ["array of regulatory risk strings"]
    },
    "risk_mitigation": "string (Describe risk mitigation strategies. Max 30 words.)"
    }`,

        performance: `**CRITICAL: Do not mention page numbers. Keep all summaries and descriptions under 20 words.** Analyze the performance.

    PERFORMANCE INFORMATION (RHP): READ THE REFERENCE FROM THE PDF
    SCRAPED PERFORMANCE DATA: READ THE REFERENCE FROM THE PDF

    Return JSON with this exact structure:
    {
    "score": number (1-10),
    "summary": "string (A summary comparing to competitors. Max 30 words.)",
    "historical_growth": {
        "pattern": "string (e.g., 'Exponential', 'Stable')",
        "rate": "string (e.g., '10% annual growth')",
        "consistency": "string (e.g., 'High', 'Variable')"
    },
    "key_achievements": ["array of significant achievement strings"],
    "management_quality": {
        "experience": "string (Describe management experience. Max 30 words.)",
        "track_record": "string (Describe management track record. Max 30 words.)",
        "score": number (1-10)
    },
    "market_comparison": "string (Compare to industry peers. Max 30 words.)",
    "future_potential": {
        "growth_forecast": "string (Describe growth prospects. Max 30 words.)",
        "upcoming_projects": ["array of upcoming initiative strings"]
    },
    "consistency_analysis": {
        "operational_years": number,
        "revenue_stability": "string describing revenue stability",
        "rationale": "string (Explain consistency rationale. Max 30 words.)"
    }
    }`,

        flexibility: `**CRITICAL: Do not mention page numbers. Keep all summaries and descriptions under 20 words.** Analyze flexibility.

    FLEXIBILITY INFORMATION (RHP): READ THE REFERENCE FROM THE PDF
    SCRAPED DATA CONTEXT: READ THE REFERENCE FROM THE PDF

    Return JSON with this exact structure:
    {
    "score": number (1-10),
    "summary": "string (A summary comparing adaptability. Max 30 words.)",
    "market_adaptability": {
        "score": number (1-10),
        "description": "string (Describe market adaptation ability. Max 30 words.)"
    },
    "financial_stability": {
        "score": number | null,
        "description": "string | null (Describe financial stability. Max 30 words.)"
    },
    "operational_agility": {
        "score": number (1-10),
        "description": "string (Describe operational flexibility. Max 30 words.)"
    },
    "product_diversification": "string (Describe product diversification. Max 30 words.)",
    "pivoting_history": ["array of historical pivot strings"],
    "future_adaptability_potential": "string (Describe future adaptation potential. Max 30 words.)"
    }`,

        fundamentals: `**CRITICAL: Do not mention page numbers. Keep all summaries and descriptions under 20 words.** Analyze financial fundamentals.

    FINANCIAL DATA FROM RHP: READ THE REFERENCE FROM THE PDF
    SCRAPED FINANCIAL DATA: READ THE REFERENCE FROM THE PDF
    BUSINESS DESCRIPTION: READ THE REFERENCE FROM THE PDF

    Return JSON with this exact structure:
    {
    "score": number (1-10),
    "summary": "string (Explain financial strengths/weaknesses. Max 30 words.)",
    "market_position": "string (Describe market position. Max 30 words.)",
    "business_model": "string (Describe business model. Max 30 words.)",
    "revenue_details": {
        "total_revenue": number (in millions, numerical value only),
        "revenue_cagr": number (percentage as number, e.g., 15.5),
        "revenue_trend": "string describing revenue trend"
    },
    "profit_analysis": {
        "net_profit": number (in millions, numerical value only),
        "profit_margin": number (percentage as number, e.g., 12.5),
        "ebitda": number | null,
        "profit_trend": "string describing profit trend"
    },
    "assets_and_liabilities": {
        "total_assets": number (in millions, numerical value only),
        "total_liabilities": number | null,
        "debt_to_equity_ratio": number | null
    },
    "financial_ratios": {
        "current_ratio": "string | null (e.g., '1.5:1')",
        "quick_ratio": "string | null (e.g., '1.2:1')",
        "return_on_equity": "string | null (e.g., '15%')"
    }
    }`,

        time: `**CRITICAL: Do not mention page numbers. Keep all summaries and descriptions under 20 words.** Analyze timing. Use YYYY-MM-DD for dates.

    TIME INFORMATION (RHP): READ THE REFERENCE FROM THE PDF
    SCRAPED TIME DATA: READ THE REFERENCE FROM THE PDF

    Return JSON with this exact structure:
    {
    "score": number (1-10),
    "summary": "string (Explain timing favorability. Max 30 words.)",
    "issue_dates": {
        "opening": "string (YYYY-MM-DD format)",
        "closing": "string (YYYY-MM-DD format)"
    },
    "listing_details": {
        "expected_date": "string (YYYY-MM-DD format)",
        "exchanges": ["array of exchange name strings"]
    },
    "allotment_timeline": {
        "date": "string (YYYY-MM-DD format)",
        "process": "string (Describe allotment process. Max 30 words.)"
    },
    "key_milestones": [
        {
        "date": "string (YYYY-MM-DD format)",
        "event": "string describing milestone event"
        }
    ],
    "market_timing_assessment": "string (Assess current market conditions. Max 30 words.)",
    "time_to_market": {
        "score": number (1-10),
        "rationale": "string (Explain timing score rationale. Max 30 words.)"
    }
    }`,
        summary: `**CRITICAL: Do not mention page numbers. Keep all descriptions under 20 words.** Provide a final investment summary.

    ALL PREVIOUS ANALYSIS CONTEXT: Use the analysis you've already generated for other sections.
    SCRAPED GMP/GAINS DATA: READ THE REFERENCE FROM THE PDF

    Return JSON with this exact structure:
    {
    "approximate_gains_potential": number (percentage as number, e.g., 25.5),
    "gains_rationale": "string (Briefly explain gain potential. Max 30 words.)",
    "profitability_of_allotment": {
        "score": number (1-10, based on overall analysis),
        "assessment": "string (e.g., 'High probability of gains due to strong fundamentals.') (Max 30 words.)"
    }
    }`
    };

    interface AnalysisStep {
        id: keyof typeof analysisPrompts;
        title: string;
        description: string;
        icon: React.ComponentType<{ className?: string }>;
        color: string;
        required: boolean;
    }

    interface IpoAnalysisModalProps {
        ipoItem: {
            _id: string;
            ipo: Ipo;
            analysis?: any;
        };
        onAnalysisAdded: () => void;
    }

    // Analysis steps
    const analysisSteps: AnalysisStep[] = [
        { id: 'all', title: 'All Factors (One Shot)', description: 'Paste all 6 analysis factors in a single JSON object.', icon: Sparkles, color: 'text-amber-500', required: false },
        { id: 'risk_meter', title: 'Risk Analysis', description: 'Evaluate potential risks and mitigation strategies.', icon: Shield, color: 'text-red-600', required: true },
        { id: 'performance', title: 'Performance', description: 'Analyze historical growth and achievements.', icon: TrendingUp, color: 'text-green-600', required: true },
        { id: 'flexibility', title: 'Flexibility', description: 'Assess market adaptability and agility.', icon: Activity, color: 'text-blue-600', required: true },
        { id: 'fundamentals', title: 'Fundamentals', description: 'Review financial health and ratios.', icon: LineChart, color: 'text-purple-600', required: true },
        { id: 'time', title: 'Time Analysis', description: 'Check market timing and milestones.', icon: Clock, color: 'text-orange-600', required: true },
        { id: 'summary', title: 'Investment Summary', description: 'Provide final verdict and gain potential.', icon: CheckCircle, color: 'text-indigo-600', required: true }
    ];

    // Helper component for circular progress indicators
    const ProgressCircle = ({
        label,
        value,
        description,
    }: {
        label: string;
        value: number;
        description?: string;
    }) => {
        const cappedValue = Math.min(value, 100);
        const strokeWidth = 4;
        const progressRadius = 16;
        const innerRadius = progressRadius - strokeWidth / 2;
        const circumference = 2 * Math.PI * progressRadius;
        const strokeDasharray = circumference;
        const strokeDashoffset = circumference - (cappedValue / 100) * circumference;

        return (
            <div className="flex flex-col items-center text-center">
                <h4 className="mb-2 sm:mb-4 text-sm font-semibold font-ibm-plex">
                    {label}
                </h4>
                <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 36 36"
                        className="w-full h-full"
                    >
                        <circle cx="18" cy="18" r={innerRadius} fill="#2563eb" />
                        <circle
                            cx="18"
                            cy="18"
                            r={progressRadius}
                            fill="none"
                            stroke="#93c5fd"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            transform="rotate(-90 18 18)"
                            style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
                        />
                        <text
                            x="18"
                            y="21"
                            textAnchor="middle"
                            fill="white"
                            fontSize="7"
                            fontWeight="bold"
                            fontFamily="IBM Plex Sans, sans-serif"
                        >
                            {cappedValue.toFixed(0)}
                        </text>
                    </svg>
                </div>
                {description && (
                    <p className="text-xs mt-2 max-w-[120px] font-ibm-plex">
                        {description}
                    </p>
                )}
            </div>
        );
    };

    // Helper component for timeline markers
    const TimelineMarker = ({
        label,
        date,
        position,
        alignment = "center",
    }: {
        label: string;
        date: string;
        position: string;
        alignment?: "left" | "center" | "right";
    }) => {
        let alignmentClass = "items-center text-center -translate-x-1/2";
        if (alignment === "left") alignmentClass = "items-start text-left";
        if (alignment === "right")
            alignmentClass = "items-end text-right -translate-x-full";

        const formattedDate = new Date(date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

        return (
            <div
                className={`absolute top-0 h-full flex flex-col justify-between ${alignmentClass}`}
                style={{ left: position }}
            >
                <p className="text-xs font-medium -translate-y-6 font-ibm-plex">
                    {label}
                </p>
                <p className="text-xs font-semibold translate-y-6 font-ibm-plex">
                    {formattedDate}
                </p>
            </div>
        );
    };

    // Helper function to get initials from a company name
    const getInitials = (name: string) => {
        if (!name) return "";
        return name
            .split(" ")
            .map((word: string) => word.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    export function IpoAnalysisModal({ ipoItem, onAnalysisAdded }: IpoAnalysisModalProps) {
        // DEBUGGING: Log the incoming prop to check its structure
        console.log("Received ipoItem prop:", ipoItem);

        const [isOpen, setIsOpen] = useState(false);
        const [currentStep, setCurrentStep] = useState(0);
        const [analysisData, setAnalysisData] = useState<AnalysisData>({});
        const [jsonInput, setJsonInput] = useState('');
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
        const [jsonError, setJsonError] = useState<string | null>(null);
        const [showPreview, setShowPreview] = useState(false);

        const currentStepData = analysisSteps[currentStep];
        const isLastStep = currentStep === analysisSteps.length - 1;

        // Get RHP and DRHP links from the correct ipo_details structure
        const rhpLink = ipoItem.ipo.ipo_details?.rhp_draft_prospectus_links?.[0]?.href;
        const drhpLink = ipoItem.ipo.ipo_details?.drhp_draft_prospectus_links?.[0]?.href;
        const marketLot=ipoItem.ipo.ipo_market_lot || [];

        const parsePercentage = (value: string): number => {
            if (!value) return 0;
            const match = value.match(/(\d+(?:\.\d+)?)/);
        const isCombinedJsonObj = (obj: any): boolean => {
            if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
            return (
                'risk_factors' in obj ||
                'risk_meter' in obj ||
                'performance' in obj ||
                'flexibility' in obj ||
                'financial_fundamentals' in obj ||
                'fundamentals' in obj ||
                'timing' in obj ||
                'time' in obj ||
                'final_summary' in obj ||
                'summary' in obj
            );
        };

        const extractCombinedSections = (obj: any) => {
            const risk_meter = obj.risk_factors || obj.risk_meter;
            const performance = obj.performance;
            const flexibility = obj.flexibility;
            const fundamentals = obj.financial_fundamentals || obj.fundamentals;
            const time = obj.timing || obj.time;
            const summary = obj.final_summary || obj.summary;

            return {
                ...(risk_meter ? { risk_meter } : {}),
                ...(performance ? { performance } : {}),
                ...(flexibility ? { flexibility } : {}),
                ...(fundamentals ? { fundamentals } : {}),
                ...(time ? { time } : {}),
                ...(summary ? { summary } : {}),
            };
        };

        const buildCombinedJsonString = (data: AnalysisData) => {
            const combined = {
                risk_factors: data.risk_meter || null,
                performance: data.performance || null,
                flexibility: data.flexibility || null,
                financial_fundamentals: data.fundamentals || null,
                timing: data.time || null,
                final_summary: data.summary || null,
            };
            return JSON.stringify(combined, null, 2);
        };

        useEffect(() => {
            if (isOpen) {
                setCurrentStep(0);
                setJsonError(null);
                setIsSubmitting(false);
                setShowPreview(false);

                const existing = ipoItem.analysis;
                if (existing) {
                    const mapped: AnalysisData = {
                        risk_meter: existing.risk_meter,
                        performance: existing.performance,
                        flexibility: existing.flexibility,
                        fundamentals: existing.fundamentals,
                        time: existing.time,
                        summary: {
                            approximate_gains_potential: existing.ipo_details?.approximate_gains_potential || 0,
                            gains_rationale: existing.ipo_details?.gains_rationale || '',
                            profitability_of_allotment: existing.ipo_details?.profitability_of_allotment || { score: 0, assessment: '' }
                        }
                    };
                    setAnalysisData(mapped);
                    const completed = new Set<string>();
                    if (existing.risk_meter) completed.add('risk_meter');
                    if (existing.performance) completed.add('performance');
                    if (existing.flexibility) completed.add('flexibility');
                    if (existing.fundamentals) completed.add('fundamentals');
                    if (existing.time) completed.add('time');
                    completed.add('summary');
                    if (existing.risk_meter && existing.performance && existing.flexibility && existing.fundamentals && existing.time) {
                        completed.add('all');
                    }
                    setCompletedSteps(completed);
                    
                    // Pre-fill the JSON textarea for 'all' step
                    setJsonInput(buildCombinedJsonString(mapped));
                } else {
                    setAnalysisData({});
                    setCompletedSteps(new Set());
                    setJsonInput('');
                }
            }
        }, [isOpen, ipoItem]);

        // Auto-load data when step changes
        useEffect(() => {
            const stepId = analysisSteps[currentStep].id;
            if (stepId === 'all') {
                const hasAnyData = Object.keys(analysisData).some(key => Boolean(analysisData[key as keyof AnalysisData]));
                if (hasAnyData) {
                    setJsonInput(buildCombinedJsonString(analysisData));
                } else {
                    setJsonInput('');
                }
            } else {
                const stepData = analysisData[stepId as keyof AnalysisData];
                if (stepData) {
                    setJsonInput(JSON.stringify(stepData, null, 2));
                } else {
                    setJsonInput('');
                }
            }
            setJsonError(null);
        }, [currentStep, analysisData]);

        const validateJson = (jsonString: string): { isValid: boolean; isCombined?: boolean; combinedData?: Partial<AnalysisData>; data?: any; error?: string } => {
            if (!jsonString.trim()) {
                return { isValid: false, error: 'JSON data cannot be empty.' };
            }
            try {
                const parsed = JSON.parse(jsonString);
                if (isCombinedJsonObj(parsed)) {
                    const combinedSections = extractCombinedSections(parsed);
                    return { isValid: true, isCombined: true, combinedData: combinedSections };
                }
                return { isValid: true, isCombined: false, data: parsed };
            } catch (error) {
                return { isValid: false, error: `Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}` };
            }
        };

        const handleJsonChange = (value: string) => {
            setJsonInput(value);
            if (jsonError) setJsonError(null);
        };

        const copyPromptToClipboard = () => {
            navigator.clipboard.writeText(analysisPrompts[currentStepData.id]);
            toast.success(`Prompt for "${currentStepData.title}" copied!`);
        };

        const saveCurrentStep = (input: string) => {
            const validation = validateJson(input);
            if (validation.isValid) {
                if (validation.isCombined && validation.combinedData) {
                    const sections = validation.combinedData;
                    setAnalysisData(prev => ({ ...prev, ...sections }));
                    setCompletedSteps(prev => {
                        const newSet = new Set(prev);
                        if (sections.risk_meter) newSet.add('risk_meter');
                        if (sections.performance) newSet.add('performance');
                        if (sections.flexibility) newSet.add('flexibility');
                        if (sections.fundamentals) newSet.add('fundamentals');
                        if (sections.time) newSet.add('time');
                        if (sections.summary) newSet.add('summary');
                        newSet.add('all');
                        return newSet;
                    });
                    setJsonError(null);
                    return true;
                } else if (validation.data) {
                    const stepId = currentStepData.id;
                    if (stepId === 'all') {
                        setJsonError('Expected combined JSON object with keys like risk_factors, performance, etc.');
                        return false;
                    }
                    setAnalysisData(prev => ({ ...prev, [stepId as keyof AnalysisData]: validation.data }));
                    setCompletedSteps(prev => new Set(prev).add(stepId));
                    setJsonError(null);
                    return true;
                }
            }
            setJsonError(validation.error || 'Invalid JSON');
            return false;
        };

        const navigateStep = (direction: 'next' | 'prev' | 'skip') => {
            let isSaved = true;
            if (jsonInput.trim()) {
                isSaved = saveCurrentStep(jsonInput);
            } else if (currentStepData.required) {
                // If required and empty, clear the completed status
                setCompletedSteps(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(currentStepData.id);
                    return newSet;
                });
            }

            if (!isSaved) return;

            if (direction === 'next' && !isLastStep) {
                setCurrentStep(c => c + 1);
            } else if (direction === 'prev' && currentStep > 0) {
                setCurrentStep(c => c - 1);
            } else if (direction === 'skip' && !currentStepData.required && !isLastStep) {
                setCurrentStep(c => c + 1);
            }
        };

        // Function to map IPO details from existing Ipo interface to comprehensive analysis format
        const mapIpoDetails = (ipo: Ipo) => {
            const retailQuota = ipo.ipo_details?.retail_quota || '35';
            const qibQuota = ipo.ipo_details?.qib_quota || '50';
            const niiQuota = ipo.ipo_details?.nii_quota || '15';

            const lotSize = parseInt(ipo.ipo_market_lot?.[0]?.lot_size || '0');

            return {
                issue_size: ipo.ipo_size || '',
                price_band: ipo.price_band || '',
                lot_size: lotSize,
                allocation_details: {
                    retail: parsePercentage(retailQuota),
                    qib: parsePercentage(qibQuota),
                    nii: parsePercentage(niiQuota)
                },
                approximate_gains_potential: 0,
                gains_rationale: ipo.gmp_price_gain || '',
                profitability_of_allotment: {
                    score: 0,
                    assessment: ''
                }
            };
        };

        // Helper function to determine score color
        const getScoreColor = (score: number) => {
            if (score >= 8) return "text-green-600";
            if (score >= 6) return "text-yellow-600";
            return "text-red-600";
        };

        // Helper function to get the upper price from the price band
        const getDisplayPrice = () => {
            const priceBand = analysisData.summary?.gains_rationale || ipoItem.ipo.price_band;
            if (priceBand && typeof priceBand === "string" && priceBand.includes(" - ")) {
                const parts = priceBand.split(" - ");
                const upperPrice = parts[1]?.trim();
                if (upperPrice && !isNaN(parseFloat(upperPrice))) return `₹${upperPrice}`;
            }
            return "N/A";
        };

        // Calculate timeline positions and data
        const dotSegments = { opening: 10, closing: 15, listing: 8, allotment: 12 };
        const totalDots = Object.values(dotSegments).reduce((a, b) => a + b, 0);
        const markerPositions = {
            opening: "0%",
            closing: `${(dotSegments.opening / totalDots) * 100}%`,
            listing: `${((dotSegments.opening + dotSegments.closing) / totalDots) * 100}%`,
            allotment: `${((dotSegments.opening + dotSegments.closing + dotSegments.listing) / totalDots) * 100}%`,
        };

        const timelineData = {
            opening: analysisData.time?.issue_dates?.opening || "",
            closing: analysisData.time?.issue_dates?.closing || "",
            listing: analysisData.time?.listing_details?.expected_date || "",
            allotment: analysisData.time?.allotment_timeline?.date || "",
        };

        const getDotColorClass = (index: number) => {
            if (index >= dotSegments.opening && index < dotSegments.opening + dotSegments.closing)
                return "bg-[#B4292E]";
            if (index >= dotSegments.opening + dotSegments.closing && index < totalDots - dotSegments.allotment)
                return "bg-[#E4CA28]";
            if (index >= totalDots - dotSegments.allotment) return "bg-[#0073E6]";
            return "bg-[#00914D]";
        };

        // Calculate overall score and metrics for preview
        const overallScore = ((analysisData.fundamentals?.score ?? 0) + (analysisData.performance?.score ?? 0)) / 2;
        const displayPrice = getDisplayPrice();
        const showPriceBox = displayPrice !== "N/A";
        const priceBoxPosition = `${((dotSegments.opening + dotSegments.closing / 2) / totalDots) * 100}%`;

        // Data for investor allocation split
        const investorData = [
            {
                label: "Retail Investor",
                value: parseFloat(ipoItem.ipo.ipo_details?.retail_quota || '35'),
            },
            {
                label: "NII",
                value: parseFloat(ipoItem.ipo.ipo_details?.nii_quota || '15'),
            },
            {
                label: "QIB",
                value: parseFloat(ipoItem.ipo.ipo_details?.qib_quota || '50'),
            }
        ];

        const handleSave = async () => {
            let isCurrentStepSaved = true;
            if (jsonInput.trim()) {
                isCurrentStepSaved = saveCurrentStep(jsonInput);
            }

            if (!isCurrentStepSaved) {
                toast.error("The current step has invalid JSON data. Please fix it before saving.");
                return;
            }

            // Get final analysis data with current step if there's input
            let finalAnalysisData = analysisData;
            if (jsonInput.trim()) {
                const validation = validateJson(jsonInput);
                if (validation.isValid) {
                    if (validation.isCombined && validation.combinedData) {
                        finalAnalysisData = { ...analysisData, ...validation.combinedData };
                    } else if (validation.data && currentStepData.id !== 'all') {
                        finalAnalysisData = { ...analysisData, [currentStepData.id]: validation.data };
                    }
                }
            }

            const requiredSteps = analysisSteps.filter(step => step.required);
            const firstMissingStep = requiredSteps.find(step => !finalAnalysisData[step.id as keyof AnalysisData]);

            if (firstMissingStep) {
                const missingStepIndex = analysisSteps.findIndex(s => s.id === firstMissingStep.id);
                setCurrentStep(missingStepIndex);
                toast.error(`Please complete the '${firstMissingStep.title}' step before saving.`);
                return;
            }

            setIsSubmitting(true);
            try {
                // Map factual IPO details from the existing IPO data
                const mappedIpoDetails = mapIpoDetails(ipoItem.ipo);
                const summaryData = finalAnalysisData.summary;

                // Merge analytical summary data into the factual IPO details
                const finalIpoDetails = {
                    ...mappedIpoDetails,
                    approximate_gains_potential: summaryData?.approximate_gains_potential ?? 0,
                    gains_rationale: ipoItem.ipo.gmp_price_gain || '',
                    profitability_of_allotment: summaryData?.profitability_of_allotment ?? { score: 0, assessment: '' },
                };

                // Calculate summary metrics from the collected data
                const summaryMetrics = {
                    fundamentals_score: finalAnalysisData.fundamentals?.score || 0,
                    risk_meter: finalAnalysisData.risk_meter?.score || 0,
                    flexibility_score: finalAnalysisData.flexibility?.score || 0,
                    time_score: finalAnalysisData.time?.score || 0,
                    performance_score: finalAnalysisData.performance?.score || 0,
                    approximate_gains_potential: finalIpoDetails.approximate_gains_potential,
                    profitability_of_allotment: finalIpoDetails.profitability_of_allotment.score,
                    total_revenue: finalAnalysisData.fundamentals?.revenue_details?.total_revenue || 0,
                    net_profit: finalAnalysisData.fundamentals?.profit_analysis?.net_profit || 0,
                    total_assets: finalAnalysisData.fundamentals?.assets_and_liabilities?.total_assets || 0
                };

                // Transform data to match the IpoComprehensiveAnalysis interface structure
                const payload = {
                    ipo_table_id: ipoItem.ipo._id,
                    company_name: ipoItem.ipo.ipo_name || ipoItem.ipo.upcoming_ipo_2025 || 'Unknown Company',
                    image_url: ipoItem.ipo.image_url || '',
                    investorSplit: marketLot,
                    slug: ipoItem.ipo.slug,
                    financialReport: ipoItem.ipo.financial_report || {},   
                    fundamentals: finalAnalysisData.fundamentals || {},
                    risk_meter: finalAnalysisData.risk_meter || {},
                    flexibility: finalAnalysisData.flexibility || {},
                    time: finalAnalysisData.time || {},
                    performance: finalAnalysisData.performance || {},
                    ipo_details: finalIpoDetails,
                    summary_metrics: summaryMetrics
                };

                const response = await fetch('/api/analysis/manipulate-analysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Failed to save analysis');

                toast.success('Comprehensive analysis saved successfully!');
                setIsOpen(false);
                onAnalysisAdded();

            } catch (error) {
                toast.error('Failed to save analysis', {
                    description: error instanceof Error ? error.message : 'Unknown error'
                });
            } finally {
                setIsSubmitting(false);
            }
        };

        // Toggle preview mode
        const togglePreview = () => {
            // Save current step data before switching to preview
            if (jsonInput.trim() && !jsonError) {
                saveCurrentStep(jsonInput);
            }
            setShowPreview(!showPreview);
        };

        // Preview component that shows the analysis sections
        const PreviewSection = () => {
            if (!showPreview) return null;

            const riskCategoryColors: { [key: string]: string } = {
                market_risks: "text-red-600",
                financial_risks: "text-orange-500",
                operational_risks: "text-gray-600",
                regulatory_risks: "text-blue-600",
                default: "text-gray-600",
            };

            return (
                <div className="space-y-6 bg-gray-50 p-6 rounded-lg max-h-[600px] overflow-y-auto">
                    {/* Key Metrics Preview */}
                    <div>
                        <h4 className="font-bold text-lg mb-4 text-blue-600">Key Metrics</h4>
                        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                            {[
                                {
                                    label: "Overall Score",
                                    value: `${overallScore.toFixed(1)}/10`,
                                    color: getScoreColor(overallScore),
                                    description: "Combined rating",
                                },
                                {
                                    label: "Issue Size",
                                    value: ipoItem.ipo.ipo_size || "N/A",
                                    color: "text-gray-700",
                                    description: "Total offering amount",
                                },
                                {
                                    label: "Price Band",
                                    value: ipoItem.ipo.price_band || "N/A",
                                    color: "text-gray-700",
                                    description: "Price per share",
                                },
                                {
                                    label: "Potential Gains",
                                    value: `~${analysisData.summary?.approximate_gains_potential || 0}%`,
                                    color: "text-green-600",
                                    description: "Expected listing gains",
                                },
                            ].map((metric) => (
                                <div
                                    key={metric.label}
                                    className="bg-white border p-4 text-center rounded-lg"
                                >
                                    <p className="mb-2 text-sm font-medium font-ibm-plex text-gray-600">
                                        {metric.label}
                                    </p>
                                    <p className={`${metric.color} text-lg font-bold font-ibm-plex`}>
                                        {metric.value}
                                    </p>
                                    <p className="mt-1 text-xs font-ibm-plex text-gray-500">
                                        {metric.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline Preview */}
                    {analysisData.time && (
                        <div>
                            <h4 className="font-bold text-lg mb-4 text-blue-600">Timeline</h4>
                            <div className="relative h-12 mb-8">
                                <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between">
                                    {Array.from({ length: totalDots }).map((_, i) => {
                                        const colorClass = getDotColorClass(i);
                                        const prevColorClass = i > 0 ? getDotColorClass(i - 1) : null;
                                        const sizeClass = i === 0 || colorClass !== prevColorClass
                                            ? "w-4 h-4 animate-pulse"
                                            : "w-3 h-3 mt-0.5";
                                        return (
                                            <div
                                                key={i}
                                                className={`rounded-full transition-all ${sizeClass} ${colorClass}`}
                                            />
                                        );
                                    })}
                                </div>

                                {showPriceBox && (
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-[#B4292E] text-white font-semibold text-xs px-2 py-1 rounded-md shadow-lg z-10 font-ibm-plex"
                                        style={{ left: priceBoxPosition }}
                                    >
                                        {displayPrice}
                                    </div>
                                )}

                                <div className="absolute inset-0">
                                    {timelineData.opening && (
                                        <TimelineMarker
                                            label="Opening"
                                            date={timelineData.opening}
                                            position={markerPositions.opening}
                                            alignment="left"
                                        />
                                    )}
                                    {timelineData.closing && (
                                        <TimelineMarker
                                            label="Closing"
                                            date={timelineData.closing}
                                            position={markerPositions.closing}
                                            alignment="left"
                                        />
                                    )}
                                    {timelineData.listing && (
                                        <TimelineMarker
                                            label="Listing"
                                            date={timelineData.listing}
                                            position={markerPositions.listing}
                                            alignment="left"
                                        />
                                    )}
                                    {timelineData.allotment && (
                                        <TimelineMarker
                                            label="Allotment"
                                            date={timelineData.allotment}
                                            position={markerPositions.allotment}
                                            alignment="left"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Investor Split Preview */}
                    <div>
                        <h4 className="font-bold text-lg mb-4 text-blue-600">Investor Allocation</h4>
                        <div className="grid grid-cols-3 gap-4 justify-items-center">
                            {investorData.map((item, i) => (
                                <ProgressCircle key={i} label={item.label} value={item.value} />
                            ))}
                        </div>
                    </div>

                    {/* Investment Summary Preview */}
                    {analysisData.summary && (
                        <div>
                            <h4 className="font-bold text-lg mb-4 text-blue-600">Investment Summary</h4>
                            <Card className="bg-white border shadow-sm">
                                <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-3 text-center p-4">
                                    <div>
                                        <p className="mb-2 text-sm font-ibm-plex text-gray-600">
                                            Profitability Score
                                        </p>
                                        <p className={`text-lg font-ibm-plex font-bold ${getScoreColor(analysisData.summary.profitability_of_allotment.score)}`}>
                                            {analysisData.summary.profitability_of_allotment.score}/10
                                        </p>
                                    </div>
                                    <div>
                                        <p className="mb-2 text-sm font-ibm-plex text-gray-600">
                                            Potential Gains
                                        </p>
                                        <p className={`text-lg font-ibm-plex font-bold ${getScoreColor(analysisData.summary.profitability_of_allotment.score)}`}>
                                            {analysisData.summary.gains_rationale.includes("%") ?
                                                analysisData.summary.gains_rationale :
                                                `${analysisData.summary.gains_rationale}%`
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <p className="mb-2 text-sm font-ibm-plex text-gray-600">
                                            Assessment
                                        </p>
                                        <p className={`text-sm font-ibm-plex ${getScoreColor(analysisData.summary.profitability_of_allotment.score)}`}>
                                            {analysisData.summary.profitability_of_allotment.assessment}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Performance Preview */}
                    {analysisData.performance && (
                        <div>
                            <h4 className="font-bold text-lg mb-4 text-blue-600">Performance Analysis</h4>
                            <div className="bg-white p-4 rounded-lg border">
                                <p className="text-sm mb-4">{analysisData.performance.summary}</p>
                                {analysisData.performance.management_quality && (
                                    <div className="flex items-center gap-4">
                                        <ProgressCircle
                                            label="Management"
                                            value={analysisData.performance.management_quality.score * 10}
                                        />
                                        <div className="text-xs space-y-1">
                                            <p><strong>Experience:</strong> {analysisData.performance.management_quality.experience}</p>
                                            <p><strong>Track Record:</strong> {analysisData.performance.management_quality.track_record}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Fundamentals Preview */}
                    {analysisData.fundamentals && (
                        <div>
                            <h4 className="font-bold text-lg mb-4 text-blue-600">Financial Fundamentals</h4>
                            <div className="grid gap-4 grid-cols-2">
                                {analysisData.fundamentals.revenue_details?.total_revenue && (
                                    <div className="bg-white rounded-lg border p-4 text-center">
                                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                        <span className="text-lg font-bold text-gray-900">
                                            INR {(analysisData.fundamentals.revenue_details.total_revenue / 10000000).toFixed(0)} CR
                                        </span>
                                    </div>
                                )}
                                {analysisData.fundamentals.profit_analysis?.net_profit && (
                                    <div className="bg-white rounded-lg border p-4 text-center">
                                        <p className="text-sm font-medium text-gray-600">Net Profit</p>
                                        <span className="text-lg font-bold text-gray-900">
                                            INR {(analysisData.fundamentals.profit_analysis.net_profit / 10000000).toFixed(0)} CR
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Risk Analysis Preview */}
                    {analysisData.risk_meter && (
                        <div>
                            <h4 className="font-bold text-lg mb-4 text-blue-600">Risk Assessment</h4>
                            <div className="bg-white p-4 rounded-lg border">
                                <p className="text-sm mb-4">{analysisData.risk_meter.summary}</p>
                                {analysisData.risk_meter.risk_categories && (
                                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                        {Object.entries(analysisData.risk_meter.risk_categories).map(
                                            ([category, risks]) => (
                                                <div key={category} className="space-y-2">
                                                    <h5 className={`capitalize text-sm font-semibold ${riskCategoryColors[category] || riskCategoryColors.default}`}>
                                                        {category.replace(/_/g, " ")}
                                                    </h5>
                                                    <ul className="text-xs space-y-1 text-gray-600">
                                                        {(risks as string[]).slice(0, 2).map((risk, i) => (
                                                            <li key={i}>• {risk}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Flexibility Preview */}
                    {analysisData.flexibility && (
                        <div>
                            <h4 className="font-bold text-lg mb-4 text-blue-600">Flexibility Analysis</h4>
                            <div className="bg-white p-4 rounded-lg border">
                                <p className="text-sm mb-4">{analysisData.flexibility.summary}</p>
                                <div className="grid gap-4 grid-cols-3">
                                    {[
                                        {
                                            label: "Market Adaptability",
                                            metric: analysisData.flexibility.market_adaptability,
                                        },
                                        {
                                            label: "Financial Stability",
                                            metric: analysisData.flexibility.financial_stability,
                                        },
                                        {
                                            label: "Operational Agility",
                                            metric: analysisData.flexibility.operational_agility,
                                        },
                                    ].map(({ label, metric }) => {
                                        if (!metric) return null;
                                        return (
                                            <ProgressCircle
                                                key={label}
                                                label={label}
                                                value={metric.score || 0}
                                                description={metric.description || ""}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        };

        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "h-9 px-3 text-sm font-bold font-ibm-plex",
                            ipoItem.analysis
                                ? "border-blue-600/20 hover:bg-blue-600/10 text-blue-600"
                                : "border-green-600/20 hover:bg-green-600/10 text-green-600"
                        )}
                    >
                        {ipoItem.analysis ? (
                            <Edit className="h-4 w-4 mr-1.5" />
                        ) : (
                            <Plus className="h-4 w-4 mr-1.5" />
                        )}
                        {ipoItem.analysis ? "Edit (JSON)" : "Add (JSON)"}
                    </Button>
                </DialogTrigger>
                <DialogContent className="h-[95vh] flex flex-col font-ibm-plex lg:max-w-[calc(100%-6rem)]">
                    <DialogHeader className="p-6 border-b flex-shrink-0">
                        <DialogTitle className="text-xl font-bold flex items-center gap-3">
                            <div className="flex items-center gap-2 justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 h-12 w-12 rounded-full">
                                        <Avatar>
                                            {ipoItem.ipo.image_url ? (
                                                <AvatarImage src={ipoItem.ipo.image_url || ''} />
                                            ) : (
                                                <AvatarFallback>{getInitials(ipoItem.ipo.ipo_name || ipoItem.ipo.upcoming_ipo_2025 || 'Unknown Company')}</AvatarFallback>
                                            )}
                                        </Avatar>
                                    </div>
                                    <div>
                                        <div>
                                            {ipoItem.ipo.ipo_name || ipoItem.ipo.upcoming_ipo_2025 || 'Unknown Company'}
                                        </div>
                                        <div className="text-sm font-medium text-gray-600 mt-1">Add Comprehensive Analysis</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Preview Toggle */}
                                    <Button
                                        onClick={togglePreview}
                                        variant={showPreview ? "default" : "outline"}
                                        size="sm"
                                        className="flex items-center gap-2"
                                    >
                                        {showPreview ? <ArrowLeftCircle className="h-4 w-4" /> : <LineChart className="h-4 w-4" />}
                                        {showPreview ? "Edit" : "Preview"}
                                    </Button>
                                    {/* RHP Link */}
                                    {rhpLink && (
                                        <Button
                                            onClick={() => window.open(rhpLink, "_blank")}
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2"
                                        >
                                            <LinkIcon className="h-4 w-4" />
                                            RHP
                                        </Button>
                                    )}
                                    {/* DRHP Link */}
                                    {drhpLink && (
                                        <Button
                                            onClick={() => window.open(drhpLink, "_blank")}
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2"
                                        >
                                            <LinkIcon className="h-4 w-4" />
                                            DRHP
                                        </Button>
                                    )}
                                    {/* NotebookLM Link */}
                                    <Button
                                        onClick={() => window.open("https://notebooklm.google.com/", "_blank")}
                                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        NotebookLM
                                    </Button>
                                </div>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 flex flex-row overflow-hidden">
                        {!showPreview ? (
                            <>
                                {/* Left Column: Progress & Details */}
                                <div className="w-1/3 min-w-[300px] border-r bg-gray-50/50 flex flex-col p-6 space-y-6 overflow-y-auto">
                                    <h3 className="font-bold text-lg text-gray-800 sticky top-0 bg-gray-50/50 pb-2">
                                        Analysis Steps
                                    </h3>
                                    <div className="space-y-4">
                                        {analysisSteps.map((step, index) => {
                                            const isCompleted = completedSteps.has(step.id);
                                            const isCurrent = index === currentStep;
                                            const StepIcon = step.icon;
                                            return (
                                                <div
                                                    key={step.id}
                                                    className={cn(
                                                        "flex items-center gap-4 p-3 rounded-lg transition-all cursor-pointer",
                                                        isCurrent
                                                            ? "bg-blue-100/80 shadow-md border-2 border-blue-200"
                                                            : "hover:bg-gray-200/60 border-2 border-transparent"
                                                    )}
                                                    onClick={() => setCurrentStep(index)}
                                                >
                                                    <div className={cn(
                                                        "flex items-center justify-center w-10 h-10 rounded-full border-2 flex-shrink-0",
                                                        isCurrent
                                                            ? "border-blue-600 bg-blue-50 text-blue-600" :
                                                            isCompleted
                                                                ? "border-green-600 bg-green-50 text-green-600" :
                                                                "border-gray-300 bg-white text-gray-400"
                                                    )}>
                                                        {isCompleted && !isCurrent ?
                                                            <CheckCircle className="h-5 w-5" /> :
                                                            <StepIcon className="h-5 w-5" />
                                                        }
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-gray-900 truncate">{step.title}</div>
                                                        <p className="text-sm text-gray-600">{step.description}</p>
                                                    </div>
                                                    {!step.required && (
                                                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                                                            Optional
                                                        </Badge>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Right Column: JSON Input */}
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <div className="p-6 border-b bg-white flex-shrink-0">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <currentStepData.icon className={`h-6 w-6 ${currentStepData.color}`} />
                                                <span className="text-lg font-bold">
                                                    Step {currentStep + 1}: {currentStepData.title}
                                                </span>
                                                {currentStepData.required && (
                                                    <Badge variant="destructive" className="text-xs ml-2">Required</Badge>
                                                )}
                                            </div>
                                            <Button variant="outline" size="sm" onClick={copyPromptToClipboard}>
                                                <Copy className="h-3 w-3 mr-1.5" />
                                                Copy Prompt
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-6 flex flex-col overflow-hidden">
                                        <div className="relative flex-1 flex flex-col">
                                            <Textarea
                                                placeholder={currentStepData.id === 'all' 
                                                    ? "Paste your all-in-one JSON data here (containing risk_factors, performance, flexibility, financial_fundamentals, timing, final_summary)..."
                                                    : `Paste your ${currentStepData.title.toLowerCase()} JSON data here...`
                                                }
                                                value={jsonInput}
                                                onChange={(e) => handleJsonChange(e.target.value)}
                                                className="flex-1 w-full font-mono text-sm resize-none min-h-0 border-2 focus:border-blue-500 rounded-lg"
                                            />
                                            {jsonError && (
                                                <div className="absolute bottom-2 left-2 right-2 bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2 shadow-lg">
                                                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                    <div className="text-sm text-red-700 font-semibold flex-1">{jsonError}</div>
                                                </div>
                                            )}
                                        </div>
                                        {jsonInput.trim() && !jsonError && (
                                            <div className="flex items-center gap-2 text-green-600 text-sm mt-3 p-2 bg-green-50 rounded-md">
                                                <CheckCircle className="h-4 w-4" />
                                                {validateJson(jsonInput).isCombined
                                                    ? "Valid Combined JSON - All 6 factors detected and ready!"
                                                    : "Valid JSON format - Ready to save"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Preview Mode - Full Width */
                            <div className="flex-1 p-6 overflow-y-auto">
                                <div className="max-w-4xl mx-auto">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-2xl font-bold text-gray-900">Analysis Preview</h3>
                                        <div className="text-sm text-gray-500">
                                            {completedSteps.size} of {analysisSteps.filter(s => s.required).length} required steps completed
                                        </div>
                                    </div>
                                    <PreviewSection />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer: Action Buttons */}
                    <div className="flex-shrink-0 border-t p-6 bg-gray-50/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {!showPreview && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => navigateStep('prev')}
                                            disabled={currentStep === 0 || isSubmitting}
                                            className="flex items-center gap-2"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Previous
                                        </Button>
                                        {!currentStepData.required && (
                                            <Button
                                                variant="ghost"
                                                onClick={() => navigateStep('skip')}
                                                disabled={isLastStep || isSubmitting}
                                                className="text-gray-600"
                                            >
                                                Skip Step
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {!showPreview && (
                                    <div className="text-sm text-gray-500 mr-2">
                                        {currentStep + 1} of {analysisSteps.length}
                                    </div>
                                )}
                                {!showPreview && !isLastStep ? (
                                    <Button
                                        onClick={() => navigateStep('next')}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        Next Step
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSubmitting}
                                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Saving Analysis...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Save Analysis
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }