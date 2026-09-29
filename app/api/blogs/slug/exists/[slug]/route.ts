import { getDb } from "@/lib/mongo";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const slug = (await params).slug;
        const db = await getDb();
        const blogs = await db.collection("blogs").find({}).toArray();

        const exists = blogs.some((blog) => blog.slug === slug);
        return NextResponse.json({ message: exists ? "Blog exists" : "Blog does not exist", exists });
    } catch (error) {
        console.error("Error in /api/blogs/slug/exists:", error);
        return NextResponse.json({
            message: error instanceof Error ? error.message : "Something went wrong",
            exists: false,
        }, { status: 500 });
    }
}
