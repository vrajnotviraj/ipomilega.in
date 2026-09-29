import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import { requireAdmin } from "@/lib/auth";
import { revalidateSite } from "@/lib/revalidate";
import { ObjectId } from "mongodb";
import { Blog } from "@/types/ipo";

const serverError = (error: unknown) => {
    console.error("Error in /api/blogs:", error);
    return NextResponse.json({
        message: error instanceof Error ? error.message : "Something went wrong",
        success: false,
    }, { status: 500 });
};

export async function GET() {
    try {
        const db = await getDb();
        const publishedIn = (category: string) => db.collection("categories").find({ category, status: "published" }).toArray();

        const ipos = await db.collection("blogs").find({ sort: { created_at: -1 } }).toArray();
        const ipo_analysis = await publishedIn("IPO Analysis");
        const company_review = await publishedIn("Company Review");
        const market_news = await publishedIn("Market News");
        const investment_guide = await publishedIn("Investment Guide");

        return NextResponse.json({
            message: "Data retrieved successfully",
            success: true,
            ipos,
            ipo_analysis,
            company_review,
            market_news,
            investment_guide,
        });
    } catch (error) {
        return serverError(error);
    }
}

export async function POST(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    try {
        const db = await getDb();
        const body: Blog = await request.json();
        const now = new Date().toISOString();

        await db.collection("blogs").insertOne({
            _id: new ObjectId(body._id),
            title: body.title,
            slug: body.slug,
            content: body.content,
            excerpt: body.excerpt,
            tags: body.tags,
            category: body.category,
            status: body.status,
            meta_description: body.meta_description,
            image_url: body.image_url,
            author: body.author,
            ipo_id: body.ipo_id,
            created_at: now,
            updated_at: now,
        });
        await db.collection("blogs").updateOne({ _id: new ObjectId(body.ipo_id) }, { $set: { slug: body.slug } });
        revalidateSite();

        return NextResponse.json({ message: "Data retrieved successfully", success: true });
    } catch (error) {
        return serverError(error);
    }
}
