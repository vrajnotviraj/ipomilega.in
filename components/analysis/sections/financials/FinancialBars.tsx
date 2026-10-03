"use client";
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FinancialReport } from "@/types/ipo";
import { croresOf, periodLabel } from "@/components/analysis/sections/financials/financial-figures";

const AXIS_TICK = { fontSize: 12, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" };

const formatTick = (value: number) => value.toLocaleString("en-IN");

/** Gain green for a profit, loss red for a loss. */
const profitFill = (value: number) => (value < 0 ? "var(--score-bad)" : "var(--score-good)");

/** Revenue, expense and profit after tax per period, as grouped bars. Profit is coloured by its sign. */
export default function FinancialBars({ reports }: { reports: FinancialReport[] }) {
  const data = reports.map((report) => ({
    year: periodLabel(report.period_ended || ""),
    Revenue: croresOf(report.revenue),
    Expense: croresOf(report.expense),
    "Profit after tax": croresOf(report.profit_after_tax),
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 5 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="year" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={56} tickFormatter={formatTick} />
          <Tooltip
            cursor={{ fill: "var(--card)" }}
            formatter={(value: number) => formatTick(value)}
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              boxShadow: "var(--shadow-lift)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 13 }} iconType="circle" iconSize={8} />
          <Bar dataKey="Revenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="Expense" fill="var(--chart-5)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="Profit after tax" fill="var(--score-good)" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {data.map((entry, index) => (
              <Cell key={index} fill={profitFill(entry["Profit after tax"])} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
