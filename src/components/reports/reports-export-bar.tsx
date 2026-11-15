"use client";

import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadCsv, toCsv } from "@/lib/utils/csv";
import { reportTypeLabel } from "@/lib/utils/reports-range";
import type { ReportType, ReportsData } from "@/types/reports";

type ReportsExportBarProps = {
  type: ReportType;
  data: ReportsData;
};

function buildCsv(type: ReportType, data: ReportsData) {
  switch (type) {
    case "products":
      return toCsv(
        [
          "Product",
          "SKU",
          "Category",
          "Qty Sold",
          "Revenue",
          "COGS",
          "Gross Profit",
        ],
        data.productSales.map((row) => [
          row.name,
          row.sku,
          row.categoryName,
          row.quantitySold,
          row.revenue,
          row.cogs,
          row.grossProfit,
        ]),
      );
    case "categories":
      return toCsv(
        ["Category", "Qty Sold", "Revenue", "Gross Profit"],
        data.categorySales.map((row) => [
          row.categoryName,
          row.quantitySold,
          row.revenue,
          row.grossProfit,
        ]),
      );
    case "payments":
      return toCsv(
        ["Payment Method", "Transactions", "Amount", "Share %"],
        data.paymentMethods.map((row) => [
          row.label,
          row.transactions,
          row.amount,
          row.share,
        ]),
      );
    case "inventory":
      return toCsv(
        [
          "Product",
          "SKU",
          "Category",
          "Qty",
          "Unit",
          "Cost",
          "Retail",
          "Cost Value",
          "Retail Value",
        ],
        data.inventory.map((row) => [
          row.name,
          row.sku,
          row.categoryName,
          row.quantity,
          row.unit,
          row.costPrice,
          row.sellingPrice,
          row.costValue,
          row.retailValue,
        ]),
      );
    case "expenses":
      return toCsv(
        ["Date", "Name", "Category", "Amount", "Payment", "Status"],
        data.expenses.map((row) => [
          row.expenseDate,
          row.name,
          row.category,
          row.amount,
          row.paymentMethod,
          row.status,
        ]),
      );
    case "pnl":
      return toCsv(
        ["Metric", "Amount"],
        [
          ["Revenue", data.pnl.revenue],
          ["COGS", data.pnl.cogs],
          ["Gross Profit", data.pnl.grossProfit],
          ["Expenses", data.pnl.expenses],
          ["Net Profit", data.pnl.netProfit],
          ["Gross Margin %", data.pnl.grossMargin],
          ["Net Margin %", data.pnl.netMargin],
        ],
      );
    default:
      return toCsv(
        ["Period", "Sales", "Transactions", "Gross Profit"],
        data.trend.map((row) => [
          row.label,
          row.sales,
          row.transactions,
          row.profit,
        ]),
      );
  }
}

export function ReportsExportBar({ type, data }: ReportsExportBarProps) {
  function handleExport() {
    const csv = buildCsv(type, data);
    const filename = `tindalytics-${type}-${data.range.dateFrom}-to-${data.range.dateTo}.csv`;
    downloadCsv(filename, csv);
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button type="button" variant="secondary" onClick={handleExport}>
        <Download className="h-4 w-4" />
        Export CSV
      </Button>
      <Button type="button" variant="secondary" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        Print {reportTypeLabel(type)}
      </Button>
    </div>
  );
}
