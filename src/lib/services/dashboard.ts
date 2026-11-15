import { colors } from "@/config/brand";
import { createClient } from "@/lib/supabase/server";
import {
  addManilaDays,
  formatManilaDate,
  getPeriodBounds,
  getZonedParts,
  manilaDayKey,
  manilaMonthKey,
  resolveDashboardPeriod,
  startOfManilaDay,
  type DashboardPeriod,
} from "@/lib/utils/timezone";
import type {
  CategorySales,
  DashboardData,
  KpiMetric,
  ProductStockRow,
  SalesPoint,
  TopProductRow,
  TransactionRow,
} from "@/types/dashboard";

const CATEGORY_COLORS = [
  colors.navy,
  colors.primary,
  colors.accent,
  "#3A7AB5",
  colors.info,
  "#5B7C99",
];

type SaleRow = {
  id: string;
  receipt_number: string;
  total: number | string;
  payment_method: string;
  status: string;
  created_at: string;
  customer: { name: string } | { name: string }[] | null;
  cashier: { full_name: string } | { full_name: string }[] | null;
  sale_items: { id: string }[] | null;
};

type InventoryProduct = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  min_stock_level: number | string;
  cost_price: number | string;
  is_active: boolean;
  archived_at: string | null;
  category: { name: string } | { name: string }[] | null;
};

type InventoryJoin = {
  quantity: number | string;
  product: InventoryProduct | InventoryProduct[] | null;
};

type SaleJoin = {
  id: string;
  status: string;
  created_at: string;
};

type SaleItemProduct = {
  id: string;
  name: string;
  cost_price: number | string;
  category: { name: string } | { name: string }[] | null;
};

type SaleItemJoin = {
  quantity: number | string;
  line_total: number | string;
  product: SaleItemProduct | SaleItemProduct[] | null;
  sale: SaleJoin | SaleJoin[] | null;
};

function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapPaymentMethod(method: string): TransactionRow["paymentMethod"] {
  const normalized = method.toLowerCase();
  if (normalized === "cash") return "Cash";
  if (normalized === "gcash") return "GCash";
  return "Other";
}

function mapStatus(status: string): TransactionRow["status"] {
  if (status === "voided") return "Voided";
  if (status === "refunded") return "Refunded";
  return "Completed";
}

function stockStatus(quantity: number, minStock: number): ProductStockRow["status"] {
  if (quantity <= 0) return "Out of Stock";
  if (quantity <= minStock) return "Low Stock";
  return "In Stock";
}

function salesLabel(period: DashboardPeriod): string {
  if (period === "7d") return "Period Sales";
  if (period === "30d") return "Period Sales";
  return "Today's Sales";
}

function transactionsLabel(period: DashboardPeriod): string {
  if (period === "7d") return "Period Transactions";
  if (period === "30d") return "Period Transactions";
  return "Today's Transactions";
}

function profitLabel(period: DashboardPeriod): string {
  if (period === "today") return "Estimated Gross Profit";
  return "Estimated Gross Profit";
}

function emptySalesPoints(labels: string[]): SalesPoint[] {
  return labels.map((label) => ({ label, sales: 0, transactions: 0 }));
}

function buildDailyBuckets(): SalesPoint[] {
  const hours = [8, 10, 12, 14, 16, 18, 20];
  return hours.map((hour) => ({
    label: hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`,
    sales: 0,
    transactions: 0,
  }));
}

function buildWeeklyBuckets(now: Date): { points: SalesPoint[]; dayKeys: string[] } {
  const todayStart = startOfManilaDay(now);
  const dayKeys: string[] = [];
  const points: SalesPoint[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = addManilaDays(todayStart, -offset);
    dayKeys.push(manilaDayKey(day));
    points.push({
      label: formatManilaDate(day, { weekday: "short" }),
      sales: 0,
      transactions: 0,
    });
  }

  return { points, dayKeys };
}

function buildMonthlyBuckets(now: Date): {
  points: SalesPoint[];
  monthKeys: string[];
} {
  const parts = getZonedParts(now);
  const points: SalesPoint[] = [];
  const monthKeys: string[] = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const cursor = new Date(Date.UTC(parts.year, parts.month - 1 - offset, 1));
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    monthKeys.push(key);
    points.push({
      label: formatManilaDate(new Date(Date.UTC(year, month - 1, 15)), {
        month: "short",
      }),
      sales: 0,
      transactions: 0,
    });
  }

  return { points, monthKeys };
}

export async function getDashboardData(
  storeId: string,
  ownerFullName: string,
  storeName: string,
  role: string | null,
  periodInput?: string | null,
): Promise<DashboardData> {
  const supabase = await createClient();
  const period = resolveDashboardPeriod(periodInput);
  const now = new Date();
  const bounds = getPeriodBounds(period, now);
  const chartLookbackStart = addManilaDays(startOfManilaDay(now), -180);

  const [
    periodSalesResult,
    previousSalesResult,
    productsResult,
    inventoryResult,
    recentSalesResult,
    chartSalesResult,
    saleItemsResult,
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("id, total, status, created_at")
      .eq("store_id", storeId)
      .eq("status", "completed")
      .gte("created_at", bounds.start.toISOString())
      .lt("created_at", bounds.end.toISOString()),
    supabase
      .from("sales")
      .select("id, total, status, created_at")
      .eq("store_id", storeId)
      .eq("status", "completed")
      .gte("created_at", bounds.previousStart.toISOString())
      .lt("created_at", bounds.previousEnd.toISOString()),
    supabase
      .from("products")
      .select("id, created_at")
      .eq("store_id", storeId)
      .is("archived_at", null)
      .eq("is_active", true),
    supabase
      .from("inventory")
      .select(
        `
        quantity,
        product:products!inner(
          id, name, sku, unit, min_stock_level, cost_price, is_active, archived_at,
          category:categories(name)
        )
      `,
      )
      .eq("store_id", storeId),
    supabase
      .from("sales")
      .select(
        `
        id, receipt_number, total, payment_method, status, created_at,
        customer:customers(name),
        cashier:profiles!sales_cashier_id_fkey(full_name),
        sale_items(id)
      `,
      )
      .eq("store_id", storeId)
      .gte("created_at", bounds.start.toISOString())
      .lt("created_at", bounds.end.toISOString())
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("sales")
      .select("id, total, status, created_at")
      .eq("store_id", storeId)
      .eq("status", "completed")
      .gte("created_at", chartLookbackStart.toISOString())
      .lt("created_at", bounds.end.toISOString()),
    supabase
      .from("sale_items")
      .select(
        `
        quantity, line_total,
        product:products(
          id, name, cost_price,
          category:categories(name)
        ),
        sale:sales!inner(id, status, created_at, store_id)
      `,
      )
      .eq("sale.store_id", storeId)
      .eq("sale.status", "completed")
      .gte("sale.created_at", chartLookbackStart.toISOString())
      .lt("sale.created_at", bounds.end.toISOString()),
  ]);

  if (periodSalesResult.error) {
    console.error("Dashboard period sales:", periodSalesResult.error.message);
  }
  if (inventoryResult.error) {
    console.error("Dashboard inventory:", inventoryResult.error.message);
  }
  if (recentSalesResult.error) {
    console.error("Dashboard recent sales:", recentSalesResult.error.message);
  }
  if (saleItemsResult.error) {
    console.error("Dashboard sale items:", saleItemsResult.error.message);
  }

  const periodSales = periodSalesResult.data ?? [];
  const previousSales = previousSalesResult.data ?? [];
  const products = productsResult.data ?? [];
  const inventoryRows = (inventoryResult.data ?? []) as unknown as InventoryJoin[];
  const recentSales = (recentSalesResult.data ?? []) as unknown as SaleRow[];
  const chartSales = chartSalesResult.data ?? [];
  const saleItems = (saleItemsResult.data ?? []) as unknown as SaleItemJoin[];

  const periodTotal = periodSales.reduce((sum, sale) => sum + toNumber(sale.total), 0);
  const previousTotal = previousSales.reduce(
    (sum, sale) => sum + toNumber(sale.total),
    0,
  );
  const periodTxnCount = periodSales.length;
  const previousTxnCount = previousSales.length;

  const weekAgo = addManilaDays(startOfManilaDay(now), -7);
  const productsThisWeek = products.filter(
    (product) => new Date(product.created_at).getTime() >= weekAgo.getTime(),
  ).length;

  const activeInventory = inventoryRows
    .map((row) => ({
      quantity: toNumber(row.quantity),
      product: unwrapOne(row.product),
    }))
    .filter(
      (row): row is { quantity: number; product: InventoryProduct } =>
        Boolean(row.product?.is_active && !row.product.archived_at),
    );

  const inventoryValue = activeInventory.reduce((sum, row) => {
    return sum + row.quantity * toNumber(row.product.cost_price);
  }, 0);

  const lowStockProducts: ProductStockRow[] = activeInventory
    .map((row) => {
      const product = row.product;
      const quantity = row.quantity;
      const minStock = toNumber(product.min_stock_level);
      const category = unwrapOne(product.category)?.name ?? "Uncategorized";
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category,
        stock: quantity,
        minStock,
        unit: product.unit,
        status: stockStatus(quantity, minStock),
      };
    })
    .filter((row) => row.status !== "In Stock")
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 10);

  const periodItemRows = saleItems.filter((item) => {
    const sale = unwrapOne(item.sale);
    if (!sale?.created_at) return false;
    const time = new Date(sale.created_at).getTime();
    return time >= bounds.start.getTime() && time < bounds.end.getTime();
  });

  const previousItemRows = saleItems.filter((item) => {
    const sale = unwrapOne(item.sale);
    if (!sale?.created_at) return false;
    const time = new Date(sale.created_at).getTime();
    return (
      time >= bounds.previousStart.getTime() && time < bounds.previousEnd.getTime()
    );
  });

  const grossProfit = periodItemRows.reduce((sum, item) => {
    const product = unwrapOne(item.product);
    const qty = toNumber(item.quantity);
    const lineTotal = toNumber(item.line_total);
    const cost = toNumber(product?.cost_price) * qty;
    return sum + (lineTotal - cost);
  }, 0);

  const previousGrossProfit = previousItemRows.reduce((sum, item) => {
    const product = unwrapOne(item.product);
    const qty = toNumber(item.quantity);
    const lineTotal = toNumber(item.line_total);
    const cost = toNumber(product?.cost_price) * qty;
    return sum + (lineTotal - cost);
  }, 0);

  const kpis: KpiMetric[] = [
    {
      id: "today-sales",
      label: salesLabel(period),
      value: periodTotal,
      format: "currency",
      change: percentChange(periodTotal, previousTotal),
      changeLabel: bounds.comparisonLabel,
      tone: "success",
    },
    {
      id: "today-transactions",
      label: transactionsLabel(period),
      value: periodTxnCount,
      format: "number",
      change: percentChange(periodTxnCount, previousTxnCount),
      changeLabel: bounds.comparisonLabel,
      tone: "info",
    },
    {
      id: "total-products",
      label: "Total Products",
      value: products.length,
      format: "number",
      change: productsThisWeek,
      changeLabel: "new this week",
      tone: "default",
    },
    {
      id: "inventory-value",
      label: "Inventory Value",
      value: inventoryValue,
      format: "currency",
      change: 0,
      changeLabel: "at cost",
      tone: "warning",
    },
    {
      id: "gross-profit",
      label: profitLabel(period),
      value: grossProfit,
      format: "currency",
      change: percentChange(grossProfit, previousGrossProfit),
      changeLabel: bounds.comparisonLabel,
      tone: "success",
    },
    {
      id: "low-stock",
      label: "Low Stock Products",
      value: lowStockProducts.length,
      format: "number",
      change: lowStockProducts.length,
      changeLabel: "need restock",
      tone: "danger",
    },
  ];

  const dailySales = buildDailyBuckets();
  const todayKey = manilaDayKey(now);
  for (const sale of chartSales) {
    const created = new Date(sale.created_at);
    if (manilaDayKey(created) !== todayKey) continue;
    const hour = getZonedParts(created).hour;
    const bucketIndex = Math.min(
      dailySales.length - 1,
      Math.max(0, Math.floor((hour - 8) / 2)),
    );
    if (hour < 8) continue;
    dailySales[bucketIndex].sales += toNumber(sale.total);
    dailySales[bucketIndex].transactions += 1;
  }

  const weekly = buildWeeklyBuckets(now);
  for (const sale of chartSales) {
    const key = manilaDayKey(new Date(sale.created_at));
    const index = weekly.dayKeys.indexOf(key);
    if (index === -1) continue;
    weekly.points[index].sales += toNumber(sale.total);
    weekly.points[index].transactions += 1;
  }

  const monthly = buildMonthlyBuckets(now);
  for (const sale of chartSales) {
    const key = manilaMonthKey(new Date(sale.created_at));
    const index = monthly.monthKeys.indexOf(key);
    if (index === -1) continue;
    monthly.points[index].sales += toNumber(sale.total);
    monthly.points[index].transactions += 1;
  }

  const categoryMap = new Map<string, number>();
  for (const item of periodItemRows) {
    const product = unwrapOne(item.product);
    const category = unwrapOne(product?.category)?.name ?? "Uncategorized";
    categoryMap.set(
      category,
      (categoryMap.get(category) ?? 0) + toNumber(item.line_total),
    );
  }

  const categorySales: CategorySales[] = [...categoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, sales], index) => ({
      category,
      sales,
      fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));

  const topMap = new Map<string, TopProductRow>();
  for (const item of periodItemRows) {
    const product = unwrapOne(item.product);
    if (!product) continue;
    const existing = topMap.get(product.id) ?? {
      id: product.id,
      name: product.name,
      unitsSold: 0,
      revenue: 0,
    };
    existing.unitsSold += toNumber(item.quantity);
    existing.revenue += toNumber(item.line_total);
    topMap.set(product.id, existing);
  }

  const topProducts = [...topMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const recentTransactions: TransactionRow[] = recentSales.map((sale) => ({
    id: sale.id,
    receiptNumber: sale.receipt_number,
    customer: unwrapOne(sale.customer)?.name ?? "Walk-in",
    cashier: unwrapOne(sale.cashier)?.full_name ?? "Cashier",
    paymentMethod: mapPaymentMethod(sale.payment_method),
    items: sale.sale_items?.length ?? 0,
    total: toNumber(sale.total),
    status: mapStatus(sale.status),
    createdAt: sale.created_at,
  }));

  const isEmpty = products.length === 0 && periodSales.length === 0;
  const canSeedDemo =
    products.length === 0 && (role === "owner" || role === "manager");

  return {
    period,
    periodLabel: bounds.label,
    storeName,
    ownerFirstName: ownerFullName.trim().split(/\s+/)[0] || "there",
    todayLabel: formatManilaDate(now),
    isEmpty,
    canSeedDemo,
    kpis,
    dailySales: dailySales.some((point) => point.sales > 0)
      ? dailySales
      : emptySalesPoints(dailySales.map((point) => point.label)),
    weeklySales: weekly.points,
    monthlySales: monthly.points,
    categorySales,
    recentTransactions,
    topProducts,
    lowStockProducts,
  };
}
