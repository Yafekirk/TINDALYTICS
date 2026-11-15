import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CreditDetailView } from "@/components/credits/credit-detail-view";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { getCredit } from "@/lib/services/credits";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "Credit details" };

type PageProps = {
  params: Promise<{ id: string }>;
};

async function CreditDetailContent({ params }: PageProps) {
  const { id } = await params;
  const { store, role } = await getCurrentStoreContext();

  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const credit = await getCredit(store.id, id);
  if (!credit) notFound();

  return (
    <CreditDetailView
      credit={credit}
      canVoid={role === "owner" || role === "manager"}
    />
  );
}

export default function CreditDetailPage(props: PageProps) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <CreditDetailContent {...props} />
    </Suspense>
  );
}
