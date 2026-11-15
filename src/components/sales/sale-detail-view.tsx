"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Ban, Printer, RotateCcw } from "lucide-react";
import { SaleStatusDialog } from "@/components/sales/sale-status-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateTime } from "@/lib/utils/format";
import type { SaleDetail, SaleStatus, SaleStatusAction } from "@/types/sales";

const statusTone: Record<SaleStatus, "success" | "warning" | "danger"> = {
  completed: "success",
  voided: "warning",
  refunded: "danger",
};

function paymentLabel(method: string) {
  if (method === "cash") return "Cash";
  if (method === "gcash") return "GCash";
  return "Other";
}

function statusLabel(status: SaleStatus) {
  if (status === "voided") return "Voided";
  if (status === "refunded") return "Refunded";
  return "Completed";
}

function auditLabel(action: string) {
  if (action === "created") return "Sale created";
  if (action === "voided") return "Sale voided";
  if (action === "refunded") return "Sale refunded";
  if (action === "receipt_reprinted") return "Receipt reprinted";
  return action;
}

type SaleDetailViewProps = {
  sale: SaleDetail;
  canManage: boolean;
};

export function SaleDetailView({ sale, canManage }: SaleDetailViewProps) {
  const [dialogAction, setDialogAction] = useState<SaleStatusAction | null>(
    null,
  );
  const canChangeStatus = canManage && sale.status === "completed";

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Link
            href="/sales"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sales
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-navy">
              {sale.receiptNumber}
            </h2>
            <Badge tone={statusTone[sale.status]}>
              {statusLabel(sale.status)}
            </Badge>
          </div>
          <p className="text-sm text-secondary">
            {formatDateTime(sale.createdAt)} ·{" "}
            {sale.cashierName ?? "Cashier"} ·{" "}
            {paymentLabel(sale.paymentMethod)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/sales/${sale.id}/receipt`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-medium text-navy transition hover:border-accent hover:bg-accent-soft/40"
          >
            <Printer className="h-4 w-4" />
            Print receipt
          </Link>
          {canChangeStatus ? (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDialogAction("void")}
              >
                <Ban className="h-4 w-4" />
                Void
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => setDialogAction("refund")}
              >
                <RotateCcw className="h-4 w-4" />
                Refund
              </Button>
            </>
          ) : null}
        </div>
      </section>

      {sale.status !== "completed" && sale.statusReason ? (
        <div className="rounded-2xl border border-border bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">
            {statusLabel(sale.status)} reason: {sale.statusReason}
          </p>
          {sale.statusChangedAt ? (
            <p className="mt-1 text-amber-800/80">
              By {sale.statusChangedByName ?? "Manager"} on{" "}
              {formatDateTime(sale.statusChangedAt)}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Line items</CardTitle>
              <CardDescription>
                Products included in this transaction.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {sale.items.length === 0 ? (
              <EmptyState title="No line items" />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Product</TH>
                    <TH>Qty</TH>
                    <TH>Unit price</TH>
                    <TH className="text-right">Line total</TH>
                  </TR>
                </THead>
                <TBody>
                  {sale.items.map((item) => (
                    <TR key={item.id}>
                      <TD>
                        <p className="font-medium text-navy">
                          {item.productName}
                        </p>
                        <p className="text-xs text-secondary">
                          {item.sku} · {item.unit}
                        </p>
                      </TD>
                      <TD>{item.quantity}</TD>
                      <TD>{formatCurrency(item.unitPrice)}</TD>
                      <TD className="text-right font-medium text-navy">
                        {formatCurrency(item.lineTotal)}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Totals</CardTitle>
                <CardDescription>Server-calculated amounts.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between text-secondary">
                <span>Customer</span>
                <span className="text-navy">
                  {sale.customerName ?? "Walk-in"}
                </span>
              </div>
              <div className="flex justify-between text-secondary">
                <span>Subtotal</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              <div className="flex justify-between text-secondary">
                <span>Discount</span>
                <span>-{formatCurrency(sale.discount)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-navy">
                <span>Total</span>
                <span>{formatCurrency(sale.total)}</span>
              </div>
              {sale.cashReceived != null ? (
                <div className="flex justify-between text-secondary">
                  <span>Cash received</span>
                  <span>{formatCurrency(sale.cashReceived)}</span>
                </div>
              ) : null}
              {sale.changeAmount != null ? (
                <div className="flex justify-between text-secondary">
                  <span>Change</span>
                  <span>{formatCurrency(sale.changeAmount)}</span>
                </div>
              ) : null}
              {sale.notes ? (
                <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-secondary whitespace-pre-wrap">
                  {sale.notes}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Payments</CardTitle>
                <CardDescription>Recorded payment rows.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {sale.payments.length === 0 ? (
                <p className="text-secondary">No payments recorded.</p>
              ) : (
                sale.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-xl border border-border px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-navy">
                        {paymentLabel(payment.method)}
                      </p>
                      <p className="text-xs text-secondary">
                        {formatDateTime(payment.createdAt)}
                      </p>
                    </div>
                    <p className="font-medium text-navy">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Audit trail</CardTitle>
            <CardDescription>
              Immutable history of sale lifecycle events.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {sale.auditEvents.length === 0 ? (
            <EmptyState
              title="No audit events yet"
              description="New sales created after this update will log creation events automatically."
            />
          ) : (
            <ul className="space-y-3">
              {sale.auditEvents.map((event) => (
                <li
                  key={event.id}
                  className="rounded-xl border border-border px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-navy">
                        {auditLabel(event.action)}
                      </p>
                      {event.reason ? (
                        <p className="mt-1 text-sm text-secondary">
                          {event.reason}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right text-xs text-secondary">
                      <p>{event.createdByName ?? "System"}</p>
                      <p>{formatDateTime(event.createdAt)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {dialogAction ? (
        <SaleStatusDialog
          saleId={sale.id}
          receiptNumber={sale.receiptNumber}
          action={dialogAction}
          onClose={() => setDialogAction(null)}
        />
      ) : null}
    </div>
  );
}
