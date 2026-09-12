import { NextResponse } from "next/server";
import { getAnalysisBySlug } from "@/lib/queries/ipos";

export const revalidate = 300;

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // Was: load every IPO document, Array.find the slug, then query the analysis.
        // Now a single indexed findOne on ipos.slug followed by one on ipo_table_id.
        const result = await getAnalysisBySlug(id);

        if (!result) {
            return NextResponse.json({
                message: "Data not found",
                success: false,
            }, { status: 404 });
        }

        return NextResponse.json({
            message: "Data retrieved successfully",
            success: true,
            ipos_analysis: result.ipos_analysis,
            ipo: result.ipo,
        });
    }
    catch (error) {
        console.error("Error in /api/analysis/[id]:", error);
        return NextResponse.json({
            message: error instanceof Error ? error.message : "Something went wrong",
            success: false,
        }, { status: 500 });
    }
}
