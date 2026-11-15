import type {
  CategorySales,
  KpiMetric,
  ProductStockRow,
  SalesPoint,
  TopProductRow,
  TransactionRow,
} from "@/types/dashboard";

export const sampleStore = {
  name: "Aling Rosa Sari-Sari",
  address: "123 Mabini St., Barangay San Jose, Quezon City",
  owner: "Rosa Mendoza",
  cashier: "Ana Cruz",
};

export const sampleKpis: KpiMetric[] = [
  {
    id: "today-sales",
    label: "Today's Sales",
    value: 12480.5,
    format: "currency",
    change: 12.4,
    changeLabel: "vs yesterday",
    tone: "success",
  },
  {
    id: "today-transactions",
    label: "Today's Transactions",
    value: 86,
    format: "number",
    change: 8.1,
    changeLabel: "vs yesterday",
    tone: "info",
  },
  {
    id: "total-products",
    label: "Total Products",
    value: 248,
    format: "number",
    change: 2.0,
    changeLabel: "new this week",
    tone: "default",
  },
  {
    id: "inventory-value",
    label: "Inventory Value",
    value: 186450,
    format: "currency",
    change: -1.2,
    changeLabel: "vs last week",
    tone: "warning",
  },
  {
    id: "gross-profit",
    label: "Estimated Gross Profit",
    value: 4280.75,
    format: "currency",
    change: 9.6,
    changeLabel: "today",
    tone: "success",
  },
  {
    id: "low-stock",
    label: "Low Stock Products",
    value: 12,
    format: "number",
    change: 3,
    changeLabel: "need restock",
    tone: "danger",
  },
];

export const dailySales: SalesPoint[] = [
  { label: "8 AM", sales: 820, transactions: 7 },
  { label: "10 AM", sales: 1540, transactions: 14 },
  { label: "12 PM", sales: 2680, transactions: 22 },
  { label: "2 PM", sales: 1980, transactions: 16 },
  { label: "4 PM", sales: 2340, transactions: 18 },
  { label: "6 PM", sales: 2120, transactions: 15 },
  { label: "8 PM", sales: 1000.5, transactions: 8 },
];

export const weeklySales: SalesPoint[] = [
  { label: "Mon", sales: 9800, transactions: 72 },
  { label: "Tue", sales: 11240, transactions: 81 },
  { label: "Wed", sales: 10560, transactions: 76 },
  { label: "Thu", sales: 12110, transactions: 88 },
  { label: "Fri", sales: 13890, transactions: 95 },
  { label: "Sat", sales: 16240, transactions: 112 },
  { label: "Sun", sales: 12480.5, transactions: 86 },
];

export const monthlySales: SalesPoint[] = [
  { label: "Jun", sales: 286400, transactions: 1840 },
  { label: "Jul", sales: 301250, transactions: 1922 },
  { label: "Aug", sales: 294880, transactions: 1885 },
  { label: "Sep", sales: 318640, transactions: 2010 },
  { label: "Oct", sales: 332190, transactions: 2144 },
  { label: "Nov", sales: 276850, transactions: 1762 },
];

export const categorySales: CategorySales[] = [
  { category: "Beverages", sales: 3840, fill: "#1B365D" },
  { category: "Snacks", sales: 2760, fill: "#005A9C" },
  { category: "Canned Goods", sales: 1980, fill: "#60C1E5" },
  { category: "Personal Care", sales: 1540, fill: "#3A7AB5" },
  { category: "Household", sales: 1360, fill: "#0284C7" },
  { category: "Others", sales: 1000.5, fill: "#5B7C99" },
];

export const recentTransactions: TransactionRow[] = [
  {
    id: "txn-001",
    receiptNumber: "RCP-20261115-0086",
    customer: "Walk-in",
    cashier: "Ana Cruz",
    paymentMethod: "Cash",
    items: 4,
    total: 245.0,
    status: "Completed",
    createdAt: "2026-11-15T19:42:00+08:00",
  },
  {
    id: "txn-002",
    receiptNumber: "RCP-20261115-0085",
    customer: "Mang Ben",
    cashier: "Ana Cruz",
    paymentMethod: "GCash",
    items: 7,
    total: 412.5,
    status: "Completed",
    createdAt: "2026-11-15T19:18:00+08:00",
  },
  {
    id: "txn-003",
    receiptNumber: "RCP-20261115-0084",
    customer: "Walk-in",
    cashier: "Ana Cruz",
    paymentMethod: "Cash",
    items: 2,
    total: 98.0,
    status: "Completed",
    createdAt: "2026-11-15T18:55:00+08:00",
  },
  {
    id: "txn-004",
    receiptNumber: "RCP-20261115-0083",
    customer: "Aling Nena",
    cashier: "Jose Reyes",
    paymentMethod: "Cash",
    items: 11,
    total: 685.25,
    status: "Completed",
    createdAt: "2026-11-15T18:21:00+08:00",
  },
  {
    id: "txn-005",
    receiptNumber: "RCP-20261115-0082",
    customer: "Walk-in",
    cashier: "Jose Reyes",
    paymentMethod: "Other",
    items: 1,
    total: 55.0,
    status: "Refunded",
    createdAt: "2026-11-15T17:48:00+08:00",
  },
];

export const lowStockProducts: ProductStockRow[] = [
  {
    id: "prd-001",
    name: "Coca-Cola 1.5L",
    sku: "BEV-COKE-15",
    category: "Beverages",
    stock: 4,
    minStock: 12,
    unit: "bottle",
    status: "Low Stock",
  },
  {
    id: "prd-002",
    name: "Lucky Me Pancit Canton",
    sku: "SNK-LM-PC",
    category: "Snacks",
    stock: 8,
    minStock: 24,
    unit: "pack",
    status: "Low Stock",
  },
  {
    id: "prd-003",
    name: "Bottled Water 500ml",
    sku: "BEV-H2O-500",
    category: "Beverages",
    stock: 0,
    minStock: 30,
    unit: "bottle",
    status: "Out of Stock",
  },
  {
    id: "prd-004",
    name: "Coffee Sachet",
    sku: "BEV-CFE-SCH",
    category: "Beverages",
    stock: 6,
    minStock: 20,
    unit: "sachet",
    status: "Low Stock",
  },
  {
    id: "prd-005",
    name: "Cooking Oil 1L",
    sku: "HSE-OIL-1L",
    category: "Household",
    stock: 3,
    minStock: 10,
    unit: "bottle",
    status: "Low Stock",
  },
];

export const topSellingProducts: TopProductRow[] = [
  {
    id: "prd-top-1",
    name: "Coca-Cola 1.5L",
    unitsSold: 42,
    revenue: 2730,
  },
  {
    id: "prd-top-2",
    name: "Lucky Me Pancit Canton",
    unitsSold: 58,
    revenue: 1160,
  },
  {
    id: "prd-top-3",
    name: "Rice (per kilo)",
    unitsSold: 36,
    revenue: 1980,
  },
  {
    id: "prd-top-4",
    name: "Sardines",
    unitsSold: 29,
    revenue: 870,
  },
  {
    id: "prd-top-5",
    name: "Biscuits",
    unitsSold: 47,
    revenue: 705,
  },
];
