import type { Metadata } from "next";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { Suspense } from "react";
import { SimpleBarChart } from "@/components/charts/simple-bar-chart";
import { ExpensesFilters } from "@/components/expenses/expenses-filters";
import { ExpensesPagination } from "@/components/expenses/expenses-pagination";
import { ExpensesSummaryCards } from "@/components/expenses/expenses-summary-cards";
import { ExpensesTable } from "@/components/expenses/expenses-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { colors } from "@/config/brand";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { listExpenses } from "@/lib/services/expenses";
import type { ExpenseCategory, ExpenseStatus } from "@/types/expense";

export const metadata: Metadata = { title: "Expenses" };

type PageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
};

const chartColors = [
  colors.navy,
  colors.primary,
  colors.accent,
  "#3A7AB5",
  colors.info,
  colors.warning,
];

async function ExpensesContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const { store, role } = await getCurrentStoreContext();

  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const page = Math.max(1, Number(params.page) || 1);
  const canManage = role === "owner" || role === "manager";
  const result = await listExpenses(store.id, {
    q: params.q,
    category: params.category as ExpenseCategory | "all" | undefined,
    status: params.status as ExpenseStatus | "all" | undefined,
    dateFrom: params.from,
    dateTo: params.to,
    page,
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-navy">Expenses</h2>
          <p className="mt-1 text-sm text-secondary">
            Track rent, utilities, supplies, and other operating costs.
          </p>
        </div>
        {canManage ? (
          <Link
            href="/expenses/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            <Wallet className="h-4 w-4" />
            Add expense
          </Link>
        ) : null}
      </section>

      <ExpensesSummaryCards summary={result.summary} />

      <Suspense fallback={<Skeleton className="h-16 w-full rounded-2xl" />}>
        <ExpensesFilters />
      </Suspense>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>By category</CardTitle>
              <CardDescription>Active expenses in this view</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {result.summary.byCategory.length === 0 ? (
              <p className="text-sm text-secondary">No active expenses yet.</p>
            ) : (
              <SimpleBarChart
                data={result.summary.byCategory.map((row, index) => ({
                  label: row.label,
                  value: row.amount,
                  fill: chartColors[index % chartColors.length],
                }))}
              />
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Expense list</CardTitle>
              <CardDescription>
                {result.total} expense{result.total === 1 ? "" : "s"} in this
                view.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ExpensesTable items={result.items} />
            <ExpensesPagination
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
              searchParams={{
                q: params.q,
                category: params.category,
                status: params.status,
                from: params.from,
                to: params.to,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ExpensesPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      }
    >
      <ExpensesContent {...props} />
    </Suspense>
  );
}
