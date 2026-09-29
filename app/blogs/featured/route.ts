import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export async function GET() {
  try {
    const db = await getDb();
    const blogs = await db.collection("blogs").find({}).toArray();
    return NextResponse.json({
      message: "Data retrieved successfully",
      success: true,
      blogs: blogs.slice(0, 3),
    });
  } catch (error) {
    console.error("Error in /blogs/featured:", error);
    return NextResponse.json({
      message: error instanceof Error ? error.message : "Something went wrong",
      success: false,
    }, { status: 500 });
  }
}
