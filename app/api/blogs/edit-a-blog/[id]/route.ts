import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongo";
import { revalidateSite } from "@/lib/revalidate";
import { ObjectId } from "mongodb";


export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id
        const { db } = await connectToDatabase();
        const blogs = await db.collection("blogs").find({}).toArray();
        const blogList = blogs || []
        const blog = blogList.find((blog) => blog._id.toString() === id);
        return NextResponse.json({
            message: "Data retrieved successfully",
            success: true,
            blog: blog
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

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id
        const { db } = await connectToDatabase();
        const blogs = await db.collection("blogs").find({}).toArray();
        const blogList = blogs || []
        const blog = blogList.find((blog) => blog._id.toString() === id);
        if (!blog) {
            return NextResponse.json({
                message: "Blog not found",
                success: false,
            }, { status: 404 });
        }
        await db.collection("blogs").deleteOne({ _id: new ObjectId(id) });
        revalidateSite();
        return NextResponse.json({
            message: "Blog deleted successfully",
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

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id
        const body = await request.json();
        const { db } = await connectToDatabase();
        const blogs = await db.collection("blogs").find({}).toArray();
        const blogList = blogs || []
        const blog = blogList.find((blog) => blog._id.toString() === id);
        if (!blog) {
            return NextResponse.json({
                message: "Blog not found",
                success: false,
            }, { status: 404 });
        }
        await db.collection("blogs").updateOne({ _id: new ObjectId(id) }, { $set: { ...body } });
        revalidateSite();
        return NextResponse.json({
            message: "Blog updated successfully",
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
