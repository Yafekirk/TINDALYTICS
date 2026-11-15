import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CustomerDetailView } from "@/components/customers/customer-detail-view";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { getCustomer } from "@/lib/services/customers";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "Customer details" };

type PageProps = {
  params: Promise<{ id: string }>;
};

async function CustomerDetailContent({ params }: PageProps) {
  const { id } = await params;
  const { store } = await getCurrentStoreContext();
  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const customer = await getCustomer(store.id, id);
  if (!customer) notFound();

  return <CustomerDetailView customer={customer} />;
}

export default function CustomerDetailPage(props: PageProps) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <CustomerDetailContent {...props} />
    </Suspense>
  );
}
