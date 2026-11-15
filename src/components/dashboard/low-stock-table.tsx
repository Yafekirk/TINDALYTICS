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
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { ProductStockRow } from "@/types/dashboard";

const statusTone = {
  "In Stock": "success",
  "Low Stock": "warning",
  "Out of Stock": "danger",
} as const;

type LowStockTableProps = {
  products: ProductStockRow[];
};

export function LowStockTable({ products }: LowStockTableProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Low Stock Products</CardTitle>
          <CardDescription>
            Items at or below the minimum stock level.
          </CardDescription>
        </div>
        <Link
          href="/inventory"
          className="text-sm font-medium text-primary transition-colors hover:text-navy"
        >
          Restock
        </Link>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <EmptyState
            title="Stock looks healthy"
            description="No products are currently below the minimum stock threshold."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Product</TH>
                <TH>Category</TH>
                <TH>Stock</TH>
                <TH>Min</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {products.map((product) => (
                <TR key={product.id}>
                  <TD>
                    <div>
                      <p className="font-medium text-navy">{product.name}</p>
                      <p className="text-xs text-secondary">{product.sku}</p>
                    </div>
                  </TD>
                  <TD>{product.category}</TD>
                  <TD className="font-medium text-navy">
                    {product.stock} {product.unit}
                  </TD>
                  <TD>
                    {product.minStock} {product.unit}
                  </TD>
                  <TD>
                    <Badge tone={statusTone[product.status]}>
                      {product.status}
                    </Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
