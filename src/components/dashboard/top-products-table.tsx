import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils/currency";
import type { TopProductRow } from "@/types/dashboard";

type TopProductsTableProps = {
  products: TopProductRow[];
};

export function TopProductsTable({ products }: TopProductsTableProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Top Selling Products</CardTitle>
          <CardDescription>Best performers for the selected period.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <EmptyState
            title="No sales data"
            description="Top sellers will show once transactions are recorded."
          />
        ) : (
          <ul className="space-y-3">
            {products.map((product, index) => (
              <li
                key={product.id}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-accent-soft/25 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-navy">
                      {product.name}
                    </p>
                    <p className="text-xs text-secondary">
                      {product.unitsSold} units sold
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-navy">
                  {formatCurrency(product.revenue)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
