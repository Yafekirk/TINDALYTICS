"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { colors } from "@/config/brand";
import { formatCurrency } from "@/lib/utils/currency";
import type { SalesPoint } from "@/types/dashboard";

type SalesOverviewChartProps = {
  data: SalesPoint[];
};

export function SalesOverviewChart({ data }: SalesOverviewChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.accent} stopOpacity={0.45} />
              <stop offset="100%" stopColor={colors.accentSoft} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: colors.secondaryText, fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: colors.secondaryText, fontSize: 12 }}
            tickFormatter={(value: number) =>
              value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`
            }
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              boxShadow: "0 8px 24px rgba(27, 54, 93, 0.1)",
            }}
            formatter={(value) => [formatCurrency(Number(value ?? 0)), "Sales"]}
          />
          <Area
            type="monotone"
            dataKey="sales"
            stroke={colors.primary}
            strokeWidth={2.5}
            fill="url(#salesFill)"
            activeDot={{ r: 5, fill: colors.navy, stroke: colors.accentSoft, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
