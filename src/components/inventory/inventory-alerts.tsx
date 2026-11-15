import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { InventoryRow } from "@/types/inventory";

type InventoryAlertsProps = {
  items: InventoryRow[];
};

export function InventoryAlerts({ items }: InventoryAlertsProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Stock alerts</CardTitle>
          <CardDescription>
            Low and out-of-stock products that need restocking.
          </CardDescription>
        </div>
        <Link
          href="/inventory?status=low_stock"
          className="text-sm font-medium text-primary hover:text-navy"
        >
          View low stock
        </Link>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            title="Stock looks healthy"
            description="No low or out-of-stock products right now."
          />
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.productId}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-navy">{item.name}</p>
                  <p className="text-xs text-secondary">
                    {item.quantity} {item.unit} on hand · min {item.minStockLevel}
                  </p>
                </div>
                <Badge
                  tone={item.status === "Out of Stock" ? "danger" : "warning"}
                >
                  {item.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
