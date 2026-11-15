"use client";

import { SalesOverviewChart } from "@/components/charts/sales-overview-chart";
import { SimpleBarChart } from "@/components/charts/simple-bar-chart";
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
import { colors } from "@/config/brand";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate, formatNumber } from "@/lib/utils/format";
import type { ReportType, ReportsData } from "@/types/reports";

const reportChartColors = [
  colors.navy,
  colors.primary,
  colors.accent,
  "#3A7AB5",
  colors.info,
  "#5B7C99",
  colors.warning,
];

type ReportsContentProps = {
  type: ReportType;
  data: ReportsData;
};

export function ReportsContent({ type, data }: ReportsContentProps) {
  if (type === "overview") {
    return (
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Sales trend</CardTitle>
              <CardDescription>
                Completed sales for {data.range.label}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {data.trend.some((point) => point.sales > 0) ? (
              <SalesOverviewChart
                data={data.trend.map((point) => ({
                  label: point.label,
                  sales: point.sales,
                  transactions: point.transactions,
                }))}
              />
            ) : (
              <EmptyState
                title="No sales in this period"
                description="Completed transactions will appear here once recorded."
              />
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Best sellers</CardTitle>
              <CardDescription>Top products by revenue</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {data.bestSellers.length === 0 ? (
              <EmptyState title="No product sales yet" />
            ) : (
              <ul className="space-y-3">
                {data.bestSellers.slice(0, 6).map((item, index) => (
                  <li
                    key={item.productId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-navy">
                        {index + 1}. {item.name}
                      </p>
                      <p className="text-xs text-secondary">
                        {formatNumber(item.quantitySold)} sold
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-navy">
                      {formatCurrency(item.revenue)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (type === "products") {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Best selling products</CardTitle>
                <CardDescription>Highest revenue in range</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {data.bestSellers.length === 0 ? (
                <EmptyState title="No sales data" />
              ) : (
                <SimpleBarChart
                  data={data.bestSellers.slice(0, 8).map((row, index) => ({
                    label: row.name.slice(0, 12),
                    value: row.revenue,
                    fill: reportChartColors[index % reportChartColors.length],
                  }))}
                  valueLabel="Revenue"
                />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Slow moving products</CardTitle>
                <CardDescription>
                  In-stock items with the lowest sales in this period
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {data.slowMoving.length === 0 ? (
                <EmptyState title="No inventory to analyze" />
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Product</TH>
                      <TH>Stock</TH>
                      <TH>Sold</TH>
                      <TH className="text-right">Revenue</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {data.slowMoving.map((row) => (
                      <TR key={row.productId}>
                        <TD>
                          <p className="font-medium text-navy">{row.name}</p>
                          <p className="text-xs text-secondary">{row.sku}</p>
                        </TD>
                        <TD>{row.stock}</TD>
                        <TD>{row.quantitySold}</TD>
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
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Sales by product</CardTitle>
              <CardDescription>
                All products with completed sales in {data.range.label}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {data.productSales.length === 0 ? (
              <EmptyState title="No product sales in this period" />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Product</TH>
                    <TH>Category</TH>
                    <TH>Qty</TH>
                    <TH>Revenue</TH>
                    <TH>COGS</TH>
                    <TH className="text-right">Gross profit</TH>
                  </TR>
                </THead>
                <TBody>
                  {data.productSales.map((row) => (
                    <TR key={row.productId}>
                      <TD>
                        <p className="font-medium text-navy">{row.name}</p>
                        <p className="text-xs text-secondary">{row.sku}</p>
                      </TD>
                      <TD>{row.categoryName ?? "—"}</TD>
                      <TD>{row.quantitySold}</TD>
                      <TD>{formatCurrency(row.revenue)}</TD>
                      <TD>{formatCurrency(row.cogs)}</TD>
                      <TD className="text-right font-medium text-navy">
                        {formatCurrency(row.grossProfit)}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (type === "categories") {
    return (
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Category mix</CardTitle>
              <CardDescription>Revenue by category</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {data.categorySales.length === 0 ? (
              <EmptyState title="No category sales" />
            ) : (
              <SimpleBarChart
                data={data.categorySales.map((row, index) => ({
                  label: row.categoryName,
                  value: row.revenue,
                  fill: reportChartColors[index % reportChartColors.length],
                }))}
              />
            )}
          </CardContent>
        </Card>
        <Card className="xl:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Sales by category</CardTitle>
              <CardDescription>{data.range.label}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {data.categorySales.length === 0 ? (
              <EmptyState title="No category sales in this period" />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Category</TH>
                    <TH>Qty sold</TH>
                    <TH>Revenue</TH>
                    <TH className="text-right">Gross profit</TH>
                  </TR>
                </THead>
                <TBody>
                  {data.categorySales.map((row) => (
                    <TR key={row.categoryName}>
                      <TD className="font-medium text-navy">
                        {row.categoryName}
                      </TD>
                      <TD>{row.quantitySold}</TD>
                      <TD>{formatCurrency(row.revenue)}</TD>
                      <TD className="text-right">
                        {formatCurrency(row.grossProfit)}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (type === "payments") {
    return (
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Payment mix</CardTitle>
              <CardDescription>Completed sales by method</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {data.paymentMethods.length === 0 ? (
              <EmptyState title="No payments in this period" />
            ) : (
              <SimpleBarChart
                data={data.paymentMethods.map((row, index) => ({
                  label: row.label,
                  value: row.amount,
                  fill: reportChartColors[index % reportChartColors.length],
                }))}
              />
            )}
          </CardContent>
        </Card>
        <Card className="xl:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Payment method report</CardTitle>
              <CardDescription>{data.range.label}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {data.paymentMethods.length === 0 ? (
              <EmptyState title="No payment data" />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Method</TH>
                    <TH>Transactions</TH>
                    <TH>Amount</TH>
                    <TH className="text-right">Share</TH>
                  </TR>
                </THead>
                <TBody>
                  {data.paymentMethods.map((row) => (
                    <TR key={row.method}>
                      <TD className="font-medium text-navy">{row.label}</TD>
                      <TD>{row.transactions}</TD>
                      <TD>{formatCurrency(row.amount)}</TD>
                      <TD className="text-right">{row.share}%</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (type === "inventory") {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-secondary">Inventory cost value</p>
              <p className="mt-2 text-xl font-semibold text-navy">
                {formatCurrency(data.inventoryTotals.costValue)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-secondary">Retail value</p>
              <p className="mt-2 text-xl font-semibold text-navy">
                {formatCurrency(data.inventoryTotals.retailValue)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-secondary">Active SKUs</p>
              <p className="mt-2 text-xl font-semibold text-navy">
                {formatNumber(data.inventoryTotals.skuCount)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Inventory valuation</CardTitle>
              <CardDescription>
                Current on-hand stock valued at cost and retail
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {data.inventory.length === 0 ? (
              <EmptyState title="No inventory records" />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Product</TH>
                    <TH>Qty</TH>
                    <TH>Cost</TH>
                    <TH>Retail</TH>
                    <TH>Cost value</TH>
                    <TH className="text-right">Retail value</TH>
                  </TR>
                </THead>
                <TBody>
                  {data.inventory.map((row) => (
                    <TR key={row.productId}>
                      <TD>
                        <p className="font-medium text-navy">{row.name}</p>
                        <p className="text-xs text-secondary">
                          {row.sku} · {row.categoryName}
                        </p>
                      </TD>
                      <TD>
                        {row.quantity} {row.unit}
                      </TD>
                      <TD>{formatCurrency(row.costPrice)}</TD>
                      <TD>{formatCurrency(row.sellingPrice)}</TD>
                      <TD>{formatCurrency(row.costValue)}</TD>
                      <TD className="text-right font-medium text-navy">
                        {formatCurrency(row.retailValue)}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (type === "expenses") {
    return (
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Expenses by category</CardTitle>
              <CardDescription>{data.range.label}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {data.expenseCategories.length === 0 ? (
              <EmptyState
                title="No expenses yet"
                description="Expense tracking UI arrives in Phase 10. Records already in the database will show here."
              />
            ) : (
              <SimpleBarChart
                data={data.expenseCategories.map((row, index) => ({
                  label: row.label,
                  value: row.amount,
                  fill: reportChartColors[index % reportChartColors.length],
                }))}
              />
            )}
          </CardContent>
        </Card>
        <Card className="xl:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Expense details</CardTitle>
              <CardDescription>
                Active expenses only (voided/archived excluded)
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {data.expenses.length === 0 ? (
              <EmptyState title="No expenses in this period" />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Date</TH>
                    <TH>Expense</TH>
                    <TH>Category</TH>
                    <TH>Payment</TH>
                    <TH className="text-right">Amount</TH>
                  </TR>
                </THead>
                <TBody>
                  {data.expenses.map((row) => (
                    <TR key={row.id}>
                      <TD>{formatDate(row.expenseDate)}</TD>
                      <TD className="font-medium text-navy">{row.name}</TD>
                      <TD className="capitalize">{row.category}</TD>
                      <TD className="capitalize">{row.paymentMethod}</TD>
                      <TD className="text-right">
                        {formatCurrency(row.amount)}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // P&L
  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <Card className="xl:col-span-2">
        <CardHeader>
          <div>
            <CardTitle>Profit &amp; loss</CardTitle>
            <CardDescription>
              Revenue, gross profit, expenses, and net profit
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-secondary">Revenue</span>
            <span className="font-medium text-navy">
              {formatCurrency(data.pnl.revenue)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">Cost of goods sold</span>
            <span>-{formatCurrency(data.pnl.cogs)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-semibold text-navy">
            <span>Gross profit</span>
            <span>{formatCurrency(data.pnl.grossProfit)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">Operating expenses</span>
            <span>-{formatCurrency(data.pnl.expenses)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-navy">
            <span>Net profit</span>
            <span>{formatCurrency(data.pnl.netProfit)}</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge tone="info">Gross margin {data.pnl.grossMargin}%</Badge>
            <Badge tone={data.pnl.netProfit >= 0 ? "success" : "danger"}>
              Net margin {data.pnl.netMargin}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="xl:col-span-3">
        <CardHeader>
          <div>
            <CardTitle>P&amp;L composition</CardTitle>
            <CardDescription>{data.range.label}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <SimpleBarChart
            data={[
              {
                label: "Revenue",
                value: data.pnl.revenue,
                fill: reportChartColors[0],
              },
              {
                label: "COGS",
                value: data.pnl.cogs,
                fill: reportChartColors[4],
              },
              {
                label: "Gross profit",
                value: data.pnl.grossProfit,
                fill: reportChartColors[1],
              },
              {
                label: "Expenses",
                value: data.pnl.expenses,
                fill: reportChartColors[6],
              },
              {
                label: "Net profit",
                value: Math.max(data.pnl.netProfit, 0),
                fill: reportChartColors[2],
              },
            ]}
          />
          {data.pnl.netProfit < 0 ? (
            <p className="mt-3 text-sm text-danger">
              Net loss of {formatCurrency(Math.abs(data.pnl.netProfit))} for
              this period.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
