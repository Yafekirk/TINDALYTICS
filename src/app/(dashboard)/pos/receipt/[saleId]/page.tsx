import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ReceiptView } from "@/components/pos/receipt-view";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { getSaleReceipt } from "@/lib/services/pos";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "Receipt" };

type PageProps = {
  params: Promise<{ saleId: string }>;
};

async function ReceiptContent({ params }: PageProps) {
  const { saleId } = await params;
  const { store } = await getCurrentStoreContext();

  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const receipt = await getSaleReceipt(store.id, saleId);
  if (!receipt) notFound();

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <h2 className="text-xl font-semibold text-navy">Sale complete</h2>
        <p className="mt-1 text-sm text-secondary">
          Receipt {receipt.receiptNumber} is ready to print.
        </p>
      </div>
      <ReceiptView receipt={receipt} />
    </div>
  );
}

export default function ReceiptPage(props: PageProps) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-[70vh] max-w-lg rounded-2xl" />}>
      <ReceiptContent {...props} />
    </Suspense>
  );
}
