import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo";
import { revalidateSite } from "@/lib/revalidate";
import { IpoComprehensiveAnalysis } from "@/types/ipo-comprehensive-analysis";

type RequestBody = Omit<IpoComprehensiveAnalysis, "_id" | "created_at" | "updated_at">;

interface IpoRecord {
  _id: ObjectId;
  image_url?: string;
  ipo_size?: string;
  price_band?: string;
  gmp_price_gain?: string;
  ipo_dates?: {
    ipo_open_date?: string;
    ipo_close_date?: string;
    ipo_listing_date?: string;
    basis_of_allotment?: string;
  };
  ipo_details?: {
    issue_size?: string;
    ipo_price_band?: string;
    retail_quota?: string;
    qib_quota?: string;
    nii_quota?: string;
  };
  ipo_market_lot?: Array<{ lot_size?: string; shares?: string }>;
}

const REQUIRED_SECTIONS = ["risk_meter", "performance", "flexibility", "fundamentals", "time"] as const;

const serverError = (error: unknown) => NextResponse.json({
  success: false,
  message: error instanceof Error ? error.message : "Internal server error"
}, { status: 500 });

const missingIdResponse = () => NextResponse.json({ success: false, message: "IPO table ID is required" }, { status: 400 });

/** The analysis document to store: the modal's sections, with blanks filled from the IPO record or defaults. */
function buildAnalysisDoc(body: RequestBody, ipoRecord: IpoRecord) {
  const {
    company_name, slug, image_url, investorSplit, financialReport, gmp_price_gain,
    risk_meter, performance, flexibility, fundamentals, time, ipo_details, summary_metrics
  } = body;
  const ipoDates = ipoRecord.ipo_dates || {};
  const firstLot = ipoRecord.ipo_market_lot?.[0];
  const quota = (value: string | undefined, fallback: number) => value ? parseFloat(value) : fallback;

  return {
    ipo_table_id: ipoRecord._id.toString(),
    company_name,
    slug,
    image_url: image_url || ipoRecord.image_url || '',
    gmp_price_gain: gmp_price_gain || ipoRecord.gmp_price_gain || '',

    fundamentals: {
      score: fundamentals.score || 0,
      summary: fundamentals.summary || '',
      market_position: fundamentals.market_position || '',
      business_model: fundamentals.business_model || '',
      revenue_details: fundamentals.revenue_details || { total_revenue: 0, revenue_cagr: 0, revenue_trend: '' },
      profit_analysis: fundamentals.profit_analysis || { net_profit: 0, profit_margin: 0, ebitda: null, profit_trend: '' },
      assets_and_liabilities: fundamentals.assets_and_liabilities || { total_assets: 0, total_liabilities: null, debt_to_equity_ratio: null },
      financial_ratios: fundamentals.financial_ratios || { current_ratio: null, quick_ratio: null, return_on_equity: null },
      // Omitted rather than blanked on analyses generated without them.
      ...(fundamentals.debt && { debt: fundamentals.debt }),
      ...(fundamentals.offer_structure && { offer_structure: fundamentals.offer_structure }),
    },

    investorSplit: investorSplit || [],
    financialReport: financialReport || [],

    risk_meter: {
      score: risk_meter.score || 0,
      summary: risk_meter.summary || '',
      key_risks: risk_meter.key_risks || [],
      risk_categories: risk_meter.risk_categories || { financial_risks: [], market_risks: [], operational_risks: [], regulatory_risks: [] },
      risk_mitigation: risk_meter.risk_mitigation || ''
    },

    flexibility: {
      score: flexibility.score || 0,
      summary: flexibility.summary || '',
      market_adaptability: flexibility.market_adaptability || { score: 0, description: '' },
      financial_stability: flexibility.financial_stability || { score: null, description: null },
      operational_agility: flexibility.operational_agility || { score: 0, description: '' },
      product_diversification: flexibility.product_diversification || '',
      pivoting_history: flexibility.pivoting_history || [],
      future_adaptability_potential: flexibility.future_adaptability_potential || ''
    },

    time: {
      score: time.score || 0,
      summary: time.summary || '',
      issue_dates: {
        opening: time.issue_dates?.opening || ipoDates.ipo_open_date || '',
        closing: time.issue_dates?.closing || ipoDates.ipo_close_date || ''
      },
      listing_details: {
        expected_date: time.listing_details?.expected_date || ipoDates.ipo_listing_date || '',
        exchanges: time.listing_details?.exchanges || []
      },
      allotment_timeline: {
        date: time.allotment_timeline?.date || ipoDates.basis_of_allotment || '',
        process: time.allotment_timeline?.process || ''
      },
      key_milestones: time.key_milestones || [],
      market_timing_assessment: time.market_timing_assessment || '',
      time_to_market: time.time_to_market || { score: 0, rationale: '' }
    },

    performance: {
      score: performance.score || 0,
      summary: performance.summary || '',
      historical_growth: performance.historical_growth || { pattern: '', rate: '', consistency: '' },
      key_achievements: performance.key_achievements || [],
      management_quality: performance.management_quality || { experience: '', track_record: '', score: 0 },
      market_comparison: performance.market_comparison || '',
      future_potential: performance.future_potential || { growth_forecast: '', upcoming_projects: [] },
      consistency_analysis: performance.consistency_analysis || { operational_years: 0, revenue_stability: '', rationale: '' }
    },

    ipo_details: {
      issue_size: ipo_details?.issue_size || ipoRecord.ipo_details?.issue_size || ipoRecord.ipo_size || '',
      price_band: ipo_details?.price_band || ipoRecord.ipo_details?.ipo_price_band || ipoRecord.price_band || '',
      lot_size: ipo_details?.lot_size || (firstLot?.lot_size ? parseInt(firstLot.lot_size) : 0),
      shares: ipo_details?.shares || (firstLot?.shares ? parseInt(firstLot.shares) : 0),
      allocation_details: ipo_details?.allocation_details || {
        retail: quota(ipoRecord.ipo_details?.retail_quota, 35),
        qib: quota(ipoRecord.ipo_details?.qib_quota, 50),
        nii: quota(ipoRecord.ipo_details?.nii_quota, 15)
      },
      approximate_gains_potential: ipo_details?.approximate_gains_potential || 0,
      gains_rationale: ipo_details?.gains_rationale || '',
      profitability_of_allotment: ipo_details?.profitability_of_allotment || { score: 0, assessment: '' }
    },

    summary_metrics: summary_metrics || {
      fundamentals_score: fundamentals.score || 0,
      risk_meter: risk_meter.score || 0,
      flexibility_score: flexibility.score || 0,
      time_score: time.score || 0,
      performance_score: performance.score || 0,
      approximate_gains_potential: ipo_details?.approximate_gains_potential || 0,
      profitability_of_allotment: ipo_details?.profitability_of_allotment?.score || 0,
      total_revenue: fundamentals.revenue_details?.total_revenue || 0,
      net_profit: fundamentals.profit_analysis?.net_profit || 0,
      total_assets: fundamentals.assets_and_liabilities?.total_assets || 0
    },

    created_at: new Date(),
    updated_at: new Date()
  };
}

/** Creates or replaces the analysis for one IPO. */
export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();

    if (!body.ipo_table_id || !body.company_name) {
      return NextResponse.json({ success: false, message: "IPO table ID and company name are required" }, { status: 400 });
    }

    const missingSections = REQUIRED_SECTIONS.filter(section => !body[section]);
    if (missingSections.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Missing required analysis data: ${missingSections.join(', ')}`
      }, { status: 400 });
    }

    const db = await getDb();
    // Throws on an id that is not an ObjectId; the catch answers 500 with that message.
    const ipoRecord = await db.collection<IpoRecord>("ipos").findOne({ _id: new ObjectId(body.ipo_table_id) });
    if (!ipoRecord) {
      return NextResponse.json({ success: false, message: "IPO record not found" }, { status: 404 });
    }

    const analysisDoc = buildAnalysisDoc(body, ipoRecord);
    const analyses = db.collection("ipo_comprehensive_analysis");
    const existingDoc = await analyses.findOne({ ipo_table_id: analysisDoc.ipo_table_id });

    if (existingDoc) {
      const result = await analyses.updateOne(
        { ipo_table_id: analysisDoc.ipo_table_id },
        { $set: { ...analysisDoc, created_at: existingDoc.created_at } }
      );
      revalidateSite();
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
    }

    const result = await analyses.insertOne(analysisDoc);
    revalidateSite();
    return NextResponse.json({
      success: true,
      message: "Analysis created successfully",
      data: {
        _id: result.insertedId,
        company_name: analysisDoc.company_name,
        scores: analysisDoc.summary_metrics
      }
    });
  } catch (error) {
    console.error("Error in comprehensive analysis API:", error);
    return serverError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const ipoTableId = req.nextUrl.searchParams.get('ipo_table_id');
    if (!ipoTableId) return missingIdResponse();

    const db = await getDb();
    const analysis = await db.collection("ipo_comprehensive_analysis").findOne({ ipo_table_id: ipoTableId });
    if (!analysis) {
      return NextResponse.json({ success: false, message: "Analysis not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    console.error("Error retrieving analysis:", error);
    return serverError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ipoTableId = req.nextUrl.searchParams.get('ipo_table_id');
    if (!ipoTableId) return missingIdResponse();

    const db = await getDb();
    const result = await db.collection("ipo_comprehensive_analysis").deleteOne({ ipo_table_id: ipoTableId });
    revalidateSite();

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "Analysis not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Analysis deleted successfully" });
  } catch (error) {
    console.error("Error deleting analysis:", error);
    return serverError(error);
  }
}
