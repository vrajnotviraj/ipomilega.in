import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongo";
import { revalidateSite } from "@/lib/revalidate";
import { ObjectId } from "mongodb";

interface BlogPost {
    _id: string
    title: string
    slug: string
    content: string
    excerpt: string
    tags: string[]
    category: string
    status: string
    meta_description: string
    image_url?: string
    author: string
    ipo_id: string
    created_at: string
    updated_at: string
}

export async function GET() {
    try {

        const {db} = await connectToDatabase();
        const ipos = await db.collection("blogs").find({ sort: { created_at: -1 }}).toArray();
        const ipo_analysis = await db.collection("categories").find({category: "IPO Analysis",status: "published"}).toArray();
        const company_review = await db.collection("categories").find({category: "Company Review",status: "published"}).toArray();
        const market_news = await db.collection("categories").find({category: "Market News",status: "published"}).toArray();
        const investment_guide = await db.collection("categories").find({category: "Investment Guide",status: "published"}).toArray();

        const ipoList = ipos || [];

        return NextResponse.json({
            message: "Data retrieved successfully",
            success: true,
            ipos: ipoList,
            ipo_analysis: ipo_analysis,
            company_review: company_review,
            market_news: market_news,
            investment_guide: investment_guide
        });
    }
    catch (error) {
        console.error("Error in /api/admin:", error);
        return NextResponse.json({
            message: error instanceof Error ? error.message : "Something went wrong",
            success: false,
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { db } = await connectToDatabase();

        const body: BlogPost = await request.json();
        body.created_at = new Date().toISOString();
        body.updated_at = new Date().toISOString();
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
            created_at: body.created_at,
            updated_at: body.updated_at
        });

        const slug = body.slug;
        await db.collection("blogs").updateOne(
            { _id: new ObjectId(body.ipo_id) },
            { $set: { slug: slug } }
        );
        revalidateSite();

        return NextResponse.json({
            message: "Data retrieved successfully",
            success: true,
        });
    }
    catch (error) {
        console.error("Error in /api/admin:", error);
        return NextResponse.json({
            message: error instanceof Error ? error.message : "Something went wrong",
            success: false,
        }, { status: 500 });
    }
}