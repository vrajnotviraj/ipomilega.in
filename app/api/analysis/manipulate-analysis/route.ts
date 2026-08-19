// app/api/analysis/manipulate-analysis/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongo";
import { ObjectId } from "mongodb";

// Type definitions for request body
interface RiskMeterData {
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

interface PerformanceData {
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

interface FlexibilityData {
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

interface FundamentalsData {
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

interface TimeData {
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

interface IPOInvestorSplit{
  application:string;
  lot_size:string;
  shares:string;
  amount:string;
}

interface IpoDetailsData {
  opening: string;
  closing: string;
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

interface SummaryMetrics {
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

interface RequestBody {
  ipo_table_id: string;
  company_name: string;
  image_url: string;
  slug:string;
  investorSplit: IPOInvestorSplit[];
  financialReport: FinancialReportData[];
  gmp_price_gain: string;
  risk_meter: RiskMeterData;
  performance: PerformanceData;
  flexibility: FlexibilityData;
  fundamentals: FundamentalsData;
  time: TimeData;
  ipo_details: IpoDetailsData;
  summary_metrics: SummaryMetrics;
}

// IPO record type from database
interface IpoRecord {
  _id: ObjectId;
  ipo_name?: string;
  upcoming_ipo_2025?: string;
  image_url?: string;
  ipo_size?: string;
  price_band?: string;
  ipo_dates?: {
    ipo_open_date?: string;
    ipo_close_date?: string;
    ipo_listing_date?: string;
    basis_of_allotment?: string;
  };
  ipo_details?: {
    opening?: string;
    closing?: string;
    issue_size?: string;
    ipo_price_band?: string;
    retail_quota?: string;
    qib_quota?: string;
    nii_quota?: string;
  };
  ipo_market_lot?: Array<{
    lot_size?: string;
    shares?: string;
  }>;
  gmp_price_gain?: string;
}

interface FinancialReportData {
  period_ended: string;
  revenue: string;
  expense: string;
  profit_after_tax: string;
  assets: string; 
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const {
      ipo_table_id,
      company_name,
      slug,
      image_url,
      investorSplit,
      financialReport,
      gmp_price_gain,
      risk_meter,
      performance,
      flexibility,
      fundamentals,
      time,
      ipo_details,
      summary_metrics
    } = body;

    // Validate required fields
    if (!ipo_table_id || !company_name) {
      return NextResponse.json({
        success: false,
        message: "IPO table ID and company name are required"
      }, { status: 400 });
    }

    // Validate required analysis data
    const requiredFields: Array<keyof Pick<RequestBody, 'risk_meter' | 'performance' | 'flexibility' | 'fundamentals' | 'time'>> = 
      ['risk_meter', 'performance', 'flexibility', 'fundamentals', 'time'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Missing required analysis data: ${missingFields.join(', ')}`
      }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Get IPO record to extract dates and other info
    let ipoRecord: IpoRecord | null = null;
    try {
      // Try as ObjectId first
      ipoRecord = await db.collection("ipos").findOne({ _id: new ObjectId(ipo_table_id) }) as IpoRecord | null;
    } catch {
      // If not a valid ObjectId, try as string
      ipoRecord = await db.collection("ipos").findOne({
        $or: [
          { _id: new ObjectId(ipo_table_id) },
          { slug: ipo_table_id },
          { upcoming_ipo_2025: { $regex: ipo_table_id, $options: "i" } }
        ]
      }) as IpoRecord | null;
    }

    if (!ipoRecord) {
      return NextResponse.json({
        success: false,
        message: "IPO record not found"
      }, { status: 404 });
    }

    // Extract dates from IPO record
    const ipoDates = ipoRecord.ipo_dates || {};
    
    // Build comprehensive analysis document matching IpoComprehensiveAnalysis interface
    const analysisDoc = {
      ipo_table_id: ipoRecord._id.toString(),
      company_name: company_name,
      slug: slug,
      image_url: image_url || ipoRecord.image_url || '',
      gmp_price_gain: gmp_price_gain || ipoRecord.gmp_price_gain || '',
      
      // Fundamentals section - directly use the data from modal
      fundamentals: {
        score: fundamentals?.score || 0,
        summary: fundamentals?.summary || '',
        market_position: fundamentals?.market_position || '',
        business_model: fundamentals?.business_model || '',
        revenue_details: fundamentals?.revenue_details || {
          total_revenue: 0,
          revenue_cagr: 0,
          revenue_trend: ''
        },
        profit_analysis: fundamentals?.profit_analysis || {
          net_profit: 0,
          profit_margin: 0,
          ebitda: null,
          profit_trend: ''
        },
        assets_and_liabilities: fundamentals?.assets_and_liabilities || {
          total_assets: 0,
          total_liabilities: null,
          debt_to_equity_ratio: null
        },
        financial_ratios: fundamentals?.financial_ratios || {
          current_ratio: null,
          quick_ratio: null,
          return_on_equity: null
        }
      },

      investorSplit: investorSplit || [],
      financialReport: financialReport || [],

      // Risk meter section - directly use the data from modal
      risk_meter: {
        score: risk_meter?.score || 0,
        summary: risk_meter?.summary || '',
        key_risks: risk_meter?.key_risks || [],
        risk_categories: risk_meter?.risk_categories || {
          financial_risks: [],
          market_risks: [],
          operational_risks: [],
          regulatory_risks: []
        },
        risk_mitigation: risk_meter?.risk_mitigation || ''
      },

      // Flexibility section - directly use the data from modal
      flexibility: {
        score: flexibility?.score || 0,
        summary: flexibility?.summary || '',
        market_adaptability: flexibility?.market_adaptability || {
          score: 0,
          description: ''
        },
        financial_stability: flexibility?.financial_stability || {
          score: null,
          description: null
        },
        operational_agility: flexibility?.operational_agility || {
          score: 0,
          description: ''
        },
        product_diversification: flexibility?.product_diversification || '',
        pivoting_history: flexibility?.pivoting_history || [],
        future_adaptability_potential: flexibility?.future_adaptability_potential || ''
      },

      // Time section - merge modal data with IPO dates
      time: {
        score: time?.score || 0,
        summary: time?.summary || '',
        issue_dates: {
          opening: time?.issue_dates?.opening || ipoDates.ipo_open_date || '',
          closing: time?.issue_dates?.closing || ipoDates.ipo_close_date || ''
        },
        listing_details: {
          expected_date: time?.listing_details?.expected_date || ipoDates.ipo_listing_date || '',
          exchanges: time?.listing_details?.exchanges || []
        },
        allotment_timeline: {
          date: time?.allotment_timeline?.date || ipoDates.basis_of_allotment || '',
          process: time?.allotment_timeline?.process || ''
        },
        key_milestones: time?.key_milestones || [],
        market_timing_assessment: time?.market_timing_assessment || '',
        time_to_market: time?.time_to_market || {
          score: 0,
          rationale: ''
        }
      },

      // Performance section - directly use the data from modal
      performance: {
        score: performance?.score || 0,
        summary: performance?.summary || '',
        historical_growth: performance?.historical_growth || {
          pattern: '',
          rate: '',
          consistency: ''
        },
        key_achievements: performance?.key_achievements || [],
        management_quality: performance?.management_quality || {
          experience: '',
          track_record: '',
          score: 0
        },
        market_comparison: performance?.market_comparison || '',
        future_potential: performance?.future_potential || {
          growth_forecast: '',
          upcoming_projects: []
        },
        consistency_analysis: performance?.consistency_analysis || {
          operational_years: 0,
          revenue_stability: '',
          rationale: ''
        }
      },

      // IPO details section - use provided ipo_details data
      ipo_details: {
        issue_size: ipo_details?.issue_size || ipoRecord.ipo_details?.issue_size || ipoRecord.ipo_size || '',
        price_band: ipo_details?.price_band || ipoRecord.ipo_details?.ipo_price_band || ipoRecord.price_band || '',
        lot_size: ipo_details?.lot_size || (ipoRecord.ipo_market_lot?.[0]?.lot_size ? parseInt(ipoRecord.ipo_market_lot[0].lot_size) : 0),
        shares: ipo_details?.shares || (ipoRecord.ipo_market_lot?.[0]?.shares ? parseInt(ipoRecord.ipo_market_lot[0].shares) : 0),
        allocation_details: ipo_details?.allocation_details || {
          retail: ipoRecord.ipo_details?.retail_quota ? parseFloat(ipoRecord.ipo_details.retail_quota) : 35,
          qib: ipoRecord.ipo_details?.qib_quota ? parseFloat(ipoRecord.ipo_details.qib_quota) : 50,
          nii: ipoRecord.ipo_details?.nii_quota ? parseFloat(ipoRecord.ipo_details.nii_quota) : 15
        },
        approximate_gains_potential: ipo_details?.approximate_gains_potential || 0,
        gains_rationale: ipo_details?.gains_rationale || '',
        profitability_of_allotment: ipo_details?.profitability_of_allotment || {
          score: 0,
          assessment: ''
        }
      },

      // Summary metrics - use provided data or calculate from sections
      summary_metrics: summary_metrics || {
        fundamentals_score: fundamentals?.score || 0,
        risk_meter: risk_meter?.score || 0,
        flexibility_score: flexibility?.score || 0,
        time_score: time?.score || 0,
        performance_score: performance?.score || 0,
        approximate_gains_potential: ipo_details?.approximate_gains_potential || 0,
        profitability_of_allotment: ipo_details?.profitability_of_allotment?.score || 0,
        total_revenue: fundamentals?.revenue_details?.total_revenue || 0,
        net_profit: fundamentals?.profit_analysis?.net_profit || 0,
        total_assets: fundamentals?.assets_and_liabilities?.total_assets || 0
      },

      created_at: new Date(),
      updated_at: new Date()
    };

    // Check if document with same ipo_table_id already exists
    const existingDoc = await db.collection("ipo_comprehensive_analysis")
      .findOne({ ipo_table_id: analysisDoc.ipo_table_id });

    let result;
    if (existingDoc) {
      // Update existing document
      const updateDoc = { ...analysisDoc };
      updateDoc.updated_at = new Date();
      // Preserve created_at from existing document
      updateDoc.created_at = existingDoc.created_at;

      result = await db.collection("ipo_comprehensive_analysis")
        .updateOne(
          { ipo_table_id: analysisDoc.ipo_table_id },
          { $set: updateDoc }
        );

      return NextResponse.json({
        success: true,
        message: "Analysis updated successfully",
        data: {
          _id: existingDoc._id,
          modified_count: result.modifiedCount,
          company_name: analysisDoc.company_name,
          scores: analysisDoc.summary_metrics
        }
      });
    } else {
      // Insert new document
      result = await db.collection("ipo_comprehensive_analysis")
        .insertOne(analysisDoc);

      return NextResponse.json({
        success: true,
        message: "Analysis created successfully",
        data: {
          _id: result.insertedId,
          company_name: analysisDoc.company_name,
          scores: analysisDoc.summary_metrics
        }
      });
    }

  } catch (error) {
    console.error("Error in comprehensive analysis API:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error"
    }, { status: 500 });
  }
}

// GET method to retrieve existing analysis
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ipoTableId = searchParams.get('ipo_table_id');

    if (!ipoTableId) {
      return NextResponse.json({
        success: false,
        message: "IPO table ID is required"
      }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Try to find by ipo_table_id first
    let analysis = await db.collection("ipo_comprehensive_analysis")
      .findOne({ ipo_table_id: ipoTableId });

    // If not found and ipoTableId looks like ObjectId, try converting
    if (!analysis && ObjectId.isValid(ipoTableId)) {
      analysis = await db.collection("ipo_comprehensive_analysis")
        .findOne({ ipo_table_id: ipoTableId });
    }

    if (!analysis) {
      return NextResponse.json({
        success: false,
        message: "Analysis not found"
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error("Error retrieving analysis:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error"
    }, { status: 500 });
  }
}

// DELETE method to remove analysis
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ipoTableId = searchParams.get('ipo_table_id');

    if (!ipoTableId) {
      return NextResponse.json({
        success: false,
        message: "IPO table ID is required"
      }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const result = await db.collection("ipo_comprehensive_analysis")
      .deleteOne({ ipo_table_id: ipoTableId });

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        message: "Analysis not found"
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Analysis deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting analysis:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error"
    }, { status: 500 });
  }
}