import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db/mongo";

/** One full IPO document by its ObjectId. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid IPO id", success: false }, { status: 400 });
    }

    const db = await getDb();
    const ipo = await db.collection("ipos").findOne({ _id: new ObjectId(id) });
    if (!ipo) {
      return NextResponse.json({ message: "IPO not found", success: false }, { status: 404 });
    }

    return NextResponse.json({ message: "Data retrieved successfully", success: true, ipos: ipo });
  } catch (error) {
    console.error("Error in /api/ipo/[id]:", error);
    return NextResponse.json({ message: "Something went wrong", success: false }, { status: 500 });
  }
}
