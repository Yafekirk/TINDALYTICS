import { CalendarDays, Database } from "lucide-react";
import { Suspense } from "react";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { LowStockTable } from "@/components/dashboard/low-stock-table";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentTransactionsTable } from "@/components/dashboard/recent-transactions-table";
import { SeedDemoButton } from "@/components/dashboard/seed-demo-button";
import { TopProductsTable } from "@/components/dashboard/top-products-table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardData } from "@/types/dashboard";

type DashboardPageProps = {
  data: DashboardData;
};

export function DashboardPage({ data }: DashboardPageProps) {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-gradient-to-r from-white via-white to-accent-soft/40 p-5 shadow-sm transition-shadow hover:shadow-md lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone="success">Live store data</Badge>
            <Badge tone="info">Asia/Manila</Badge>
            <Badge tone="default">{data.periodLabel}</Badge>
          </div>
          <h2 className="text-xl font-semibold text-navy sm:text-2xl">
            Welcome back, {data.ownerFirstName}
          </h2>
          <p className="mt-1 text-sm text-secondary">
            Here&apos;s how {data.storeName} is performing for {data.periodLabel.toLowerCase()}.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Suspense fallback={<Skeleton className="h-10 w-48 rounded-xl" />}>
            <DateRangeFilter period={data.period} />
          </Suspense>
          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-white/80 px-3 py-2 text-sm text-secondary">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span>{data.todayLabel}</span>
          </div>
        </div>
      </section>

      {data.canSeedDemo ? (
        <Card className="border-dashed border-accent">
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft text-primary">
                <Database className="h-5 w-5" />
              </span>
              <div>
                <CardTitle>Your store is empty</CardTitle>
                <CardDescription>
                  Load realistic sari-sari demo products, inventory, and sales to
                  explore the dashboard — or start by adding products in Phase 4.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SeedDemoButton />
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.kpis.map((metric) => (
          <KpiCard key={metric.id} metric={metric} />
        ))}
      </section>

      <QuickActions />

      <DashboardCharts
        dailySales={data.dailySales}
        weeklySales={data.weeklySales}
        monthlySales={data.monthlySales}
        categorySales={data.categorySales}
        periodLabel={data.periodLabel}
      />

      <section className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <RecentTransactionsTable transactions={data.recentTransactions} />
        </div>
        <div className="xl:col-span-2">
          <TopProductsTable products={data.topProducts} />
        </div>
      </section>

      <LowStockTable products={data.lowStockProducts} />
    </div>
  );
}
