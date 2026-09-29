import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import { requireAdmin } from "@/lib/auth";
import { revalidateSite } from "@/lib/revalidate";
import { ObjectId } from "mongodb";

type Params = { params: Promise<{ id: string }> };

const serverError = (error: unknown) => {
    console.error("Error in /api/blogs/edit-a-blog:", error);
    return NextResponse.json({
        message: error instanceof Error ? error.message : "Something went wrong",
        success: false,
    }, { status: 500 });
};

const notFound = () => NextResponse.json({ message: "Blog not found", success: false }, { status: 404 });

/** Finds a blog by comparing each stored _id as a string, so an invalid id yields undefined instead of throwing. */
const findBlog = async (id: string) => {
    const db = await getDb();
    const blogs = await db.collection("blogs").find({}).toArray();
    return { db, blog: blogs.find((blog) => blog._id.toString() === id) };
};

export async function GET(_request: Request, { params }: Params) {
    try {
        const { blog } = await findBlog((await params).id);
        return NextResponse.json({ message: "Data retrieved successfully", success: true, blog });
    } catch (error) {
        return serverError(error);
    }
}

export async function DELETE(request: Request, { params }: Params) {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    try {
        const id = (await params).id;
        const { db, blog } = await findBlog(id);
        if (!blog) return notFound();

        await db.collection("blogs").deleteOne({ _id: new ObjectId(id) });
        revalidateSite();
        return NextResponse.json({ message: "Blog deleted successfully", success: true });
    } catch (error) {
        return serverError(error);
    }
}

export async function PUT(request: Request, { params }: Params) {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    try {
        const id = (await params).id;
        const body = await request.json();
        const { db, blog } = await findBlog(id);
        if (!blog) return notFound();

        await db.collection("blogs").updateOne({ _id: new ObjectId(id) }, { $set: { ...body } });
        revalidateSite();
        return NextResponse.json({ message: "Blog updated successfully", success: true });
    } catch (error) {
        return serverError(error);
    }
}
