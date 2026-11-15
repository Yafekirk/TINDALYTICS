import Link from "next/link";
import { Eye, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateTime } from "@/lib/utils/format";
import type { SaleListItem, SaleStatus } from "@/types/sales";

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

type SalesTableProps = {
  items: SaleListItem[];
};

export function SalesTable({ items }: SalesTableProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No transactions found"
        description="Try adjusting filters or complete a sale from the POS."
        action={
          <Link
            href="/pos"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            Open POS
          </Link>
        }
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Receipt</TH>
          <TH>Customer</TH>
          <TH>Payment</TH>
          <TH>Items</TH>
          <TH>Total</TH>
          <TH>Status</TH>
          <TH>Date</TH>
          <TH className="text-right">Actions</TH>
        </TR>
      </THead>
      <TBody>
        {items.map((sale) => (
          <TR key={sale.id}>
            <TD className="font-medium text-navy">
              <Link
                href={`/sales/${sale.id}`}
                className="hover:text-primary hover:underline"
              >
                {sale.receiptNumber}
              </Link>
            </TD>
            <TD>
              <div>
                <p className="font-medium text-navy">
                  {sale.customerName ?? "Walk-in"}
                </p>
                <p className="text-xs text-secondary">
                  {sale.cashierName ?? "Cashier"}
                </p>
              </div>
            </TD>
            <TD>{paymentLabel(sale.paymentMethod)}</TD>
            <TD>{sale.itemCount}</TD>
            <TD className="font-medium text-navy">
              {formatCurrency(sale.total)}
            </TD>
            <TD>
              <Badge tone={statusTone[sale.status]}>
                {statusLabel(sale.status)}
              </Badge>
            </TD>
            <TD>{formatDateTime(sale.createdAt)}</TD>
            <TD>
              <div className="flex justify-end gap-1">
                <Link
                  href={`/sales/${sale.id}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-secondary transition hover:bg-accent-soft/60 hover:text-navy"
                  aria-label={`View ${sale.receiptNumber}`}
                >
                  <Eye className="h-4 w-4" />
                </Link>
                <Link
                  href={`/sales/${sale.id}/receipt`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-secondary transition hover:bg-accent-soft/60 hover:text-navy"
                  aria-label={`Print receipt ${sale.receiptNumber}`}
                >
                  <Printer className="h-4 w-4" />
                </Link>
              </div>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
