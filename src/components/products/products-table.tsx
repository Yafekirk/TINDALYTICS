import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/currency";
import type { ProductListItem } from "@/types/product";

type ProductsTableProps = {
  products: ProductListItem[];
};

function stockTone(product: ProductListItem) {
  if (product.stock <= 0) return "danger" as const;
  if (product.stock <= product.minStockLevel) return "warning" as const;
  return "success" as const;
}

export function ProductsTable({ products }: ProductsTableProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="No products found"
        description="Try adjusting filters, or add your first product to get started."
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Product</TH>
          <TH>SKU</TH>
          <TH>Category</TH>
          <TH>Cost</TH>
          <TH>Price</TH>
          <TH>Stock</TH>
          <TH>Status</TH>
        </TR>
      </THead>
      <TBody>
        {products.map((product) => (
          <TR key={product.id}>
            <TD>
              <Link
                href={`/products/${product.id}`}
                className="flex items-center gap-3 transition hover:opacity-90"
              >
                <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-border bg-page">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-secondary">
                      N/A
                    </span>
                  )}
                </span>
                <span>
                  <span className="block font-medium text-navy">
                    {product.name}
                  </span>
                  <span className="block text-xs text-secondary">
                    {product.unit}
                    {product.barcode ? ` · ${product.barcode}` : ""}
                  </span>
                </span>
              </Link>
            </TD>
            <TD className="font-medium text-navy">{product.sku}</TD>
            <TD>{product.categoryName ?? "—"}</TD>
            <TD>{formatCurrency(product.costPrice)}</TD>
            <TD className="font-medium text-navy">
              {formatCurrency(product.sellingPrice)}
            </TD>
            <TD>
              <Badge tone={stockTone(product)}>
                {product.stock} {product.unit}
              </Badge>
            </TD>
            <TD>
              {product.archivedAt ? (
                <Badge tone="warning">Archived</Badge>
              ) : product.isActive ? (
                <Badge tone="success">Active</Badge>
              ) : (
                <Badge tone="default">Inactive</Badge>
              )}
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
