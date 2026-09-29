import { NextResponse } from "next/server";
import { getIpoBuckets } from "@/lib/queries/ipos";

export const revalidate = 300;

export async function GET() {
    try {
        const { upcoming, live, closed, past, tba } = await getIpoBuckets();
        const data = { upcoming, live, closed, past, tba };
        const counts = Object.fromEntries(Object.entries(data).map(([key, list]) => [key, list.length]));
        const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

        return NextResponse.json({
            message: "Data retrieved successfully",
            success: true,
            data,
            counts: { ...counts, total },
        });
    } catch (error) {
        console.error("Error in /api/ipo:", error);
        return NextResponse.json({
            message: error instanceof Error ? error.message : "Something went wrong",
            success: false,
        }, { status: 500 });
    }
}
