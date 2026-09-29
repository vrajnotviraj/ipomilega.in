// src/components/charts/InvestorSplitPieChart.tsx
"use client";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface PieChartData {
  name: string;
  value: number;
}

interface InvestorSplitPieChartProps {
  data: PieChartData[];
}

const COLORS = ["#0073E6", "#00914D", "#E4CA28"]; // Blue, Green, Yellow

const CustomTooltip = ({ active, payload }: { active: boolean; payload: { name: string; value: number }[] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 text-sm bg-background border rounded-md shadow-lg">
        <p className="font-bold">{`${payload[0].name}`}</p>
        <p className="text-muted-foreground">{`Allocation: ${payload[0].value.toFixed(2)}%`}</p>
      </div>
    );
  }
  return null;
};

export function InvestorSplitPieChart({ data }: InvestorSplitPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No investor split data available.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Tooltip content={<CustomTooltip active={false} payload={[]} />} />
        <Legend
          iconType="circle"
          wrapperStyle={{
            paddingTop: '20px',
            fontFamily: 'var(--font-sans)',
          }}
        />
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={90}
          labelLine={false}
          dataKey="value"
          nameKey="name"
          isAnimationActive={true}
          animationDuration={1000}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>

      </PieChart>
    </ResponsiveContainer>
  );
}