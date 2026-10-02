"use client";
import dynamic from "next/dynamic";

/** Revenue, expense and profit bars. Recharts loads after the page is interactive, into a box of the same height. */
export const FinancialTrendChart = dynamic(() => import("./FinancialBars"), {
  ssr: false,
  loading: () => <div className="h-80 w-full rounded-lg bg-secondary" />,
});
