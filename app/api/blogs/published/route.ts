import { NextResponse } from "next/server";
import { getPublishedBlogs, getBlogCategories } from "@/lib/queries/blogs";

export const revalidate = 600;

export async function GET() {
    try {
        // These were five sequential round-trips to Atlas; the category reads in particular
        // were four separate find() calls that differed only by a literal.
        const [blogs, categories] = await Promise.all([getPublishedBlogs(), getBlogCategories()]);

        return NextResponse.json({
            message: "Data retrieved successfully",
            success: true,
            blogs,
            ...categories,
        });
    }
    catch (error) {
        console.error("Error in /api/blogs/published:", error);
        return NextResponse.json({
            message: error instanceof Error ? error.message : "Something went wrong",
            success: false,
        }, { status: 500 });
    }
}
