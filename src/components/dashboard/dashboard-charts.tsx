"use client";

import { useMemo, useState } from "react";
import { CategorySalesChart } from "@/components/charts/category-sales-chart";
import { SalesOverviewChart } from "@/components/charts/sales-overview-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";
import type { CategorySales, SalesPoint } from "@/types/dashboard";

type RangeKey = "daily" | "weekly" | "monthly";

const ranges: { key: RangeKey; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

type DashboardChartsProps = {
  dailySales: SalesPoint[];
  weeklySales: SalesPoint[];
  monthlySales: SalesPoint[];
  categorySales: CategorySales[];
  periodLabel: string;
};

export function DashboardCharts({
  dailySales,
  weeklySales,
  monthlySales,
  categorySales,
  periodLabel,
}: DashboardChartsProps) {
  const [range, setRange] = useState<RangeKey>("daily");

  const salesData = useMemo(() => {
    if (range === "weekly") return weeklySales;
    if (range === "monthly") return monthlySales;
    return dailySales;
  }, [dailySales, monthlySales, range, weeklySales]);

  const hasSales = salesData.some((point) => point.sales > 0);
  const rangeLabel =
    range === "daily"
      ? "Today by hour"
      : range === "weekly"
        ? "This week"
        : "Last 6 months";

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <Card className="xl:col-span-3">
        <CardHeader>
          <div>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>{rangeLabel}</CardDescription>
          </div>
          <div className="flex rounded-xl border border-border bg-page p-1">
            {ranges.map((item) => (
              <Button
                key={item.key}
                size="sm"
                variant="ghost"
                className={cn(
                  "h-8 rounded-lg px-3 hover:bg-accent-soft/60",
                  range === item.key &&
                    "bg-primary !text-white shadow-sm hover:bg-primary-hover hover:!text-white",
                )}
                onClick={() => setRange(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {hasSales ? (
            <SalesOverviewChart data={salesData} />
          ) : (
            <EmptyState
              title="No sales in this range"
              description="Completed transactions will appear in the chart once recorded."
            />
          )}
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <div>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>{periodLabel} category mix</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {categorySales.length > 0 ? (
            <CategorySalesChart data={categorySales} />
          ) : (
            <EmptyState
              title="No category sales"
              description="Category breakdown appears after products are sold."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
