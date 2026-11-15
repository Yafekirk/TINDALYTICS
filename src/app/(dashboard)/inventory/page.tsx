import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";
import { Suspense } from "react";
import { InventoryAlerts } from "@/components/inventory/inventory-alerts";
import { InventoryFilters } from "@/components/inventory/inventory-filters";
import { InventoryPagination } from "@/components/inventory/inventory-pagination";
import { InventorySummaryCards } from "@/components/inventory/inventory-summary-cards";
import { InventoryTable } from "@/components/inventory/inventory-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";
import {
  getLowStockAlerts,
  listInventory,
} from "@/lib/services/inventory";
import { listCategories } from "@/lib/services/products";
import type {
  InventorySortField,
  InventoryStatusFilter,
} from "@/types/inventory";

export const metadata: Metadata = { title: "Inventory" };

type PageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    sort?: string;
    dir?: string;
    page?: string;
  }>;
};

async function InventoryContent({ searchParams }: PageProps) {
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

  const [categories, result, alerts] = await Promise.all([
    listCategories(store.id),
    listInventory(store.id, {
      q: params.q,
      categoryId: params.category,
      status: params.status as InventoryStatusFilter | undefined,
      sort: params.sort as InventorySortField | undefined,
      dir: params.dir === "desc" ? "desc" : "asc",
      page,
    }),
    getLowStockAlerts(store.id),
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-navy">Inventory</h2>
          <p className="mt-1 text-sm text-secondary">
            Monitor stock levels, restock, and review authorized adjustments.
          </p>
        </div>
        <Link
          href="/inventory/movements"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-medium text-navy transition hover:border-accent hover:bg-accent-soft/40"
        >
          <History className="h-4 w-4" />
          Movement history
        </Link>
      </section>

      <InventorySummaryCards summary={result.summary} />

      <Suspense fallback={<Skeleton className="h-16 w-full rounded-2xl" />}>
        <InventoryFilters categories={categories} />
      </Suspense>

      {!canManage ? (
        <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-secondary">
          View-only access. Stock changes require an owner or manager.
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Stock levels</CardTitle>
              <CardDescription>
                {result.total} product{result.total === 1 ? "" : "s"} in this
                view.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <InventoryTable items={result.items} canManage={canManage} />
            <InventoryPagination
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
              searchParams={{
                q: params.q,
                category: params.category,
                status: params.status,
                sort: params.sort,
                dir: params.dir,
              }}
            />
          </CardContent>
        </Card>
        <div className="xl:col-span-2">
          <InventoryAlerts items={alerts} />
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage(props: PageProps) {
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
      <InventoryContent {...props} />
    </Suspense>
  );
}
