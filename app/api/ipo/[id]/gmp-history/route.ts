import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo";

// The GMP series for an analysis page's trend chart: one point per IST day, carrying that day's latest figure.
// Snapshots are captured hourly, so a five-minute cache costs nothing in freshness.
export const revalidate = 300;

// Guard against a runaway query; no issue produces this many readings.
const MAX_ROWS = 500;
const DEFAULT_DAYS = 45;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

interface GmpSnapshot {
  observed_at: Date;
  /** The source site's own "Last Updated" stamp, which a delayed capture would otherwise misplace. */
  captured_at?: Date;
  /** Last time this figure was seen unchanged. */
  last_seen_at?: Date;
  gmp: number;
  est_listing_price?: number | null;
  est_listing_percent?: number | null;
}

const istDay = (ms: number) => Math.floor((ms + IST_OFFSET_MS) / DAY_MS);
const istDayStart = (day: number) => day * DAY_MS - IST_OFFSET_MS;

/** Oldest-first snapshots in, one point per IST day out. */
function buildDailySeries(rows: GmpSnapshot[]) {
  // A snapshot counts on its own day and on each later day it was still quoted, up to the next snapshot.
  const readings: { day: number; ms: number; row: GmpSnapshot }[] = [];

  rows.forEach((row, i) => {
    const start = (row.captured_at ?? row.observed_at).getTime();
    readings.push({ day: istDay(start), ms: start, row });

    const next = rows[i + 1];
    const seen = (row.last_seen_at ?? row.observed_at).getTime();
    const end = next ? Math.min(seen, next.observed_at.getTime()) : seen;
    // The last covered day was confirmed at `end`; days in between only held, so they sit at the day's start.
    for (let day = istDay(start) + 1; day <= istDay(end); day += 1) {
      readings.push({ day, ms: day === istDay(end) ? end : istDayStart(day), row });
    }
    // The newest snapshot's latest confirmation, so today's "as of" is current.
    if (!next && istDay(seen) === istDay(start) && seen > start) {
      readings.push({ day: istDay(seen), ms: seen, row });
    }
  });

  readings.sort((a, b) => a.ms - b.ms);

  // Later readings overwrite earlier ones, so each day keeps its last.
  const closeByDay = new Map(readings.map((r) => [r.day, r]));

  const today = istDay(Date.now());
  return [...closeByDay.values()]
    .sort((a, b) => a.day - b.day)
    .map(({ day, ms, row }) => ({
      // Noon IST, so each date sits centred on its tick.
      t: new Date(istDayStart(day) + DAY_MS / 2).toISOString(),
      date: new Date(day * DAY_MS).toISOString().slice(0, 10),
      gmp: row.gmp,
      est_listing_price: row.est_listing_price ?? null,
      est_listing_percent: row.est_listing_percent ?? null,
      as_of: new Date(ms).toISOString(),
      live: day === today,
    }));
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
    const since = new Date(Date.now() - days * DAY_MS);

    const db = await getDb();
    const rows = (await db
      .collection("gmp_snapshots")
      .find({ ipo_id: new ObjectId(id), observed_at: { $gte: since } })
      // Newest first matches the index; reversed below into oldest-first.
      .sort({ observed_at: -1 })
      .limit(MAX_ROWS)
      .toArray()) as unknown as GmpSnapshot[];

    const series = buildDailySeries(rows.reverse());

    return NextResponse.json({
      message: "Data retrieved successfully",
      success: true,
      days,
      series,
      latest: series.at(-1) ?? null,
    });
  } catch (error) {
    console.error("Error in /api/ipo/[id]/gmp-history:", error);
    return NextResponse.json(
      {
        message: "Something went wrong",
        success: false,
      },
      { status: 500 }
    );
  }
}
