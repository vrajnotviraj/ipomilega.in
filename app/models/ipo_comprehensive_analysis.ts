export interface IpoComprehensiveAnalysis {
    _id: string; // Handle MongoDB ObjectId format
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
    investorSplit: IPOInvestorSplit[];
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
        ebitda: number | null; // Can be null
        profit_trend: string;
    };
    assets_and_liabilities: {
        total_assets: number;
        total_liabilities: number | null; // Can be null
        debt_to_equity_ratio: number | null; // Can be null
    };
    financial_ratios: {
        current_ratio: string | null; // Can be null
        quick_ratio: string | null; // Can be null
        return_on_equity: string | null; // Can be null
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
        score: number | null; // Can be null
        description: string | null; // Can be null
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

// This interface maps the IPO details from the existing Ipo interface to the comprehensive analysis
interface IpoDetailsComprehensive {
    issue_size: string; // Maps from ipo_details.issue_size or ipo_size
    price_band: string; // Maps from ipo_details.ipo_price_band or price_band
    lot_size: number; // Maps from ipo_market_lot[0].lot_size (parsed as number)
    shares: number; // Number of shares per lot
    allocation_details: {
        retail: number; // Maps from ipo_details.retail_quota (parsed as percentage)
        qib: number; // Maps from ipo_details.qib_quota (parsed as percentage)
        nii: number; // Maps from ipo_details.nii_quota (parsed as percentage)
    };
    approximate_gains_potential: number; // Default 0, can be updated
    gains_rationale: string; // Default empty, can be updated
    profitability_of_allotment: {
        score: number; // Default 0, can be updated
        assessment: string; // Default empty, can be updated
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


interface IPOInvestorSplit {
    application: string;
    lot_size: string;
    shares: string;
    amount: string;
}


interface FinancialReport {
    period_ended: string;
    revenue: string;
    expense: string;
    profit_after_tax: string;
    assets: string;
}