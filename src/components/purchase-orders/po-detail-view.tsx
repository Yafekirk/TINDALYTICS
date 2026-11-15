"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  PackagePlus,
  Pencil,
  XCircle,
} from "lucide-react";
import { PoReceiveDialog } from "@/components/purchase-orders/po-receive-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  cancelPurchaseOrderAction,
  markPurchaseOrderOrderedAction,
} from "@/lib/purchase-orders/actions";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import type {
  PurchaseOrderDetail,
  PurchaseOrderStatus,
} from "@/types/purchase-order";

const statusTone: Record<
  PurchaseOrderStatus,
  "default" | "success" | "warning" | "danger" | "info"
> = {
  draft: "default",
  ordered: "info",
  partially_received: "warning",
  received: "success",
  cancelled: "danger",
};

type PoDetailViewProps = {
  purchaseOrder: PurchaseOrderDetail;
  canManage: boolean;
};

export function PoDetailView({ purchaseOrder, canManage }: PoDetailViewProps) {
  const router = useRouter();
  const [showReceive, setShowReceive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canReceive =
    canManage &&
    (purchaseOrder.status === "ordered" ||
      purchaseOrder.status === "partially_received");

  function runAction(action: "order" | "cancel") {
    startTransition(async () => {
      const result =
        action === "order"
          ? await markPurchaseOrderOrderedAction(purchaseOrder.id)
          : await cancelPurchaseOrderAction(purchaseOrder.id);
      if (result.error) {
        setError(result.error);
        setMessage(null);
        return;
      }
      setError(null);
      setMessage(result.success ?? "Updated.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Link
            href="/purchase-orders"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to purchase orders
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-navy">
              {purchaseOrder.poNumber}
            </h2>
            <Badge
              tone={statusTone[purchaseOrder.status]}
              className="capitalize"
            >
              {purchaseOrder.status.replaceAll("_", " ")}
            </Badge>
          </div>
          <p className="text-sm text-secondary">
            {purchaseOrder.supplierName ?? "No supplier"} · Ordered{" "}
            {formatDate(purchaseOrder.orderDate)}
            {purchaseOrder.expectedDate
              ? ` · Expected ${formatDate(purchaseOrder.expectedDate)}`
              : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canManage && purchaseOrder.status === "draft" ? (
            <>
              <Link
                href={`/purchase-orders/${purchaseOrder.id}/edit`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-medium text-navy transition hover:border-accent hover:bg-accent-soft/40"
              >
                <Pencil className="h-4 w-4" />
                Edit draft
              </Link>
              <Button
                type="button"
                onClick={() => runAction("order")}
                disabled={isPending}
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark ordered
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => runAction("cancel")}
                disabled={isPending}
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </Button>
            </>
          ) : null}

          {canManage && purchaseOrder.status === "ordered" ? (
            <Button
              type="button"
              variant="danger"
              onClick={() => runAction("cancel")}
              disabled={isPending}
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </Button>
          ) : null}

          {canReceive ? (
            <Button type="button" onClick={() => setShowReceive(true)}>
              <PackagePlus className="h-4 w-4" />
              Receive goods
            </Button>
          ) : null}
        </div>
      </section>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
          {message}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Order lines</CardTitle>
              <CardDescription>
                Ordered vs received quantities for this purchase order.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Product</TH>
                  <TH>Ordered</TH>
                  <TH>Received</TH>
                  <TH>Unit cost</TH>
                  <TH className="text-right">Line total</TH>
                </TR>
              </THead>
              <TBody>
                {purchaseOrder.items.map((item) => (
                  <TR key={item.id}>
                    <TD>
                      <p className="font-medium text-navy">{item.productName}</p>
                      <p className="text-xs text-secondary">
                        {item.sku} · {item.unit}
                      </p>
                    </TD>
                    <TD>{item.quantity}</TD>
                    <TD>{item.receivedQuantity}</TD>
                    <TD>{formatCurrency(item.unitCost)}</TD>
                    <TD className="text-right font-medium text-navy">
                      {formatCurrency(item.lineTotal)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Order metadata and totals.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between text-secondary">
              <span>Created by</span>
              <span className="text-navy">
                {purchaseOrder.createdByName ?? "Staff"}
              </span>
            </div>
            <div className="flex justify-between text-secondary">
              <span>Created</span>
              <span>{formatDateTime(purchaseOrder.createdAt)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-navy">
              <span>Total</span>
              <span>{formatCurrency(purchaseOrder.totalAmount)}</span>
            </div>
            {purchaseOrder.notes ? (
              <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-secondary whitespace-pre-wrap">
                {purchaseOrder.notes}
              </p>
            ) : null}
            {purchaseOrder.supplierId ? (
              <Link
                href={`/suppliers/${purchaseOrder.supplierId}`}
                className="inline-flex pt-2 text-sm font-medium text-primary hover:underline"
              >
                View supplier
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {showReceive ? (
        <PoReceiveDialog
          purchaseOrderId={purchaseOrder.id}
          poNumber={purchaseOrder.poNumber}
          items={purchaseOrder.items}
          onClose={() => setShowReceive(false)}
        />
      ) : null}
    </div>
  );
}
