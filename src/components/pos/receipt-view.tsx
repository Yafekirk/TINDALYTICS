"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logReceiptReprintAction } from "@/lib/sales/actions";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateTime } from "@/lib/utils/format";
import type { ReceiptData } from "@/types/pos";

type ReceiptViewProps = {
  receipt: ReceiptData;
  backHref?: string;
  logReprintOnPrint?: boolean;
};

function paymentLabel(method: string) {
  if (method === "cash") return "Cash";
  if (method === "gcash") return "GCash";
  return "Other";
}

function statusMeta(status: string) {
  if (status === "voided") {
    return { label: "VOIDED", tone: "warning" as const };
  }
  if (status === "refunded") {
    return { label: "REFUNDED", tone: "danger" as const };
  }
  return null;
}

export function ReceiptView({
  receipt,
  backHref,
  logReprintOnPrint = false,
}: ReceiptViewProps) {
  const status = statusMeta(receipt.status);
  const [isLogging, startTransition] = useTransition();

  function handlePrint() {
    if (logReprintOnPrint) {
      startTransition(async () => {
        await logReceiptReprintAction(receipt.saleId);
      });
    }
    window.print();
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button type="button" onClick={handlePrint} disabled={isLogging}>
          <Printer className="h-4 w-4" />
          Print receipt
        </Button>
        <Link
          href="/pos"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-navy transition hover:border-accent hover:bg-accent-soft/40"
        >
          New sale
        </Link>
        <Link
          href={backHref ?? "/sales"}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-navy transition hover:border-accent hover:bg-accent-soft/40"
        >
          {backHref ? "Back to sale" : "Sales history"}
        </Link>
      </div>

      <article className="rounded-2xl border border-border bg-white p-6 shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <header className="border-b border-border pb-4 text-center">
          <h1 className="text-lg font-bold text-navy">{receipt.storeName}</h1>
          {receipt.storeAddress ? (
            <p className="mt-1 text-sm text-secondary">{receipt.storeAddress}</p>
          ) : null}
          <p className="mt-3 text-sm font-semibold text-navy">
            {receipt.receiptNumber}
          </p>
          {status ? (
            <div className="mt-2 flex justify-center">
              <Badge tone={status.tone}>{status.label}</Badge>
            </div>
          ) : null}
          <p className="mt-2 text-xs text-secondary">
            {formatDateTime(receipt.createdAt)}
          </p>
        </header>

        <div className="mt-4 space-y-1 text-sm text-secondary">
          <p>
            Cashier: <span className="text-navy">{receipt.cashierName}</span>
          </p>
          <p>
            Customer:{" "}
            <span className="text-navy">
              {receipt.customerName ?? "Walk-in"}
            </span>
          </p>
          <p>
            Payment:{" "}
            <span className="text-navy">
              {paymentLabel(receipt.paymentMethod)}
            </span>
          </p>
        </div>

        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-secondary">
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item, index) => (
              <tr key={`${item.sku}-${index}`} className="border-b border-border/70">
                <td className="py-2">
                  <p className="font-medium text-navy">{item.name}</p>
                  <p className="text-xs text-secondary">
                    {formatCurrency(item.unitPrice)} / {item.unit}
                  </p>
                </td>
                <td className="py-2 align-top text-navy">{item.quantity}</td>
                <td className="py-2 align-top text-right font-medium text-navy">
                  {formatCurrency(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-secondary">
            <span>Subtotal</span>
            <span>{formatCurrency(receipt.subtotal)}</span>
          </div>
          <div className="flex justify-between text-secondary">
            <span>Discount</span>
            <span>-{formatCurrency(receipt.discount)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-navy">
            <span>Total</span>
            <span>{formatCurrency(receipt.total)}</span>
          </div>
          {receipt.cashReceived != null ? (
            <div className="flex justify-between text-secondary">
              <span>Cash received</span>
              <span>{formatCurrency(receipt.cashReceived)}</span>
            </div>
          ) : null}
          {receipt.changeAmount != null ? (
            <div className="flex justify-between text-secondary">
              <span>Change</span>
              <span>{formatCurrency(receipt.changeAmount)}</span>
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-center text-xs text-secondary">
          Salamat! Thank you for shopping with us.
        </p>
      </article>
    </div>
  );
}
