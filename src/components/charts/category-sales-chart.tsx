"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { colors } from "@/config/brand";
import { formatCurrency } from "@/lib/utils/currency";
import type { CategorySales } from "@/types/dashboard";

type CategorySalesChartProps = {
  data: CategorySales[];
};

export function CategorySalesChart({ data }: CategorySalesChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
          <XAxis
            dataKey="category"
            tickLine={false}
            axisLine={false}
            tick={{ fill: colors.secondaryText, fontSize: 11 }}
            interval={0}
            angle={-18}
            textAnchor="end"
            height={58}
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
            cursor={{ fill: "rgba(160, 224, 239, 0.25)" }}
            contentStyle={{
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              boxShadow: "0 8px 24px rgba(27, 54, 93, 0.1)",
            }}
            formatter={(value) => [formatCurrency(Number(value ?? 0)), "Sales"]}
          />
          <Bar dataKey="sales" radius={[10, 10, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.category} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
