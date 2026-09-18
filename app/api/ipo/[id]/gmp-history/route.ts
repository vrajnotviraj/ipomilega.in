import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongo";

/**
 * The GMP series behind the trend chart on an analysis page.
 *
 * Rows come from `gmp_snapshots`, written by the ipo-subscription-live capture
 * service. That collection is append-only and deduplicated on the figures, so
 * every row here is a reading that actually moved -- there are no filler points
 * and the gaps between them are real.
 *
 * Revalidated rather than no-store: capture runs hourly, so a five-minute cache
 * costs nothing in freshness and keeps a popular analysis page off the database.
 */
export const revalidate = 300;

// Hard ceiling on rows returned. GMP only exists between a filing and its
// listing, so a couple of hundred readings is already more than any issue will
// ever produce; this is a guard against a runaway query, not a page size.
const MAX_POINTS = 500;
const DEFAULT_DAYS = 45;

interface GmpSnapshotDoc {
  observed_at: Date;
  captured_at?: Date;
  gmp: number;
  est_listing_price?: number | null;
  est_listing_percent?: number | null;
  trend?: string;
  price_band?: string;
  status?: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid IPO id", success: false }, { status: 400 });
    }

    const daysParam = Number(new URL(request.url).searchParams.get("days"));
    const days = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, 365) : DEFAULT_DAYS;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const { db } = await connectToDatabase();
    const rows = (await db
      .collection("gmp_snapshots")
      .find({ ipo_id: new ObjectId(id), observed_at: { $gte: since } })
      // Newest first matches the index; the series is reversed below so the
      // chart receives it oldest-first without Mongo having to sort backwards.
      .sort({ observed_at: -1 })
      .limit(MAX_POINTS)
      .toArray()) as unknown as GmpSnapshotDoc[];

    const series = rows
      .map((row) => ({
        // captured_at is ipowatch's own "Last Updated" stamp and is what the
        // x-axis plots: a capture delayed by a sleeping instance would
        // otherwise place an hours-old quote at the time we fetched it.
        t: (row.captured_at ?? row.observed_at).toISOString(),
        gmp: row.gmp,
        est_listing_price: row.est_listing_price ?? null,
        est_listing_percent: row.est_listing_percent ?? null,
        trend: row.trend ?? "",
      }))
      .reverse();

    return NextResponse.json({
      message: "Data retrieved successfully",
      success: true,
      days,
      series,
      // The series is deduplicated, so the last point can be hours old while
      // still being current. The chart says "as of" rather than "now".
      latest: series.length > 0 ? series[series.length - 1] : null,
    });
  } catch (error) {
    console.error("Error in /api/ipo/[id]/gmp-history:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Something went wrong",
        success: false,
      },
      { status: 500 }
    );
  }
}
