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
import { cn, getInitials } from '@/lib/utils';
import { Ipo } from '@/types/ipo';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';

// Only the fields this modal reads; the prompts below describe the full shape.
interface ScoredText {
    score: number;
    description: string;
}

interface AnalysisData {
    risk_meter?: { score: number; summary: string; risk_categories: Record<string, string[]> };
    performance?: {
        score: number;
        summary: string;
        management_quality: { experience: string; track_record: string; score: number };
    };
    flexibility?: {
        score: number;
        summary: string;
        market_adaptability: ScoredText;
        financial_stability: ScoredText;
        operational_agility: ScoredText;
    };
    fundamentals?: {
        score: number;
        revenue_details: { total_revenue: number };
        profit_analysis: { net_profit: number };
        assets_and_liabilities: { total_assets: number };
    };
    time?: {
        score: number;
        issue_dates: { opening: string; closing: string };
        listing_details: { expected_date: string };
        allotment_timeline: { date: string };
    };
    summary?: {
        approximate_gains_potential: number;
        gains_rationale: string;
        profitability_of_allotment: { score: number; assessment: string };
    };
}

type SectionKey = keyof AnalysisData;
const SECTION_KEYS: SectionKey[] = ['risk_meter', 'performance', 'flexibility', 'fundamentals', 'time', 'summary'];

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

type StepId = keyof typeof analysisPrompts;

interface AnalysisStep {
    id: StepId;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    required: boolean;
}

const analysisSteps: AnalysisStep[] = [
    { id: 'all', title: 'All Factors (One Shot)', description: 'Paste all 6 analysis factors in a single JSON object.', icon: Sparkles, color: 'text-score-mid', required: false },
    { id: 'risk_meter', title: 'Risk Analysis', description: 'Evaluate potential risks and mitigation strategies.', icon: Shield, color: 'text-destructive', required: true },
    { id: 'performance', title: 'Performance', description: 'Analyze historical growth and achievements.', icon: TrendingUp, color: 'text-score-good', required: true },
    { id: 'flexibility', title: 'Flexibility', description: 'Assess market adaptability and agility.', icon: Activity, color: 'text-primary', required: true },
    { id: 'fundamentals', title: 'Fundamentals', description: 'Review financial health and ratios.', icon: LineChart, color: 'text-primary', required: true },
    { id: 'time', title: 'Time Analysis', description: 'Check market timing and milestones.', icon: Clock, color: 'text-score-mid', required: true },
    { id: 'summary', title: 'Investment Summary', description: 'Provide final verdict and gain potential.', icon: CheckCircle, color: 'text-primary', required: true }
];
const requiredSteps = analysisSteps.filter(step => step.required);

// Names each section may have in pasted combined JSON. The first one is what we write back out.
const COMBINED_NAMES: Record<SectionKey, string[]> = {
    risk_meter: ['risk_factors', 'risk_meter'],
    performance: ['performance'],
    flexibility: ['flexibility'],
    fundamentals: ['financial_fundamentals', 'fundamentals'],
    time: ['timing', 'time'],
    summary: ['final_summary', 'summary'],
};

function isCombinedJson(obj: any): boolean {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    return Object.values(COMBINED_NAMES).flat().some(name => name in obj);
}

function extractCombinedSections(obj: any): Partial<AnalysisData> {
    const sections: Partial<AnalysisData> = {};
    for (const key of SECTION_KEYS) {
        const value = COMBINED_NAMES[key].map(name => obj[name]).find(Boolean);
        if (value) sections[key] = value;
    }
    return sections;
}

function toCombinedJson(data: AnalysisData): string {
    return JSON.stringify(Object.fromEntries(SECTION_KEYS.map(key => [COMBINED_NAMES[key][0], data[key] || null])), null, 2);
}

/** Parses the textarea into the sections it fills for this step, or an error message. */
function parseStepInput(input: string, stepId: StepId): { sections?: Partial<AnalysisData>; isCombined?: boolean; error?: string } {
    if (!input.trim()) return { error: 'JSON data cannot be empty.' };
    let parsed: any;
    try {
        parsed = JSON.parse(input);
    } catch (error) {
        return { error: `Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
    if (isCombinedJson(parsed)) return { sections: extractCombinedSections(parsed), isCombined: true };
    if (!parsed) return { error: 'Invalid JSON' };
    if (stepId === 'all') return { error: 'Expected combined JSON object with keys like risk_factors, performance, etc.' };
    return { sections: { [stepId]: parsed }, isCombined: false };
}

function parsePercentage(value: string): number {
    const match = value.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
}

function getScoreColor(score: number) {
    if (score >= 8) return "text-score-good";
    if (score >= 6) return "text-score-mid";
    return "text-destructive";
}

const riskCategoryColors: Record<string, string> = {
    market_risks: "text-destructive",
    financial_risks: "text-score-mid",
    operational_risks: "text-muted-foreground",
    regulatory_risks: "text-primary",
};

const TIMELINE_SEGMENTS = [
    { label: 'Opening', dots: 10, color: 'bg-[var(--score-good)]' },
    { label: 'Closing', dots: 15, color: 'bg-[var(--destructive)]' },
    { label: 'Listing', dots: 8, color: 'bg-[var(--score-mid)]' },
    { label: 'Allotment', dots: 12, color: 'bg-[var(--primary)]' },
];
const TOTAL_DOTS = TIMELINE_SEGMENTS.reduce((sum, segment) => sum + segment.dots, 0);
const toTimelinePercent = (dots: number) => `${(dots / TOTAL_DOTS) * 100}%`;
const segmentStarts = TIMELINE_SEGMENTS.map((_, i) => TIMELINE_SEGMENTS.slice(0, i).reduce((sum, segment) => sum + segment.dots, 0));
const priceBoxPosition = toTimelinePercent(TIMELINE_SEGMENTS[0].dots + TIMELINE_SEGMENTS[1].dots / 2);

function ProgressCircle({ label, value, description }: { label: string; value: number; description?: string }) {
    const cappedValue = Math.min(value, 100);
    const circumference = 2 * Math.PI * 16;

    return (
        <div className="flex flex-col items-center text-center">
            <h4 className="mb-2 sm:mb-4 text-sm font-semibold font-sans">
                {label}
            </h4>
            <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                <svg width="100%" height="100%" viewBox="0 0 36 36" className="w-full h-full">
                    <circle cx="18" cy="18" r={14} fill="var(--primary)" />
                    <circle
                        cx="18"
                        cy="18"
                        r={16}
                        fill="none"
                        stroke="var(--muted)"
                        strokeWidth={4}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - (cappedValue / 100) * circumference}
                        transform="rotate(-90 18 18)"
                        style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
                    />
                    <text
                        x="18"
                        y="21"
                        textAnchor="middle"
                        fill="var(--primary-foreground)"
                        fontSize="7"
                        fontWeight="bold"
                        style={{ fontFamily: "var(--font-sans)" }}
                    >
                        {cappedValue.toFixed(0)}
                    </text>
                </svg>
            </div>
            {description && (
                <p className="text-xs mt-2 max-w-[120px] font-sans">
                    {description}
                </p>
            )}
        </div>
    );
}

function TimelineMarker({ label, date, position }: { label: string; date: string; position: string }) {
    const formattedDate = new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    return (
        <div
            className="absolute top-0 h-full flex flex-col justify-between items-start text-left"
            style={{ left: position }}
        >
            <p className="text-xs font-medium -translate-y-6 font-sans">
                {label}
            </p>
            <p className="text-xs font-semibold translate-y-6 font-sans">
                {formattedDate}
            </p>
        </div>
    );
}

interface IpoAnalysisModalProps {
    ipoItem: {
        ipo: Ipo;
        analysis?: any;
    };
    onAnalysisAdded: () => void;
}

export function IpoAnalysisModal({ ipoItem, onAnalysisAdded }: IpoAnalysisModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [analysisData, setAnalysisData] = useState<AnalysisData>({});
    const [jsonInput, setJsonInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const { ipo } = ipoItem;
    const currentStepData = analysisSteps[currentStep];
    const isLastStep = currentStep === analysisSteps.length - 1;
    const companyName = ipo.ipo_name || ipo.upcoming_ipo_2025 || 'Unknown Company';
    const prospectusLinks = [
        { label: 'RHP', href: ipo.ipo_details?.rhp_draft_prospectus_links?.[0]?.href },
        { label: 'DRHP', href: ipo.ipo_details?.drhp_draft_prospectus_links?.[0]?.href },
    ];

    // Reset the wizard from the saved analysis each time the dialog opens.
    useEffect(() => {
        if (!isOpen) return;
        setCurrentStep(0);
        setIsSubmitting(false);
        setShowPreview(false);

        const existing = ipoItem.analysis;
        if (!existing) {
            setAnalysisData({});
            setCompletedSteps(new Set());
            return;
        }
        setAnalysisData({
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
        });
        const sectionsBesidesSummary = SECTION_KEYS.filter(key => key !== 'summary');
        const completed = new Set<string>(['summary', ...sectionsBesidesSummary.filter(key => existing[key])]);
        if (sectionsBesidesSummary.every(key => existing[key])) completed.add('all');
        setCompletedSteps(completed);
    }, [isOpen, ipoItem]);

    // Show the saved JSON for whichever step is open.
    useEffect(() => {
        const stepId = analysisSteps[currentStep].id;
        if (stepId === 'all') {
            setJsonInput(Object.values(analysisData).some(Boolean) ? toCombinedJson(analysisData) : '');
        } else {
            const stepData = analysisData[stepId];
            setJsonInput(stepData ? JSON.stringify(stepData, null, 2) : '');
        }
        setJsonError(null);
    }, [currentStep, analysisData]);

    const handleJsonChange = (value: string) => {
        setJsonInput(value);
        setJsonError(null);
    };

    const copyPromptToClipboard = () => {
        navigator.clipboard.writeText(analysisPrompts[currentStepData.id]);
        toast.success(`Prompt for "${currentStepData.title}" copied!`);
    };

    /** Stores the parsed input and marks its steps done. Returns the sections, or null on bad input. */
    const saveCurrentStep = (input: string): Partial<AnalysisData> | null => {
        const { sections, isCombined, error } = parseStepInput(input, currentStepData.id);
        if (!sections) {
            setJsonError(error || 'Invalid JSON');
            return null;
        }
        setAnalysisData(prev => ({ ...prev, ...sections }));
        setCompletedSteps(prev => {
            const next = new Set([...prev, ...Object.keys(sections)]);
            if (isCombined) next.add('all');
            return next;
        });
        setJsonError(null);
        return sections;
    };

    const navigateStep = (direction: 'next' | 'prev' | 'skip') => {
        if (jsonInput.trim()) {
            if (!saveCurrentStep(jsonInput)) return;
        } else if (currentStepData.required) {
            setCompletedSteps(prev => {
                const next = new Set(prev);
                next.delete(currentStepData.id);
                return next;
            });
        }

        if (direction === 'next' && !isLastStep) {
            setCurrentStep(c => c + 1);
        } else if (direction === 'prev' && currentStep > 0) {
            setCurrentStep(c => c - 1);
        } else if (direction === 'skip' && !currentStepData.required && !isLastStep) {
            setCurrentStep(c => c + 1);
        }
    };

    const handleSave = async () => {
        let finalAnalysisData = analysisData;
        if (jsonInput.trim()) {
            const sections = saveCurrentStep(jsonInput);
            if (!sections) {
                toast.error("The current step has invalid JSON data. Please fix it before saving.");
                return;
            }
            finalAnalysisData = { ...analysisData, ...sections };
        }

        const firstMissingStep = requiredSteps.find(step => !finalAnalysisData[step.id as SectionKey]);
        if (firstMissingStep) {
            setCurrentStep(analysisSteps.indexOf(firstMissingStep));
            toast.error(`Please complete the '${firstMissingStep.title}' step before saving.`);
            return;
        }

        setIsSubmitting(true);
        try {
            const { fundamentals, risk_meter, flexibility, time, performance, summary } = finalAnalysisData;
            const ipoDetails = {
                issue_size: ipo.ipo_size || '',
                price_band: ipo.price_band || '',
                lot_size: parseInt(ipo.ipo_market_lot?.[0]?.lot_size || '0'),
                shares: parseInt(ipo.ipo_market_lot?.[0]?.shares || '0'),
                allocation_details: {
                    retail: parsePercentage(ipo.ipo_details?.retail_quota || '35'),
                    qib: parsePercentage(ipo.ipo_details?.qib_quota || '50'),
                    nii: parsePercentage(ipo.ipo_details?.nii_quota || '15')
                },
                approximate_gains_potential: summary?.approximate_gains_potential ?? 0,
                gains_rationale: ipo.gmp_price_gain || '',
                profitability_of_allotment: summary?.profitability_of_allotment ?? { score: 0, assessment: '' },
            };

            const payload = {
                ipo_table_id: ipo._id,
                company_name: companyName,
                image_url: ipo.image_url || '',
                investorSplit: ipo.ipo_market_lot || [],
                slug: ipo.slug,
                gmp_price_gain: ipo.gmp_price_gain || '',
                financialReport: ipo.financial_report || {},
                fundamentals: fundamentals || {},
                risk_meter: risk_meter || {},
                flexibility: flexibility || {},
                time: time || {},
                performance: performance || {},
                ipo_details: ipoDetails,
                summary_metrics: {
                    fundamentals_score: fundamentals?.score || 0,
                    risk_meter: risk_meter?.score || 0,
                    flexibility_score: flexibility?.score || 0,
                    time_score: time?.score || 0,
                    performance_score: performance?.score || 0,
                    approximate_gains_potential: ipoDetails.approximate_gains_potential,
                    profitability_of_allotment: ipoDetails.profitability_of_allotment.score,
                    total_revenue: fundamentals?.revenue_details?.total_revenue || 0,
                    net_profit: fundamentals?.profit_analysis?.net_profit || 0,
                    total_assets: fundamentals?.assets_and_liabilities?.total_assets || 0
                }
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

    const togglePreview = () => {
        if (jsonInput.trim() && !jsonError) saveCurrentStep(jsonInput);
        setShowPreview(!showPreview);
    };

    const { summary, time, performance, fundamentals, risk_meter, flexibility } = analysisData;
    const overallScore = ((fundamentals?.score ?? 0) + (performance?.score ?? 0)) / 2;

    // Reads the upper price out of "low - high"; the summary's gains_rationale wins over the IPO price band.
    const priceBand = summary?.gains_rationale || ipo.price_band;
    const upperPrice = typeof priceBand === "string" && priceBand.includes(" - ") ? priceBand.split(" - ")[1]?.trim() : undefined;
    const displayPrice = upperPrice && !isNaN(parseFloat(upperPrice)) ? `₹${upperPrice}` : null;

    const timelineDates = [
        time?.issue_dates?.opening,
        time?.issue_dates?.closing,
        time?.listing_details?.expected_date,
        time?.allotment_timeline?.date,
    ];
    const dotColors = TIMELINE_SEGMENTS.flatMap(segment => Array<string>(segment.dots).fill(segment.color));

    const investorData = [
        { label: "Retail Investor", value: parseFloat(ipo.ipo_details?.retail_quota || '35') },
        { label: "NII", value: parseFloat(ipo.ipo_details?.nii_quota || '15') },
        { label: "QIB", value: parseFloat(ipo.ipo_details?.qib_quota || '50') },
    ];

    const keyMetrics = [
        { label: "Overall Score", value: `${overallScore.toFixed(1)}/10`, color: getScoreColor(overallScore), description: "Combined rating" },
        { label: "Issue Size", value: ipo.ipo_size || "N/A", color: "text-muted-foreground", description: "Total offering amount" },
        { label: "Price Band", value: ipo.price_band || "N/A", color: "text-muted-foreground", description: "Price per share" },
        { label: "Potential Gains", value: `~${summary?.approximate_gains_potential || 0}%`, color: "text-score-good", description: "Expected listing gains" },
    ];

    const renderPreview = () => {
        const summaryScoreColor = summary && getScoreColor(summary.profitability_of_allotment.score);
        return (
            <div className="space-y-6 bg-muted p-6 rounded-lg max-h-[600px] overflow-y-auto">
                <div>
                    <h4 className="font-semibold font-serif text-lg mb-4 text-primary">Key Metrics</h4>
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                        {keyMetrics.map((metric) => (
                            <div key={metric.label} className="bg-card border p-4 text-center rounded-lg">
                                <p className="mb-2 text-sm font-medium font-sans text-muted-foreground">
                                    {metric.label}
                                </p>
                                <p className={`${metric.color} text-lg font-bold font-sans`}>
                                    {metric.value}
                                </p>
                                <p className="mt-1 text-xs font-sans text-muted-foreground">
                                    {metric.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {time && (
                    <div>
                        <h4 className="font-semibold font-serif text-lg mb-4 text-primary">Timeline</h4>
                        <div className="relative h-12 mb-8">
                            <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between">
                                {dotColors.map((color, i) => {
                                    const startsSegment = i === 0 || color !== dotColors[i - 1];
                                    return (
                                        <div
                                            key={i}
                                            className={`rounded-full transition-all ${startsSegment ? "w-4 h-4 animate-pulse" : "w-3 h-3 mt-0.5"} ${color}`}
                                        />
                                    );
                                })}
                            </div>

                            {displayPrice && (
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-destructive text-white font-semibold text-xs px-2 py-1 rounded-md shadow-lg z-10 font-sans"
                                    style={{ left: priceBoxPosition }}
                                >
                                    {displayPrice}
                                </div>
                            )}

                            <div className="absolute inset-0">
                                {TIMELINE_SEGMENTS.map((segment, i) => {
                                    const date = timelineDates[i];
                                    return date && (
                                        <TimelineMarker
                                            key={segment.label}
                                            label={segment.label}
                                            date={date}
                                            position={toTimelinePercent(segmentStarts[i])}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <h4 className="font-semibold font-serif text-lg mb-4 text-primary">Investor Allocation</h4>
                    <div className="grid grid-cols-3 gap-4 justify-items-center">
                        {investorData.map((item, i) => (
                            <ProgressCircle key={i} label={item.label} value={item.value} />
                        ))}
                    </div>
                </div>

                {summary && (
                    <div>
                        <h4 className="font-semibold font-serif text-lg mb-4 text-primary">Investment Summary</h4>
                        <Card className="bg-card border shadow-sm">
                            <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-3 text-center p-4">
                                <div>
                                    <p className="mb-2 text-sm font-sans text-muted-foreground">
                                        Profitability Score
                                    </p>
                                    <p className={`text-lg font-sans font-bold ${summaryScoreColor}`}>
                                        {summary.profitability_of_allotment.score}/10
                                    </p>
                                </div>
                                <div>
                                    <p className="mb-2 text-sm font-sans text-muted-foreground">
                                        Potential Gains
                                    </p>
                                    <p className={`text-lg font-sans font-bold ${summaryScoreColor}`}>
                                        {summary.gains_rationale.includes("%") ? summary.gains_rationale : `${summary.gains_rationale}%`}
                                    </p>
                                </div>
                                <div>
                                    <p className="mb-2 text-sm font-sans text-muted-foreground">
                                        Assessment
                                    </p>
                                    <p className={`text-sm font-sans ${summaryScoreColor}`}>
                                        {summary.profitability_of_allotment.assessment}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {performance && (
                    <div>
                        <h4 className="font-semibold font-serif text-lg mb-4 text-primary">Performance Analysis</h4>
                        <div className="bg-card p-4 rounded-lg border">
                            <p className="text-sm mb-4">{performance.summary}</p>
                            {performance.management_quality && (
                                <div className="flex items-center gap-4">
                                    <ProgressCircle label="Management" value={performance.management_quality.score * 10} />
                                    <div className="text-xs space-y-1">
                                        <p><strong>Experience:</strong> {performance.management_quality.experience}</p>
                                        <p><strong>Track Record:</strong> {performance.management_quality.track_record}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {fundamentals && (
                    <div>
                        <h4 className="font-semibold font-serif text-lg mb-4 text-primary">Financial Fundamentals</h4>
                        <div className="grid gap-4 grid-cols-2">
                            {[
                                { label: "Total Revenue", amount: fundamentals.revenue_details?.total_revenue },
                                { label: "Net Profit", amount: fundamentals.profit_analysis?.net_profit },
                            ].map(({ label, amount }) => amount && (
                                <div key={label} className="bg-card rounded-lg border p-4 text-center">
                                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                                    <span className="text-lg font-mono font-semibold text-foreground">
                                        INR {(amount / 10000000).toFixed(0)} CR
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {risk_meter && (
                    <div>
                        <h4 className="font-semibold font-serif text-lg mb-4 text-primary">Risk Assessment</h4>
                        <div className="bg-card p-4 rounded-lg border">
                            <p className="text-sm mb-4">{risk_meter.summary}</p>
                            {risk_meter.risk_categories && (
                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                    {Object.entries(risk_meter.risk_categories).map(([category, risks]) => (
                                        <div key={category} className="space-y-2">
                                            <h5 className={`capitalize text-sm font-semibold ${riskCategoryColors[category] || "text-muted-foreground"}`}>
                                                {category.replace(/_/g, " ")}
                                            </h5>
                                            <ul className="text-xs space-y-1 text-muted-foreground">
                                                {risks.slice(0, 2).map((risk, i) => (
                                                    <li key={i}>• {risk}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {flexibility && (
                    <div>
                        <h4 className="font-semibold font-serif text-lg mb-4 text-primary">Flexibility Analysis</h4>
                        <div className="bg-card p-4 rounded-lg border">
                            <p className="text-sm mb-4">{flexibility.summary}</p>
                            <div className="grid gap-4 grid-cols-3">
                                {[
                                    { label: "Market Adaptability", metric: flexibility.market_adaptability },
                                    { label: "Financial Stability", metric: flexibility.financial_stability },
                                    { label: "Operational Agility", metric: flexibility.operational_agility },
                                ].map(({ label, metric }) => metric && (
                                    <ProgressCircle
                                        key={label}
                                        label={label}
                                        value={metric.score || 0}
                                        description={metric.description || ""}
                                    />
                                ))}
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
                        "h-9 px-3 text-sm font-bold font-sans",
                        ipoItem.analysis
                            ? "border-primary/20 hover:bg-primary/10 text-primary"
                            : "border-score-good/20 hover:bg-score-good/10 text-score-good"
                    )}
                >
                    {ipoItem.analysis ? <Edit className="h-4 w-4 mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                    {ipoItem.analysis ? "Edit (JSON)" : "Add (JSON)"}
                </Button>
            </DialogTrigger>
            <DialogContent className="h-[95vh] flex flex-col font-sans lg:max-w-[calc(100%-6rem)]">
                <DialogHeader className="p-6 border-b flex-shrink-0">
                    <DialogTitle className="text-xl font-bold flex items-center gap-3">
                        <div className="flex items-center gap-2 justify-between w-full">
                            <div className="flex items-center gap-2">
                                <div className="p-2 h-12 w-12 rounded-full">
                                    <Avatar>
                                        {ipo.image_url ? (
                                            <AvatarImage src={ipo.image_url} />
                                        ) : (
                                            <AvatarFallback>{getInitials(companyName)}</AvatarFallback>
                                        )}
                                    </Avatar>
                                </div>
                                <div>
                                    <div className="font-serif font-semibold">{companyName}</div>
                                    <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mt-1">Add Comprehensive Analysis</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={togglePreview}
                                    variant={showPreview ? "default" : "outline"}
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    {showPreview ? <ArrowLeftCircle className="h-4 w-4" /> : <LineChart className="h-4 w-4" />}
                                    {showPreview ? "Edit" : "Preview"}
                                </Button>
                                {prospectusLinks.map(({ label, href }) => href && (
                                    <Button
                                        key={label}
                                        onClick={() => window.open(href, "_blank")}
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-2"
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                        {label}
                                    </Button>
                                ))}
                                <Button
                                    onClick={() => window.open("https://notebooklm.google.com/", "_blank")}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
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
                            <div className="w-1/3 min-w-[300px] border-r bg-muted/50 flex flex-col p-6 space-y-6 overflow-y-auto">
                                <h3 className="font-serif font-semibold text-lg text-foreground sticky top-0 bg-muted/50 pb-2">
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
                                                        ? "bg-primary/15 shadow-md border-2 border-primary/20"
                                                        : "hover:bg-accent border-2 border-transparent"
                                                )}
                                                onClick={() => setCurrentStep(index)}
                                            >
                                                <div className={cn(
                                                    "flex items-center justify-center w-10 h-10 rounded-full border-2 flex-shrink-0",
                                                    isCurrent
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : isCompleted
                                                            ? "border-score-good bg-score-good/10 text-score-good"
                                                            : "border-border bg-card text-muted-foreground"
                                                )}>
                                                    {isCompleted && !isCurrent ? <CheckCircle className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-foreground truncate">{step.title}</div>
                                                    <p className="text-sm text-muted-foreground">{step.description}</p>
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

                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="p-6 border-b bg-card flex-shrink-0">
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
                                            className="flex-1 w-full font-mono text-sm resize-none min-h-0 border-2 focus:border-primary rounded-lg"
                                        />
                                        {jsonError && (
                                            <div className="absolute bottom-2 left-2 right-2 bg-destructive/10 border border-destructive/30 rounded-md p-3 flex items-start gap-2 shadow-lg">
                                                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                                                <div className="text-sm text-destructive font-semibold flex-1">{jsonError}</div>
                                            </div>
                                        )}
                                    </div>
                                    {jsonInput.trim() && !jsonError && (
                                        <div className="flex items-center gap-2 text-score-good text-sm mt-3 p-2 bg-score-good/10 rounded-md">
                                            <CheckCircle className="h-4 w-4" />
                                            {parseStepInput(jsonInput, currentStepData.id).isCombined
                                                ? "Valid Combined JSON - All 6 factors detected and ready!"
                                                : "Valid JSON format - Ready to save"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="max-w-4xl mx-auto">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-semibold font-serif text-foreground">Analysis Preview</h3>
                                    <div className="text-sm text-muted-foreground">
                                        {completedSteps.size} of {requiredSteps.length} required steps completed
                                    </div>
                                </div>
                                {renderPreview()}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-shrink-0 border-t p-6 bg-muted/50">
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
                                            className="text-muted-foreground"
                                        >
                                            Skip Step
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {!showPreview && (
                                <div className="text-sm text-muted-foreground mr-2">
                                    {currentStep + 1} of {analysisSteps.length}
                                </div>
                            )}
                            {!showPreview && !isLastStep ? (
                                <Button
                                    onClick={() => navigateStep('next')}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                                >
                                    Next Step
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSave}
                                    disabled={isSubmitting}
                                    className="bg-score-good hover:bg-score-good/90 text-white flex items-center gap-2"
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
