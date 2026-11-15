import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SupplierDetailView } from "@/components/suppliers/supplier-detail-view";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { getSupplier } from "@/lib/services/suppliers";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "Supplier details" };

type PageProps = {
  params: Promise<{ id: string }>;
};

async function SupplierDetailContent({ params }: PageProps) {
  const { id } = await params;
  const { store, role } = await getCurrentStoreContext();
  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const supplier = await getSupplier(store.id, id);
  if (!supplier) notFound();

  return (
    <SupplierDetailView
      supplier={supplier}
      canManage={role === "owner" || role === "manager"}
    />
  );
}

export default function SupplierDetailPage(props: PageProps) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <SupplierDetailContent {...props} />
    </Suspense>
  );
}
