import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PoDetailView } from "@/components/purchase-orders/po-detail-view";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { getPurchaseOrder } from "@/lib/services/purchase-orders";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "Purchase order details" };

type PageProps = {
  params: Promise<{ id: string }>;
};

async function PurchaseOrderDetailContent({ params }: PageProps) {
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

  return (
    <PoDetailView
      purchaseOrder={purchaseOrder}
      canManage={role === "owner" || role === "manager"}
    />
  );
}

export default function PurchaseOrderDetailPage(props: PageProps) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <PurchaseOrderDetailContent {...props} />
    </Suspense>
  );
}
