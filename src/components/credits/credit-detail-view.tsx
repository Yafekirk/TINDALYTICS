import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreditPaymentForm } from "@/components/credits/credit-payment-form";
import { CreditVoidButton } from "@/components/credits/credit-void-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  creditStatusLabel,
  paymentMethodLabel,
} from "@/lib/validations/credit";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import type { CreditDetail, CreditStatus } from "@/types/credit";

const statusTone: Record<
  CreditStatus,
  "success" | "warning" | "danger" | "default" | "info"
> = {
  open: "warning",
  partial: "info",
  paid: "success",
  voided: "default",
};

type CreditDetailViewProps = {
  credit: CreditDetail;
  canVoid: boolean;
};

export function CreditDetailView({ credit, canVoid }: CreditDetailViewProps) {
  const canPay =
    credit.status === "open" || credit.status === "partial";

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Link
            href="/credits"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to credits
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-navy">
              {credit.customerName}
            </h2>
            <Badge tone={statusTone[credit.status]}>
              {creditStatusLabel(credit.status)}
            </Badge>
            {credit.isOverdue ? <Badge tone="danger">Overdue</Badge> : null}
          </div>
          <p className="text-sm text-secondary">
            {credit.customerContact ?? "No contact number"}
            {credit.saleReceiptNumber
              ? ` · Sale ${credit.saleReceiptNumber}`
              : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/customers/${credit.customerId}`}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-navy transition hover:border-accent hover:bg-accent-soft/40"
          >
            View customer
          </Link>
          {canVoid && canPay ? <CreditVoidButton creditId={credit.id} /> : null}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-secondary">Original amount</p>
            <p className="mt-2 text-xl font-semibold text-navy">
              {formatCurrency(credit.amount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-secondary">Amount paid</p>
            <p className="mt-2 text-xl font-semibold text-navy">
              {formatCurrency(credit.amountPaid)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-secondary">Outstanding balance</p>
            <p className="mt-2 text-xl font-semibold text-navy">
              {formatCurrency(credit.balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Credit details</CardTitle>
              <CardDescription>
                Utang record for this customer.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-secondary">Due date</span>
              <span>
                {credit.dueDate ? formatDate(credit.dueDate) : "No due date"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Created</span>
              <span>{formatDateTime(credit.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Updated</span>
              <span>{formatDateTime(credit.updatedAt)}</span>
            </div>
            {credit.saleId ? (
              <div className="flex justify-between">
                <span className="text-secondary">Linked sale</span>
                <Link
                  href={`/sales/${credit.saleId}`}
                  className="font-medium text-navy hover:text-primary hover:underline"
                >
                  {credit.saleReceiptNumber ?? "View sale"}
                </Link>
              </div>
            ) : null}
            {credit.notes ? (
              <p className="rounded-xl bg-slate-50 px-3 py-2 text-secondary whitespace-pre-wrap">
                {credit.notes}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Record payment</CardTitle>
              <CardDescription>
                Full or partial bayad against this utang.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {canPay ? (
              <CreditPaymentForm
                creditId={credit.id}
                balance={credit.balance}
              />
            ) : (
              <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-secondary">
                This credit is {creditStatusLabel(credit.status).toLowerCase()}
                and no longer accepts payments.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Payment history</CardTitle>
            <CardDescription>
              All payments recorded against this credit.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {credit.payments.length === 0 ? (
            <EmptyState
              title="No payments yet"
              description="Record a partial or full payment to start the history."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Date</TH>
                  <TH>Method</TH>
                  <TH>Recorded by</TH>
                  <TH className="text-right">Amount</TH>
                </TR>
              </THead>
              <TBody>
                {credit.payments.map((payment) => (
                  <TR key={payment.id}>
                    <TD>
                      <p className="font-medium text-navy">
                        {formatDateTime(payment.paidAt)}
                      </p>
                      {payment.notes ? (
                        <p className="mt-0.5 text-xs text-secondary">
                          {payment.notes}
                        </p>
                      ) : null}
                    </TD>
                    <TD>{paymentMethodLabel(payment.paymentMethod)}</TD>
                    <TD>{payment.createdByName ?? "Staff"}</TD>
                    <TD className="text-right font-medium text-navy">
                      {formatCurrency(payment.amount)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
