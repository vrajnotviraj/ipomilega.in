import type { FinancialReport, IpoMarketLot } from '@/types/ipo';

export interface IpoComprehensiveAnalysis {
    _id: string;
    ipo_table_id: string;
    slug: string;
    company_name: string;
    image_url: string;
    fundamentals: IpoFundamentals;
    risk_meter: IpoRiskMeter;
    flexibility: IpoFlexibility;
    time: IpoTime;
    performance: IpoPerformance;
    ipo_details: IpoDetailsComprehensive;
    summary_metrics: IpoSummaryMetrics;
    gmp_price_gain: string;
    investorSplit: IpoMarketLot[];
    financialReport: FinancialReport[];
    created_at?: Date;
    updated_at?: Date;
}

interface IpoFundamentals {
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
    // Absent on older analyses.
    debt?: {
        total_debt: string | null; // "₹120 Cr" or "Debt-free"
        summary: string;
    };
    offer_structure?: {
        fresh_issue: string | null;
        offer_for_sale: string | null;
        promoters_selling: boolean | null;
        selling_shareholders: string;
        why_selling: string;
    };
}

interface IpoRiskMeter {
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

interface IpoFlexibility {
    score: number;
    summary: string;
    market_adaptability: {
        score: number;
        description: string;
    };
    financial_stability: {
        score: number | null;
        description: string | null;
    };
    operational_agility: {
        score: number;
        description: string;
    };
    product_diversification: string;
    pivoting_history: string[];
    future_adaptability_potential: string;
}

interface IpoTime {
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

interface IpoPerformance {
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

interface IpoDetailsComprehensive {
    issue_size: string;
    price_band: string;
    lot_size: number;
    shares: number;
    allocation_details: {
        retail: number;
        qib: number;
        nii: number;
    };
    approximate_gains_potential: number;
    gains_rationale: string;
    profitability_of_allotment: {
        score: number;
        assessment: string;
    };
}

interface IpoSummaryMetrics {
    fundamentals_score: number;
    risk_meter: number;
    flexibility_score: number;
    time_score: number;
    performance_score: number;
    approximate_gains_potential: number;
    profitability_of_allotment: number;
    total_revenue: number;
    net_profit: number;
    total_assets: number;
}
