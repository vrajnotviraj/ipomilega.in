import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const db = await getDb();
        const ipos = await db.collection("ipos").find({}).toArray();

        return NextResponse.json({
            message: "Data retrieved successfully",
            success: true,
            ipos: ipos.find((ipo) => ipo._id.toString() === id),
        });
    }
    catch (error) {
        console.error("Error in /api/ipo/[id]:", error);
        return NextResponse.json({
            message: error instanceof Error ? error.message : "Something went wrong",
            success: false,
        }, { status: 500 });
    }
}
