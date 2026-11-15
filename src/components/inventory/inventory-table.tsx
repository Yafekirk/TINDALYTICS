import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/currency";
import type { InventoryRow } from "@/types/inventory";
import { StockActionButtons } from "@/components/inventory/stock-action-buttons";

type InventoryTableProps = {
  items: InventoryRow[];
  canManage: boolean;
};

const statusTone = {
  "In Stock": "success",
  "Low Stock": "warning",
  "Out of Stock": "danger",
} as const;

export function InventoryTable({ items, canManage }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No inventory rows"
        description="Add products first, or adjust filters to see stock levels."
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Product</TH>
          <TH>Category</TH>
          <TH>On hand</TH>
          <TH>Min</TH>
          <TH>Value</TH>
          <TH>Status</TH>
          {canManage ? <TH>Actions</TH> : null}
        </TR>
      </THead>
      <TBody>
        {items.map((item) => (
          <TR key={item.productId}>
            <TD>
              <Link
                href={`/products/${item.productId}`}
                className="transition hover:opacity-80"
              >
                <p className="font-medium text-navy">{item.name}</p>
                <p className="text-xs text-secondary">{item.sku}</p>
              </Link>
            </TD>
            <TD>{item.categoryName ?? "—"}</TD>
            <TD className="font-medium text-navy">
              {item.quantity} {item.unit}
            </TD>
            <TD>
              {item.minStockLevel} {item.unit}
            </TD>
            <TD>{formatCurrency(item.valueAtCost)}</TD>
            <TD>
              <Badge tone={statusTone[item.status]}>{item.status}</Badge>
            </TD>
            {canManage ? (
              <TD>
                <StockActionButtons item={item} />
              </TD>
            ) : null}
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
