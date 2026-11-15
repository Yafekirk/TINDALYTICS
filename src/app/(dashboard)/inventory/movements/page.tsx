import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { InventoryPagination } from "@/components/inventory/inventory-pagination";
import { MovementsTable } from "@/components/inventory/movements-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { listInventoryMovements } from "@/lib/services/inventory";

export const metadata: Metadata = { title: "Inventory Movements" };

type PageProps = {
  searchParams: Promise<{ page?: string; product?: string }>;
};

async function MovementsContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const { store } = await getCurrentStoreContext();

  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 20;
  const { items, total } = await listInventoryMovements(store.id, {
    page,
    limit: pageSize,
    productId: params.product,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-navy">Movement history</h2>
          <p className="mt-1 text-sm text-secondary">
            Audit trail for stock-in, stock-out, adjustments, and sales.
          </p>
        </div>
        <Link
          href="/inventory"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-navy transition hover:border-accent hover:bg-accent-soft/40"
        >
          Back to inventory
        </Link>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Inventory movements</CardTitle>
            <CardDescription>
              {total} recorded movement{total === 1 ? "" : "s"}.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <MovementsTable movements={items} />
          <InventoryPagination
            page={page}
            totalPages={totalPages}
            total={total}
            basePath="/inventory/movements"
            searchParams={{ product: params.product }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function InventoryMovementsPage(props: PageProps) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <MovementsContent {...props} />
    </Suspense>
  );
}
