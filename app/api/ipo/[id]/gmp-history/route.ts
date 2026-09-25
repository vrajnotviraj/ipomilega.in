import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongo";

/**
 * The GMP series behind the trend chart on an analysis page: ONE point per IST
 * day, carrying that day's closing figure and the intraday path it took.
 *
 * Rows come from `gmp_snapshots`, written hourly by the ipo-subscription-live
 * capture service. A row is stored when the figures move, plus the first
 * reading of each IST day. Older rows predate the daily rule, so a flat stretch
 * is also filled in here from `last_seen_at`: a row whose `last_seen_at` runs
 * into later days was confirmed on each of them.
 *
 * Per day:
 *   - gmp:  the day's last reading -- what the chart plots,
 *   - path: the readings in order with repeats collapsed, e.g. [14, 15, 14]
 *           when the quote went 14 -> 15 -> 14 within the day,
 *   - live: true on today's point, whose figure is the latest capture.
 *
 * Revalidated rather than no-store: capture runs hourly, so a five-minute cache
 * costs nothing in freshness and keeps a popular analysis page off the database.
 */
export const revalidate = 300;

// Hard ceiling on rows read. GMP only exists between a filing and its listing,
// so a few hundred readings is already more than any issue will produce; this
// is a guard against a runaway query, not a page size.
const MAX_ROWS = 500;
const DEFAULT_DAYS = 45;

interface GmpSnapshotDoc {
  observed_at: Date;
  captured_at?: Date;
  last_seen_at?: Date;
  daily_carry?: boolean;
  gmp: number;
  est_listing_price?: number | null;
  est_listing_percent?: number | null;
  trend?: string;
  price_band?: string;
  status?: string;
}

interface DayPoint {
  /** Noon IST on the day, so each date sits centred on its tick. */
  t: string;
  /** The IST calendar date, e.g. "2026-09-24". */
  date: string;
  gmp: number;
  path: number[];
  open: number;
  high: number;
  low: number;
  est_listing_price: number | null;
  est_listing_percent: number | null;
  /** When the day's closing figure was last confirmed. */
  as_of: string;
  live: boolean;
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Index of the IST calendar day a moment falls on. */
function istDayIndex(ms: number) {
  return Math.floor((ms + IST_OFFSET_MS) / DAY_MS);
}

function istNoon(dayIndex: number) {
  return dayIndex * DAY_MS - IST_OFFSET_MS + DAY_MS / 2;
}

function istDate(dayIndex: number) {
  return new Date(dayIndex * DAY_MS).toISOString().slice(0, 10);
}

/** Rows oldest-first in, one point per IST day out. */
function buildDailySeries(rows: GmpSnapshotDoc[], now = Date.now()): DayPoint[] {
  // Every reading we can vouch for, as (day, time, row). A row counts on its
  // own day, and on each later day we saw it still quoted -- up to the next row.
  const readings: { day: number; ms: number; row: GmpSnapshotDoc }[] = [];

  rows.forEach((row, i) => {
    // captured_at is ipowatch's own "Last Updated" stamp; a capture delayed by
    // a sleeping instance would otherwise place an old quote at fetch time.
    const start = (row.captured_at ?? row.observed_at).getTime();
    readings.push({ day: istDayIndex(start), ms: start, row });

    const next = rows[i + 1];
    const seen = (row.last_seen_at ?? row.observed_at).getTime();
    const end = next ? Math.min(seen, next.observed_at.getTime()) : seen;
    for (let day = istDayIndex(start) + 1; day <= istDayIndex(end); day += 1) {
      // On the last covered day the figure was confirmed at `end`; on days in
      // between, all we know is that it held, so it sits at the day's start.
      const ms = day === istDayIndex(end) ? end : day * DAY_MS - IST_OFFSET_MS;
      readings.push({ day, ms, row });
    }
    // The newest row's latest confirmation, so today's "as of" is current.
    if (!next && istDayIndex(seen) === istDayIndex(start) && seen > start) {
      readings.push({ day: istDayIndex(seen), ms: seen, row });
    }
  });

  readings.sort((a, b) => a.ms - b.ms);

  const byDay = new Map<number, typeof readings>();
  for (const r of readings) {
    const list = byDay.get(r.day) ?? [];
    list.push(r);
    byDay.set(r.day, list);
  }

  const today = istDayIndex(now);
  return [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, list]) => {
      const path: number[] = [];
      for (const r of list) if (path[path.length - 1] !== r.row.gmp) path.push(r.row.gmp);
      const close = list[list.length - 1];
      return {
        t: new Date(istNoon(day)).toISOString(),
        date: istDate(day),
        gmp: close.row.gmp,
        path,
        open: path[0],
        high: Math.max(...path),
        low: Math.min(...path),
        est_listing_price: close.row.est_listing_price ?? null,
        est_listing_percent: close.row.est_listing_percent ?? null,
        as_of: new Date(close.ms).toISOString(),
        live: day === today,
      };
    });
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
      // Newest first matches the index; reversed below into oldest-first.
      .sort({ observed_at: -1 })
      .limit(MAX_ROWS)
      .toArray()) as unknown as GmpSnapshotDoc[];

    const series = buildDailySeries(rows.reverse());

    return NextResponse.json({
      message: "Data retrieved successfully",
      success: true,
      days,
      series,
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
