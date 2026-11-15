import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ReceiptView } from "@/components/pos/receipt-view";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { getSaleReceipt } from "@/lib/services/pos";

export const metadata: Metadata = { title: "Reprint receipt" };

type PageProps = {
  params: Promise<{ id: string }>;
};

async function ReprintReceiptContent({ params }: PageProps) {
  const { id } = await params;
  const { store } = await getCurrentStoreContext();

  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const receipt = await getSaleReceipt(store.id, id);
  if (!receipt) notFound();

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <h2 className="text-xl font-semibold text-navy">Reprint receipt</h2>
        <p className="mt-1 text-sm text-secondary">
          Receipt {receipt.receiptNumber}
          {receipt.status !== "completed"
            ? ` · Status: ${receipt.status}`
            : ""}
        </p>
      </div>
      <ReceiptView
        receipt={receipt}
        backHref={`/sales/${id}`}
        logReprintOnPrint
      />
    </div>
  );
}

export default function ReprintReceiptPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <Skeleton className="mx-auto h-[70vh] max-w-lg rounded-2xl" />
      }
    >
      <ReprintReceiptContent {...props} />
    </Suspense>
  );
}
