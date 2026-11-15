import { getLowStockAlerts } from "@/lib/services/inventory";
import { getReportsData } from "@/lib/services/reports";
import { formatManilaDate, getZonedParts } from "@/lib/utils/timezone";
import type {
  AiInsightsSnapshot,
  AiLowStockMetric,
  AiProductMetric,
  AiWeekdaySales,
} from "@/types/ai-insights";

const WEEKDAY_ORDER = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const WEEKDAY_MAP: Record<string, (typeof WEEKDAY_ORDER)[number]> = {
  Sun: "Sunday",
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function weekdayFromDayKey(dayKey: string): (typeof WEEKDAY_ORDER)[number] | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) return null;
  const [year, month, day] = dayKey.split("-").map(Number);
  // 04:00 UTC keeps Asia/Manila on the same calendar day
  const parts = getZonedParts(new Date(Date.UTC(year, month - 1, day, 4, 0, 0)));
  return WEEKDAY_MAP[parts.weekday] ?? null;
}

function buildWeekdaySales(
  trend: { key: string; sales: number; transactions: number }[],
): AiWeekdaySales[] {
  const buckets = new Map<
    string,
    { totalSales: number; transactions: number; days: number }
  >();

  for (const point of trend) {
    const weekday = weekdayFromDayKey(point.key);
    if (!weekday) continue;
    const current = buckets.get(weekday) ?? {
      totalSales: 0,
      transactions: 0,
      days: 0,
    };
    current.totalSales += point.sales;
    current.transactions += point.transactions;
    current.days += 1;
    buckets.set(weekday, current);
  }

  return WEEKDAY_ORDER.map((weekday) => {
    const bucket = buckets.get(weekday);
    if (!bucket || bucket.days === 0) {
      return { weekday, averageSales: 0, transactionCount: 0 };
    }
    return {
      weekday,
      averageSales: roundMoney(bucket.totalSales / bucket.days),
      transactionCount: bucket.transactions,
    };
  });
}

export async function getAiInsightsSnapshot(
  storeId: string,
  storeName: string,
): Promise<AiInsightsSnapshot> {
  const reports = await getReportsData(storeId, { preset: "30d" });
  const lowStockRows = await getLowStockAlerts(storeId, 12);

  const bestSellers: AiProductMetric[] = reports.bestSellers
    .slice(0, 8)
    .map((row) => ({
      name: row.name,
      sku: row.sku,
      quantitySold: row.quantitySold,
      revenue: row.revenue,
    }));

  const slowMoving: AiProductMetric[] = reports.slowMoving
    .slice(0, 8)
    .map((row) => ({
      name: row.name,
      sku: row.sku,
      quantitySold: row.quantitySold,
      revenue: row.revenue,
      stock: row.stock,
    }));

  const lowStock: AiLowStockMetric[] = lowStockRows.map((row) => ({
    name: row.name,
    sku: row.sku,
    quantity: row.quantity,
    minStockLevel: row.minStockLevel,
    status: row.status,
  }));

  const weekdaySales = buildWeekdaySales(reports.trend);
  const dataNotes: string[] = [];

  if (reports.summary.transactions === 0) {
    dataNotes.push("No completed sales in the last 30 days.");
  } else if (reports.summary.transactions < 5) {
    dataNotes.push(
      "Very few sales in the last 30 days — forecast confidence will be low.",
    );
  }

  if (bestSellers.length === 0) {
    dataNotes.push("No product sales history available yet.");
  }
  if (lowStock.length === 0) {
    dataNotes.push("No low-stock products right now.");
  }

  const hasEnoughData = reports.summary.transactions >= 3;

  return {
    storeName,
    rangeLabel: reports.range.label,
    generatedAt: formatManilaDate(new Date(), {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    hasEnoughData,
    dataNotes,
    summary: {
      revenue: reports.summary.revenue,
      transactions: reports.summary.transactions,
      averageTicket: reports.summary.averageTicket,
      grossProfit: reports.summary.grossProfit,
      expenses: reports.summary.expenses,
      netProfit: reports.summary.netProfit,
      itemsSold: reports.summary.itemsSold,
    },
    recentTrend: reports.trend.slice(-14).map((point) => ({
      label: point.label,
      sales: point.sales,
      transactions: point.transactions,
    })),
    weekdaySales,
    bestSellers,
    slowMoving,
    lowStock,
    categorySales: reports.categorySales.slice(0, 8).map((row) => ({
      categoryName: row.categoryName,
      revenue: row.revenue,
      quantitySold: row.quantitySold,
    })),
  };
}
