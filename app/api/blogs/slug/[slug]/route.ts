import { getDb } from "@/lib/mongo";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const db = await getDb();
    const blogs = await db.collection("blogs").find({}).toArray();
    return NextResponse.json({
      message: "Data retrieved successfully",
      success: true,
      blog: blogs.find((blog) => blog.slug === slug),
    });
  } catch (error) {
    console.error("Error in /api/blogs/slug:", error);
    return NextResponse.json({
      message: error instanceof Error ? error.message : "Something went wrong",
      success: false,
    }, { status: 500 });
  }
}
