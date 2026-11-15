import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
import {
  getPurchaseOrder,
  listProductsForPurchaseOrder,
} from "@/lib/services/purchase-orders";
import { listSuppliers } from "@/lib/services/products";
import { manilaDayKey } from "@/lib/utils/timezone";

export const metadata: Metadata = { title: "Edit purchase order" };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPurchaseOrderPage({ params }: PageProps) {
  const { id } = await params;
  const { store, role } = await getCurrentStoreContext();
  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const purchaseOrder = await getPurchaseOrder(store.id, id);
  if (!purchaseOrder) notFound();
  if (purchaseOrder.status !== "draft") {
    redirect(`/purchase-orders/${id}`);
  }

  const canManage = role === "owner" || role === "manager";
  const [suppliers, products] = await Promise.all([
    listSuppliers(store.id),
    listProductsForPurchaseOrder(store.id, purchaseOrder.supplierId),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href={`/purchase-orders/${purchaseOrder.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to purchase order
      </Link>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Edit draft {purchaseOrder.poNumber}</CardTitle>
            <CardDescription>
              Update supplier, dates, and line items before marking as ordered.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!canManage ? (
            <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-secondary">
              View-only access.
            </p>
          ) : (
            <PoForm
              mode="edit"
              suppliers={suppliers}
              products={products}
              purchaseOrder={purchaseOrder}
              defaultOrderDate={
                purchaseOrder.orderDate || manilaDayKey(new Date())
              }
              canManage={canManage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
