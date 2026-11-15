import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils/format";
import type { InventoryMovementRow } from "@/types/inventory";

type MovementsTableProps = {
  movements: InventoryMovementRow[];
};

const typeTone: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  stock_in: "success",
  stock_out: "warning",
  adjustment: "info",
  sale: "default",
  refund: "danger",
  purchase_receive: "success",
};

function labelType(type: string) {
  return type.replaceAll("_", " ");
}

export function MovementsTable({ movements }: MovementsTableProps) {
  if (movements.length === 0) {
    return (
      <EmptyState
        title="No movements yet"
        description="Stock-in, stock-out, adjustments, and sales will appear here."
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>When</TH>
          <TH>Product</TH>
          <TH>Type</TH>
          <TH>Qty change</TH>
          <TH>By</TH>
          <TH>Notes</TH>
        </TR>
      </THead>
      <TBody>
        {movements.map((movement) => (
          <TR key={movement.id}>
            <TD>{formatDateTime(movement.createdAt)}</TD>
            <TD>
              <p className="font-medium text-navy">{movement.productName}</p>
              <p className="text-xs text-secondary">{movement.sku}</p>
            </TD>
            <TD>
              <Badge tone={typeTone[movement.movementType] ?? "default"}>
                {labelType(movement.movementType)}
              </Badge>
            </TD>
            <TD className="font-medium text-navy">
              {movement.quantity > 0 ? "+" : ""}
              {movement.quantity} {movement.unit}
            </TD>
            <TD>{movement.createdByName ?? "System"}</TD>
            <TD className="max-w-[220px] truncate text-secondary">
              {movement.notes ?? "—"}
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
