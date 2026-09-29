import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongo";
import { cached } from "@/lib/cache";

// Feeds the /analysis list. The read goes through the shared server cache, which every
// analysis write purges, so a new analysis still shows up the moment it lands.
export const dynamic = "force-dynamic";

// The /analysis table renders these fields and nothing else. Returning the whole document
// (~10KB each: every section's prose, tables, financials) made the list slow to fill in.
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
    const {db} = await connectToDatabase();
    const ipos = await db
        .collection("ipo_comprehensive_analysis")
        .find({}, { projection: LIST_PROJECTION })
        .toArray();
    return JSON.parse(JSON.stringify(ipos));
}, "analysis-list");

export async function GET() {
    try {
        const ipoList = await readAnalysisList();

        return NextResponse.json({
            message: "Data retrieved successfully",
            success: true,
            ipos_analysis: ipoList
        }, { headers: { "Cache-Control": "no-store" } });
    }
    catch (error) {
        console.error("Error in /api/admin:", error);
        return NextResponse.json({
            message: error instanceof Error ? error.message : "Something went wrong",
            success: false,
        }, { status: 500 });
    }
}
