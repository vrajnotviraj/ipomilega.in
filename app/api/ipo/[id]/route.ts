import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db/mongo";
import { PUBLIC_IPO_PROJECTION, publicIssue } from "@/lib/queries/ipos";

/** One IPO document by its ObjectId, with only the public fields (no sources, raw captures or scrape times but the GMP's). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid IPO id", success: false }, { status: 400 });
    }

    const db = await getDb();
    const ipo = await db.collection("ipos").findOne({ _id: new ObjectId(id) }, { projection: PUBLIC_IPO_PROJECTION });
    if (ipo) ipo.issue = publicIssue(ipo.issue);
    if (!ipo) {
      return NextResponse.json({ message: "IPO not found", success: false }, { status: 404 });
    }

    return NextResponse.json({ message: "Data retrieved successfully", success: true, ipos: ipo });
  } catch (error) {
    console.error("Error in /api/ipo/[id]:", error);
    return NextResponse.json({ message: "Something went wrong", success: false }, { status: 500 });
  }
}
