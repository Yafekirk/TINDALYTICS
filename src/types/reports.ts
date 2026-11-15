export type ReportType =
  | "overview"
  | "products"
  | "categories"
  | "payments"
  | "inventory"
  | "expenses"
  | "pnl";

export type ReportPreset =
  | "today"
  | "7d"
  | "30d"
  | "month"
  | "year"
  | "custom";

export type ReportRange = {
  preset: ReportPreset;
  startIso: string;
  endIso: string;
  label: string;
  dateFrom: string;
  dateTo: string;
};

export type ReportSummary = {
  revenue: number;
  transactions: number;
  averageTicket: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  cogs: number;
  itemsSold: number;
};

export type ReportTrendPoint = {
  label: string;
  key: string;
  sales: number;
  transactions: number;
  profit: number;
};

export type ProductSalesRow = {
  productId: string;
  name: string;
  sku: string;
  categoryName: string | null;
  quantitySold: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
};

export type CategorySalesRow = {
  categoryName: string;
  quantitySold: number;
  revenue: number;
  grossProfit: number;
};

export type PaymentMethodRow = {
  method: string;
  label: string;
  transactions: number;
  amount: number;
  share: number;
};

export type InventoryValuationRow = {
  productId: string;
  name: string;
  sku: string;
  categoryName: string | null;
  quantity: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  costValue: number;
  retailValue: number;
};

export type ExpenseReportRow = {
  id: string;
  name: string;
  category: string;
  amount: number;
  expenseDate: string;
  paymentMethod: string;
  status: string;
};

export type ExpenseCategoryRow = {
  category: string;
  label: string;
  amount: number;
  count: number;
};

export type SlowMovingRow = {
  productId: string;
  name: string;
  sku: string;
  stock: number;
  quantitySold: number;
  revenue: number;
};

export type ReportsData = {
  range: ReportRange;
  summary: ReportSummary;
  trend: ReportTrendPoint[];
  productSales: ProductSalesRow[];
  bestSellers: ProductSalesRow[];
  slowMoving: SlowMovingRow[];
  categorySales: CategorySalesRow[];
  paymentMethods: PaymentMethodRow[];
  inventory: InventoryValuationRow[];
  inventoryTotals: {
    costValue: number;
    retailValue: number;
    skuCount: number;
  };
  expenses: ExpenseReportRow[];
  expenseCategories: ExpenseCategoryRow[];
  pnl: {
    revenue: number;
    cogs: number;
    grossProfit: number;
    expenses: number;
    netProfit: number;
    grossMargin: number;
    netMargin: number;
  };
};
