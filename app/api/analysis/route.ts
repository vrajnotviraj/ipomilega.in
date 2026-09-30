import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import { cached } from "@/lib/cache";

// Feeds the /analysis list. The server cache is purged on every analysis write.
export const dynamic = "force-dynamic";

// Only the fields the /analysis table renders; a full document is ~10KB.
const LIST_PROJECTION = {
    company_name: 1,
    slug: 1,
    image_url: 1,
    gmp_price_gain: 1,
    "ipo_details.issue_size": 1,
    "ipo_details.price_band": 1,
    "time.issue_dates": 1,
    "summary_metrics.risk_meter": 1,
} as const;

const readAnalysisList = cached(async () => {
    const db = await getDb();
    const ipos = await db
        .collection("ipo_comprehensive_analysis")
        .find({}, { projection: LIST_PROJECTION })
        .toArray();
    return JSON.parse(JSON.stringify(ipos));
}, "analysis-list");

export async function GET() {
    try {
        return NextResponse.json({
            message: "Data retrieved successfully",
            success: true,
            ipos_analysis: await readAnalysisList(),
        }, { headers: { "Cache-Control": "no-store" } });
    }
    catch (error) {
        console.error("Error in /api/analysis:", error);
        return NextResponse.json({
            message: "Something went wrong",
            success: false,
        }, { status: 500 });
    }
}
