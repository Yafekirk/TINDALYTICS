import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SaleDetailView } from "@/components/sales/sale-detail-view";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { getSaleDetail } from "@/lib/services/sales";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "Sale details" };

type PageProps = {
  params: Promise<{ id: string }>;
};

async function SaleDetailContent({ params }: PageProps) {
  const { id } = await params;
  const { store, role } = await getCurrentStoreContext();

  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const sale = await getSaleDetail(store.id, id);
  if (!sale) notFound();

  const canManage = role === "owner" || role === "manager";

  return <SaleDetailView sale={sale} canManage={canManage} />;
}

export default function SaleDetailPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      }
    >
      <SaleDetailContent {...props} />
    </Suspense>
  );
}
