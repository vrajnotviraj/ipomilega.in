import { NextResponse } from "next/server";
import { getIpoBuckets } from "@/lib/queries/ipos";

// Bucketing + the Mongo reads now live in lib/queries/ipos.ts so the homepage can call them
// in-process. This route stays for any client-side caller and shares that one implementation
// (and its per-request cache) rather than keeping a second copy of the date logic.
export const revalidate = 300;

export async function GET() {
    try {
        const buckets = await getIpoBuckets();

        return NextResponse.json({
            message: "Data retrieved successfully",
            success: true,
            data: {
                upcoming: buckets.upcoming,
                live: buckets.live,
                closed: buckets.closed,
                past: buckets.past,
                tba: buckets.tba,
            },
            counts: {
                upcoming: buckets.upcoming.length,
                live: buckets.live.length,
                closed: buckets.closed.length,
                past: buckets.past.length,
                tba: buckets.tba.length,
                total:
                    buckets.upcoming.length +
                    buckets.live.length +
                    buckets.closed.length +
                    buckets.past.length +
                    buckets.tba.length,
            },
        });
    } catch (error) {
        console.error("Error in /api/ipo:", error);
        return NextResponse.json({
            message: error instanceof Error ? error.message : "Something went wrong",
            success: false,
        }, { status: 500 });
    }
}
