import { getDb } from "@/lib/mongo";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const db = await getDb();
        const analysis = await db.collection("ipo_comprehensive_analysis").find({}).toArray();

        return NextResponse.json({
            message: "Data retrieved successfully",
            success: true,
            analysis: analysis.slice(0, 3),
        });
    }
    catch (error) {
        console.error("Error in /api/analysis/latest-analysis:", error);
        return NextResponse.json({
            message: error instanceof Error ? error.message : "Something went wrong",
            success: false,
        }, { status: 500 });
    }
}
