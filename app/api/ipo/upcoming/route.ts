import { NextResponse } from "next/server";
import { getIpoBuckets } from "@/lib/queries/ipos";
import { getAllBlogs } from "@/lib/queries/blogs";

// Backs the admin console, which needs every bucket plus the flat `all` list and the blog
// list. Public pages no longer call this -- /ipos server-renders from getIpoBuckets() directly
// instead of shipping a blank page and fetching this payload from the browser.
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const [buckets, blogs] = await Promise.all([getIpoBuckets(), getAllBlogs()]);

        const all = [
            ...buckets.live,
            ...buckets.upcoming,
            ...buckets.closed,
            ...buckets.past,
            ...buckets.tba,
        ];

        return NextResponse.json({
            message: "Data retrieved successfully",
            success: true,
            data: {
                upcoming: buckets.upcoming,
                live: buckets.live,
                closed: buckets.closed,
                past: buckets.past,
                tba: buckets.tba,
                all,
                recently_added: buckets.recently_added,
                blogs,
            },
            counts: {
                upcoming: buckets.upcoming.length,
                live: buckets.live.length,
                closed: buckets.closed.length,
                past: buckets.past.length,
                tba: buckets.tba.length,
                recently_added: buckets.recently_added.length,
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
