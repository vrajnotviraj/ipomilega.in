import { NextResponse } from "next/server";
import { getFeaturedBlogs } from "@/lib/queries/blogs";

export const revalidate = 600;

export async function GET() {
    try {
        const blogList = await getFeaturedBlogs();
        return NextResponse.json({
            message: "Data retrieved successfully",
            success: true,
            blogList,
        });
    }
    catch (error) {
        console.error("Error in /api/blogs/featured:", error);
        return NextResponse.json({
            message: error instanceof Error ? error.message : "Something went wrong",
            success: false,
        }, { status: 500 });
    }
}
