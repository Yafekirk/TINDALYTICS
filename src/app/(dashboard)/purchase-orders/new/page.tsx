import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PoForm } from "@/components/purchase-orders/po-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { listProductsForPurchaseOrder } from "@/lib/services/purchase-orders";
import { listSuppliers } from "@/lib/services/products";
import { manilaDayKey } from "@/lib/utils/timezone";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "New purchase order" };

type PageProps = {
  searchParams: Promise<{ supplier?: string }>;
};

export default async function NewPurchaseOrderPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { store, role } = await getCurrentStoreContext();
  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const canManage = role === "owner" || role === "manager";
  const preferredSupplier =
    params.supplier && params.supplier.length > 0 ? params.supplier : undefined;

  const [suppliers, products] = await Promise.all([
    listSuppliers(store.id),
    listProductsForPurchaseOrder(store.id, preferredSupplier),
  ]);

  const initialSupplierId = suppliers.some((s) => s.id === preferredSupplier)
    ? preferredSupplier
    : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/purchase-orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to purchase orders
      </Link>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>New purchase order</CardTitle>
            <CardDescription>
              Select a supplier, add products and quantities, then save as draft
              or mark ordered.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!canManage ? (
            <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-secondary">
              View-only access. Only owners or managers can create purchase
              orders.
            </p>
          ) : suppliers.length === 0 ? (
            <div className="space-y-3">
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Add at least one supplier before creating a purchase order.
              </p>
              <Link
                href="/suppliers/new"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover"
              >
                Add supplier
              </Link>
            </div>
          ) : (
            <PoForm
              mode="create"
              suppliers={suppliers}
              products={products}
              initialSupplierId={initialSupplierId}
              defaultOrderDate={manilaDayKey(new Date())}
              canManage={canManage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
