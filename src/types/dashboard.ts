import type { DashboardPeriod } from "@/lib/utils/timezone";

export type KpiMetric = {
  id: string;
  label: string;
  value: number;
  format: "currency" | "number";
  change: number;
  changeLabel: string;
  tone: "default" | "success" | "warning" | "danger" | "info";
};

export type SalesPoint = {
  label: string;
  sales: number;
  transactions: number;
};

export type CategorySales = {
  category: string;
  sales: number;
  fill: string;
};

export type TransactionRow = {
  id: string;
  receiptNumber: string;
  customer: string;
  cashier: string;
  paymentMethod: "Cash" | "GCash" | "Other";
  items: number;
  total: number;
  status: "Completed" | "Voided" | "Refunded";
  createdAt: string;
};

export type ProductStockRow = {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
};

export type TopProductRow = {
  id: string;
  name: string;
  unitsSold: number;
  revenue: number;
};

export type DashboardData = {
  period: DashboardPeriod;
  periodLabel: string;
  storeName: string;
  ownerFirstName: string;
  todayLabel: string;
  isEmpty: boolean;
  canSeedDemo: boolean;
  kpis: KpiMetric[];
  dailySales: SalesPoint[];
  weeklySales: SalesPoint[];
  monthlySales: SalesPoint[];
  categorySales: CategorySales[];
  recentTransactions: TransactionRow[];
  topProducts: TopProductRow[];
  lowStockProducts: ProductStockRow[];
};
