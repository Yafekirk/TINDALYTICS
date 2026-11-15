import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Suspense } from "react";
import { SalesFilters } from "@/components/sales/sales-filters";
import { SalesPagination } from "@/components/sales/sales-pagination";
import { SalesSummaryCards } from "@/components/sales/sales-summary-cards";
import { SalesTable } from "@/components/sales/sales-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { listCashiers, listSales } from "@/lib/services/sales";
import type { SaleStatus } from "@/types/sales";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "Sales & Transactions" };

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    payment?: string;
    cashier?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
};

async function SalesContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const { store } = await getCurrentStoreContext();

  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
        <p className="mt-2 text-sm text-secondary">
          We couldn&apos;t find a store for this account.
        </p>
      </div>
    );
  }

  const page = Math.max(1, Number(params.page) || 1);

  const [cashiers, result] = await Promise.all([
    listCashiers(store.id),
    listSales(store.id, {
      q: params.q,
      status: params.status as SaleStatus | "all" | undefined,
      paymentMethod: params.payment,
      cashierId: params.cashier,
      dateFrom: params.from,
      dateTo: params.to,
      page,
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-navy">
            Sales & Transactions
          </h2>
          <p className="mt-1 text-sm text-secondary">
            Review history, reprint receipts, and process voids or refunds.
          </p>
        </div>
        <Link
          href="/pos"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover"
        >
          <ShoppingCart className="h-4 w-4" />
          New sale
        </Link>
      </section>

      <SalesSummaryCards summary={result.summary} />

      <Suspense fallback={<Skeleton className="h-16 w-full rounded-2xl" />}>
        <SalesFilters cashiers={cashiers} />
      </Suspense>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Transaction history</CardTitle>
            <CardDescription>
              {result.total} transaction{result.total === 1 ? "" : "s"} in this
              view. Completed sales are never deleted.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SalesTable items={result.items} />
          <SalesPagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            searchParams={{
              q: params.q,
              status: params.status,
              payment: params.payment,
              cashier: params.cashier,
              from: params.from,
              to: params.to,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SalesPage(props: PageProps) {
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
      <SalesContent {...props} />
    </Suspense>
  );
}
