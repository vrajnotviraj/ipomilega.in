import { NextResponse } from "next/server";
import { getIpoBucketsFull } from "@/lib/queries/ipos";
import { getAllBlogs } from "@/lib/queries/blogs";
import { requireAdmin } from "@/lib/auth";

// Admin console data: complete records for every bucket, plus the flat list and blogs.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    try {
        const [{ upcoming, live, closed, past, tba, recently_added }, blogs] =
            await Promise.all([getIpoBucketsFull(), getAllBlogs()]);
        const all = [...live, ...upcoming, ...closed, ...past, ...tba];

        return NextResponse.json({
            message: "Data retrieved successfully",
            success: true,
            data: { upcoming, live, closed, past, tba, all, recently_added, blogs },
            counts: {
                upcoming: upcoming.length,
                live: live.length,
                closed: closed.length,
                past: past.length,
                tba: tba.length,
                recently_added: recently_added.length,
                total: all.length,
            },
        });
    } catch (error) {
        console.error("Error in /api/ipo/upcoming:", error);
        return NextResponse.json({
            message: error instanceof Error ? error.message : "Something went wrong",
            success: false,
        }, { status: 500 });
    }
}
