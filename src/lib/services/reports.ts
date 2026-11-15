import { createClient } from "@/lib/supabase/server";
import {
  addManilaDays,
  formatManilaDate,
  getZonedParts,
  manilaDayKey,
  manilaMonthKey,
  startOfManilaDay,
} from "@/lib/utils/timezone";
import {
  getReportRange,
  getReportRangeDates,
} from "@/lib/utils/reports-range";
import type {
  CategorySalesRow,
  ExpenseCategoryRow,
  ExpenseReportRow,
  InventoryValuationRow,
  PaymentMethodRow,
  ProductSalesRow,
  ReportsData,
  ReportSummary,
  ReportTrendPoint,
  SlowMovingRow,
} from "@/types/reports";

function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function paymentLabel(method: string) {
  const normalized = method.toLowerCase();
  if (normalized === "cash") return "Cash";
  if (normalized === "gcash") return "GCash";
  return "Other";
}

function expenseCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    electricity: "Electricity",
    water: "Water",
    rent: "Rent",
    transportation: "Transportation",
    supplies: "Supplies",
    miscellaneous: "Miscellaneous",
  };
  return labels[category] ?? category;
}

function emptySummary(): ReportSummary {
  return {
    revenue: 0,
    transactions: 0,
    averageTicket: 0,
    grossProfit: 0,
    expenses: 0,
    netProfit: 0,
    cogs: 0,
    itemsSold: 0,
  };
}

function buildTrendBuckets(
  start: Date,
  end: Date,
): { points: ReportTrendPoint[]; mode: "day" | "month" } {
  const daySpan = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)),
  );

  if (daySpan > 62) {
    const points: ReportTrendPoint[] = [];
    const cursorParts = getZonedParts(start);
    let year = cursorParts.year;
    let month = cursorParts.month;
    const endParts = getZonedParts(addManilaDays(end, -1));

    while (
      year < endParts.year ||
      (year === endParts.year && month <= endParts.month)
    ) {
      const key = `${year}-${String(month).padStart(2, "0")}`;
      points.push({
        key,
        label: formatManilaDate(new Date(Date.UTC(year, month - 1, 15)), {
          month: "short",
          year: "2-digit",
        }),
        sales: 0,
        transactions: 0,
        profit: 0,
      });
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
    return { points, mode: "month" };
  }

  const points: ReportTrendPoint[] = [];
  let cursor = startOfManilaDay(start);
  while (cursor < end) {
    const key = manilaDayKey(cursor);
    points.push({
      key,
      label: formatManilaDate(cursor, {
        month: "short",
        day: "numeric",
      }),
      sales: 0,
      transactions: 0,
      profit: 0,
    });
    cursor = addManilaDays(cursor, 1);
  }
  return { points, mode: "day" };
}

export async function getReportsData(
  storeId: string,
  params: {
    preset?: string | null;
    from?: string | null;
    to?: string | null;
  } = {},
): Promise<ReportsData> {
  const supabase = await createClient();
  const range = getReportRange(params);
  const { start, end } = getReportRangeDates(range);

  const [
    salesResult,
    saleItemsResult,
    inventoryResult,
    expensesResult,
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("id, total, payment_method, status, created_at")
      .eq("store_id", storeId)
      .eq("status", "completed")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString()),
    supabase
      .from("sale_items")
      .select(
        `
        quantity, line_total, unit_price,
        product:products(
          id, name, sku, cost_price,
          category:categories(name)
        ),
        sale:sales!inner(id, status, created_at, store_id)
      `,
      )
      .eq("sale.store_id", storeId)
      .eq("sale.status", "completed")
      .gte("sale.created_at", start.toISOString())
      .lt("sale.created_at", end.toISOString()),
    supabase
      .from("inventory")
      .select(
        `
        quantity,
        product:products!inner(
          id, name, sku, unit, cost_price, selling_price, is_active, archived_at,
          category:categories(name)
        )
      `,
      )
      .eq("store_id", storeId),
    supabase
      .from("expenses")
      .select(
        "id, name, category, amount, expense_date, payment_method, status",
      )
      .eq("store_id", storeId)
      .eq("status", "active")
      .gte("expense_date", range.dateFrom)
      .lte("expense_date", range.dateTo)
      .order("expense_date", { ascending: false }),
  ]);

  if (salesResult.error) console.error("reports sales:", salesResult.error.message);
  if (saleItemsResult.error) {
    console.error("reports sale items:", saleItemsResult.error.message);
  }
  if (inventoryResult.error) {
    console.error("reports inventory:", inventoryResult.error.message);
  }
  if (expensesResult.error) {
    console.error("reports expenses:", expensesResult.error.message);
  }

  const sales = salesResult.data ?? [];
  const saleItems = saleItemsResult.data ?? [];
  const summary = emptySummary();
  summary.transactions = sales.length;
  summary.revenue = roundMoney(
    sales.reduce((sum, sale) => sum + toNumber(sale.total), 0),
  );
  summary.averageTicket =
    summary.transactions > 0
      ? roundMoney(summary.revenue / summary.transactions)
      : 0;

  const productMap = new Map<string, ProductSalesRow>();
  const categoryMap = new Map<string, CategorySalesRow>();
  const profitBySaleDay = new Map<string, number>();
  const { points: trend, mode } = buildTrendBuckets(start, end);
  const trendIndex = new Map(trend.map((point, index) => [point.key, index]));

  for (const sale of sales) {
    const createdAt = new Date(sale.created_at);
    const key =
      mode === "month" ? manilaMonthKey(createdAt) : manilaDayKey(createdAt);
    const index = trendIndex.get(key);
    if (index != null) {
      trend[index].sales = roundMoney(trend[index].sales + toNumber(sale.total));
      trend[index].transactions += 1;
    }
  }

  for (const row of saleItems) {
    const product = unwrapOne(
      row.product as
        | {
            id: string;
            name: string;
            sku: string;
            cost_price: number | string;
            category: { name: string } | { name: string }[] | null;
          }
        | {
            id: string;
            name: string;
            sku: string;
            cost_price: number | string;
            category: { name: string } | { name: string }[] | null;
          }[]
        | null,
    );
    const sale = unwrapOne(
      row.sale as
        | { id: string; created_at: string }
        | { id: string; created_at: string }[]
        | null,
    );
    if (!product || !sale) continue;

    const qty = toNumber(row.quantity);
    const revenue = toNumber(row.line_total);
    const cogs = roundMoney(qty * toNumber(product.cost_price));
    const profit = roundMoney(revenue - cogs);
    const categoryName = unwrapOne(product.category)?.name ?? "Uncategorized";

    summary.itemsSold += qty;
    summary.cogs = roundMoney(summary.cogs + cogs);
    summary.grossProfit = roundMoney(summary.grossProfit + profit);

    const existing = productMap.get(product.id);
    if (existing) {
      existing.quantitySold += qty;
      existing.revenue = roundMoney(existing.revenue + revenue);
      existing.cogs = roundMoney(existing.cogs + cogs);
      existing.grossProfit = roundMoney(existing.grossProfit + profit);
    } else {
      productMap.set(product.id, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        categoryName,
        quantitySold: qty,
        revenue,
        cogs,
        grossProfit: profit,
      });
    }

    const category = categoryMap.get(categoryName);
    if (category) {
      category.quantitySold += qty;
      category.revenue = roundMoney(category.revenue + revenue);
      category.grossProfit = roundMoney(category.grossProfit + profit);
    } else {
      categoryMap.set(categoryName, {
        categoryName,
        quantitySold: qty,
        revenue,
        grossProfit: profit,
      });
    }

    const dayKey =
      mode === "month"
        ? manilaMonthKey(new Date(sale.created_at))
        : manilaDayKey(new Date(sale.created_at));
    profitBySaleDay.set(
      dayKey,
      roundMoney((profitBySaleDay.get(dayKey) ?? 0) + profit),
    );
  }

  for (const point of trend) {
    point.profit = profitBySaleDay.get(point.key) ?? 0;
  }

  const productSales = [...productMap.values()].sort(
    (a, b) => b.revenue - a.revenue,
  );
  const bestSellers = productSales.slice(0, 10);

  const soldQtyByProduct = new Map(
    productSales.map((row) => [row.productId, row.quantitySold]),
  );

  const inventory: InventoryValuationRow[] = [];
  let inventoryCost = 0;
  let inventoryRetail = 0;

  for (const row of inventoryResult.data ?? []) {
    const product = unwrapOne(
      row.product as
        | {
            id: string;
            name: string;
            sku: string;
            unit: string;
            cost_price: number | string;
            selling_price: number | string;
            is_active: boolean;
            archived_at: string | null;
            category: { name: string } | { name: string }[] | null;
          }
        | {
            id: string;
            name: string;
            sku: string;
            unit: string;
            cost_price: number | string;
            selling_price: number | string;
            is_active: boolean;
            archived_at: string | null;
            category: { name: string } | { name: string }[] | null;
          }[]
        | null,
    );
    if (!product || product.archived_at || !product.is_active) continue;

    const quantity = toNumber(row.quantity);
    const costPrice = toNumber(product.cost_price);
    const sellingPrice = toNumber(product.selling_price);
    const costValue = roundMoney(quantity * costPrice);
    const retailValue = roundMoney(quantity * sellingPrice);
    inventoryCost = roundMoney(inventoryCost + costValue);
    inventoryRetail = roundMoney(inventoryRetail + retailValue);

    inventory.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      categoryName: unwrapOne(product.category)?.name ?? "Uncategorized",
      quantity,
      unit: product.unit,
      costPrice,
      sellingPrice,
      costValue,
      retailValue,
    });
  }

  inventory.sort((a, b) => b.costValue - a.costValue);

  const slowMoving: SlowMovingRow[] = inventory
    .map((item) => ({
      productId: item.productId,
      name: item.name,
      sku: item.sku,
      stock: item.quantity,
      quantitySold: soldQtyByProduct.get(item.productId) ?? 0,
      revenue:
        productMap.get(item.productId)?.revenue ?? 0,
    }))
    .filter((item) => item.stock > 0)
    .sort((a, b) => a.quantitySold - b.quantitySold || b.stock - a.stock)
    .slice(0, 10);

  const paymentTotals = new Map<string, { amount: number; transactions: number }>();
  for (const sale of sales) {
    const method = sale.payment_method || "other";
    const current = paymentTotals.get(method) ?? { amount: 0, transactions: 0 };
    current.amount = roundMoney(current.amount + toNumber(sale.total));
    current.transactions += 1;
    paymentTotals.set(method, current);
  }

  const paymentMethods: PaymentMethodRow[] = [...paymentTotals.entries()]
    .map(([method, value]) => ({
      method,
      label: paymentLabel(method),
      transactions: value.transactions,
      amount: value.amount,
      share:
        summary.revenue > 0
          ? roundMoney((value.amount / summary.revenue) * 100)
          : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const expenses: ExpenseReportRow[] = (expensesResult.data ?? []).map(
    (row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      amount: toNumber(row.amount),
      expenseDate: row.expense_date,
      paymentMethod: row.payment_method,
      status: row.status,
    }),
  );

  const expenseCategoryMap = new Map<string, ExpenseCategoryRow>();
  for (const expense of expenses) {
    summary.expenses = roundMoney(summary.expenses + expense.amount);
    const existing = expenseCategoryMap.get(expense.category);
    if (existing) {
      existing.amount = roundMoney(existing.amount + expense.amount);
      existing.count += 1;
    } else {
      expenseCategoryMap.set(expense.category, {
        category: expense.category,
        label: expenseCategoryLabel(expense.category),
        amount: expense.amount,
        count: 1,
      });
    }
  }

  summary.netProfit = roundMoney(summary.grossProfit - summary.expenses);

  const categorySales = [...categoryMap.values()].sort(
    (a, b) => b.revenue - a.revenue,
  );

  return {
    range,
    summary,
    trend,
    productSales,
    bestSellers,
    slowMoving,
    categorySales,
    paymentMethods,
    inventory,
    inventoryTotals: {
      costValue: inventoryCost,
      retailValue: inventoryRetail,
      skuCount: inventory.length,
    },
    expenses,
    expenseCategories: [...expenseCategoryMap.values()].sort(
      (a, b) => b.amount - a.amount,
    ),
    pnl: {
      revenue: summary.revenue,
      cogs: summary.cogs,
      grossProfit: summary.grossProfit,
      expenses: summary.expenses,
      netProfit: summary.netProfit,
      grossMargin:
        summary.revenue > 0
          ? roundMoney((summary.grossProfit / summary.revenue) * 100)
          : 0,
      netMargin:
        summary.revenue > 0
          ? roundMoney((summary.netProfit / summary.revenue) * 100)
          : 0,
    },
  };
}
