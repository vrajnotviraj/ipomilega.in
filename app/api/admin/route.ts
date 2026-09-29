import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export async function GET() {
    try {
        const db = await getDb();
        const ipos = await db.collection("ipos").find({}).toArray();
        const blogs = await db.collection("blogs").find({}).toArray();
        const ipoIds = new Set(ipos.map((ipo) => ipo._id.toString()));

        return NextResponse.json({
            message: "Data retrieved successfully",
            success: true,
            ipos,
            blog: blogs.filter((blog) => ipoIds.has(blog.ipo_id)),
        });
    } catch (error) {
        console.error("Error in /api/admin:", error);
        return NextResponse.json({
            message: error instanceof Error ? error.message : "Something went wrong",
            success: false,
        }, { status: 500 });
    }
}
