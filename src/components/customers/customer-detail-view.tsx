import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
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
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import type { CustomerDetail } from "@/types/customer";

type CustomerDetailViewProps = {
  customer: CustomerDetail;
};

function paymentLabel(method: string) {
  if (method === "cash") return "Cash";
  if (method === "gcash") return "GCash";
  return "Other";
}

export function CustomerDetailView({ customer }: CustomerDetailViewProps) {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to customers
          </Link>
          <h2 className="text-xl font-semibold text-navy">{customer.name}</h2>
          <p className="text-sm text-secondary">
            {customer.contactNumber ?? "No contact number"}
            {customer.address ? ` · ${customer.address}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/customers/${customer.id}/edit`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-medium text-navy transition hover:border-accent hover:bg-accent-soft/40"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
          <Link
            href={`/credits/new?customerId=${customer.id}`}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            Add utang
          </Link>
          <Link
            href={`/credits?customerId=${customer.id}&status=all`}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-navy transition hover:border-accent hover:bg-accent-soft/40"
          >
            View utang
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-secondary">Purchases</p>
            <p className="mt-2 text-xl font-semibold text-navy">
              {customer.purchaseCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-secondary">Total spent</p>
            <p className="mt-2 text-xl font-semibold text-navy">
              {formatCurrency(customer.totalSpent)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-secondary">Outstanding balance</p>
            <p className="mt-2 text-xl font-semibold text-navy">
              {formatCurrency(customer.outstandingBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {customer.notes ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Internal customer notes.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-secondary whitespace-pre-wrap">
              {customer.notes}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Purchase history</CardTitle>
              <CardDescription>Sales linked to this customer.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {customer.sales.length === 0 ? (
              <EmptyState
                title="No purchases yet"
                description="Attach this customer during POS checkout to track history."
              />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Receipt</TH>
                    <TH>Status</TH>
                    <TH>Payment</TH>
                    <TH className="text-right">Total</TH>
                  </TR>
                </THead>
                <TBody>
                  {customer.sales.map((sale) => (
                    <TR key={sale.id}>
                      <TD>
                        <Link
                          href={`/sales/${sale.id}`}
                          className="font-medium text-navy hover:text-primary hover:underline"
                        >
                          {sale.receiptNumber}
                        </Link>
                        <p className="text-xs text-secondary">
                          {formatDateTime(sale.createdAt)}
                        </p>
                      </TD>
                      <TD>
                        <Badge
                          tone={
                            sale.status === "completed"
                              ? "success"
                              : sale.status === "voided"
                                ? "warning"
                                : "danger"
                          }
                          className="capitalize"
                        >
                          {sale.status}
                        </Badge>
                      </TD>
                      <TD>{paymentLabel(sale.paymentMethod)}</TD>
                      <TD className="text-right">
                        {formatCurrency(sale.total)}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Credit / utang</CardTitle>
              <CardDescription>
                Outstanding and historical credit records.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {customer.credits.length === 0 ? (
              <EmptyState
                title="No credit records"
                description="Create an utang record when this customer buys on credit."
                action={
                  <Link
                    href={`/credits/new?customerId=${customer.id}`}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover"
                  >
                    Add utang
                  </Link>
                }
              />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Status</TH>
                    <TH>Due</TH>
                    <TH>Amount</TH>
                    <TH className="text-right">Balance</TH>
                  </TR>
                </THead>
                <TBody>
                  {customer.credits.map((credit) => (
                    <TR key={credit.id}>
                      <TD>
                        <Link
                          href={`/credits/${credit.id}`}
                          className="capitalize font-medium text-navy hover:text-primary hover:underline"
                        >
                          {credit.status}
                        </Link>
                      </TD>
                      <TD>
                        {credit.dueDate ? formatDate(credit.dueDate) : "—"}
                      </TD>
                      <TD>{formatCurrency(credit.amount)}</TD>
                      <TD className="text-right font-medium text-navy">
                        <Link
                          href={`/credits/${credit.id}`}
                          className="hover:text-primary hover:underline"
                        >
                          {formatCurrency(credit.balance)}
                        </Link>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
