import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Suspense } from "react";
import { PoFilters } from "@/components/purchase-orders/po-filters";
import { PoPagination } from "@/components/purchase-orders/po-pagination";
import { PoSummaryCards } from "@/components/purchase-orders/po-summary-cards";
import { PoTable } from "@/components/purchase-orders/po-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { listPurchaseOrders } from "@/lib/services/purchase-orders";
import { listSuppliers } from "@/lib/services/products";
import type { PurchaseOrderStatus } from "@/types/purchase-order";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "Purchase Orders" };

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    supplier?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
};

async function PurchaseOrdersContent({ searchParams }: PageProps) {
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

  const [suppliers, result] = await Promise.all([
    listSuppliers(store.id),
    listPurchaseOrders(store.id, {
      q: params.q,
      status: params.status as PurchaseOrderStatus | "all" | undefined,
      supplierId: params.supplier,
      dateFrom: params.from,
      dateTo: params.to,
      page,
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-navy">Purchase Orders</h2>
          <p className="mt-1 text-sm text-secondary">
            Create orders, track status, and receive stock into inventory.
          </p>
        </div>
        {canManage ? (
          <Link
            href="/purchase-orders/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            <ClipboardList className="h-4 w-4" />
            New purchase order
          </Link>
        ) : null}
      </section>

      <PoSummaryCards summary={result.summary} />

      <Suspense fallback={<Skeleton className="h-16 w-full rounded-2xl" />}>
        <PoFilters suppliers={suppliers} />
      </Suspense>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Order list</CardTitle>
            <CardDescription>
              {result.total} purchase order{result.total === 1 ? "" : "s"} in
              this view.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <PoTable items={result.items} />
          <PoPagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            searchParams={{
              q: params.q,
              status: params.status,
              supplier: params.supplier,
              from: params.from,
              to: params.to,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function PurchaseOrdersPage(props: PageProps) {
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
      <PurchaseOrdersContent {...props} />
    </Suspense>
  );
}
