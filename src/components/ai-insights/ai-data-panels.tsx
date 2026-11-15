import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { SimpleBarChart } from "@/components/charts/simple-bar-chart";
import { colors } from "@/config/brand";
import { formatCurrency } from "@/lib/utils/currency";
import { formatNumber } from "@/lib/utils/format";
import type { AiInsightsSnapshot } from "@/types/ai-insights";

type AiDataPanelsProps = {
  snapshot: AiInsightsSnapshot;
};

export function AiDataPanels({ snapshot }: AiDataPanelsProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Best sellers</CardTitle>
            <CardDescription>
              Live product sales from {snapshot.rangeLabel.toLowerCase()}.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {snapshot.bestSellers.length === 0 ? (
            <EmptyState
              title="No sales yet"
              description="Best-seller analysis needs completed transactions."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Product</TH>
                  <TH>Qty</TH>
                  <TH className="text-right">Revenue</TH>
                </TR>
              </THead>
              <TBody>
                {snapshot.bestSellers.map((row) => (
                  <TR key={row.sku}>
                    <TD>
                      <p className="font-medium text-navy">{row.name}</p>
                      <p className="text-xs text-secondary">{row.sku}</p>
                    </TD>
                    <TD>{formatNumber(row.quantitySold)}</TD>
                    <TD className="text-right">
                      {formatCurrency(row.revenue)}
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
            <CardTitle>Slow movers</CardTitle>
            <CardDescription>
              Stocked products with the weakest recent sales.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {snapshot.slowMoving.length === 0 ? (
            <EmptyState
              title="No slow movers"
              description="Inventory and sales history will appear here."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Product</TH>
                  <TH>Stock</TH>
                  <TH className="text-right">Sold</TH>
                </TR>
              </THead>
              <TBody>
                {snapshot.slowMoving.map((row) => (
                  <TR key={row.sku}>
                    <TD>
                      <p className="font-medium text-navy">{row.name}</p>
                      <p className="text-xs text-secondary">{row.sku}</p>
                    </TD>
                    <TD>{formatNumber(row.stock ?? 0)}</TD>
                    <TD className="text-right">
                      {formatNumber(row.quantitySold)}
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
            <CardTitle>Low stock alerts</CardTitle>
            <CardDescription>
              Products at or below minimum stock.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {snapshot.lowStock.length === 0 ? (
            <EmptyState
              title="Stock looks healthy"
              description="No products are currently below their minimum level."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Product</TH>
                  <TH>On hand</TH>
                  <TH className="text-right">Min</TH>
                </TR>
              </THead>
              <TBody>
                {snapshot.lowStock.map((row) => (
                  <TR key={row.sku}>
                    <TD>
                      <p className="font-medium text-navy">{row.name}</p>
                      <p className="text-xs text-secondary">{row.status}</p>
                    </TD>
                    <TD>{formatNumber(row.quantity)}</TD>
                    <TD className="text-right">
                      {formatNumber(row.minStockLevel)}
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
            <CardTitle>Average sales by weekday</CardTitle>
            <CardDescription>
              Based on daily sales in {snapshot.rangeLabel.toLowerCase()}.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {snapshot.weekdaySales.every((row) => row.averageSales === 0) ? (
            <EmptyState
              title="No weekday pattern yet"
              description="More daily sales are needed to compare weekdays."
            />
          ) : (
            <SimpleBarChart
              data={snapshot.weekdaySales.map((row) => ({
                label: row.weekday.slice(0, 3),
                value: row.averageSales,
                fill: colors.primary,
              }))}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
