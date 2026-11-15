import Link from "next/link";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/format";
import type {
  PurchaseOrderListItem,
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

function statusLabel(status: PurchaseOrderStatus) {
  return status.replaceAll("_", " ");
}

type PoTableProps = {
  items: PurchaseOrderListItem[];
};

export function PoTable({ items }: PoTableProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No purchase orders"
        description="Create a purchase order to restock from your suppliers."
        action={
          <Link
            href="/purchase-orders/new"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            New purchase order
          </Link>
        }
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>PO #</TH>
          <TH>Supplier</TH>
          <TH>Order date</TH>
          <TH>Items</TH>
          <TH>Total</TH>
          <TH>Status</TH>
          <TH className="text-right">Actions</TH>
        </TR>
      </THead>
      <TBody>
        {items.map((po) => (
          <TR key={po.id}>
            <TD className="font-medium text-navy">
              <Link
                href={`/purchase-orders/${po.id}`}
                className="hover:text-primary hover:underline"
              >
                {po.poNumber}
              </Link>
            </TD>
            <TD>
              <p className="text-navy">{po.supplierName ?? "—"}</p>
              <p className="text-xs text-secondary">
                {po.createdByName ?? "Staff"}
              </p>
            </TD>
            <TD>{formatDate(po.orderDate)}</TD>
            <TD>{po.itemCount}</TD>
            <TD className="font-medium text-navy">
              {formatCurrency(po.totalAmount)}
            </TD>
            <TD>
              <Badge tone={statusTone[po.status]} className="capitalize">
                {statusLabel(po.status)}
              </Badge>
            </TD>
            <TD>
              <div className="flex justify-end">
                <Link
                  href={`/purchase-orders/${po.id}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-secondary transition hover:bg-accent-soft/60 hover:text-navy"
                  aria-label={`View ${po.poNumber}`}
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </div>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
