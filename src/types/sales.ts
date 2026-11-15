export type SaleStatus = "completed" | "voided" | "refunded";

export type SalePaymentMethod = "cash" | "gcash" | "other" | string;

export type SaleListFilters = {
  q?: string;
  status?: SaleStatus | "all";
  paymentMethod?: string;
  cashierId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type SaleListItem = {
  id: string;
  receiptNumber: string;
  status: SaleStatus;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  total: number;
  cashReceived: number | null;
  changeAmount: number | null;
  customerName: string | null;
  cashierId: string | null;
  cashierName: string | null;
  itemCount: number;
  createdAt: string;
};

export type SaleSummary = {
  transactionCount: number;
  completedCount: number;
  voidedCount: number;
  refundedCount: number;
  completedSales: number;
  averageTicket: number;
};

export type SaleListResult = {
  items: SaleListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: SaleSummary;
};

export type CashierOption = {
  id: string;
  fullName: string;
};

export type SaleItemDetail = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type SalePaymentDetail = {
  id: string;
  method: string;
  amount: number;
  reference: string | null;
  createdAt: string;
};

export type SaleAuditEvent = {
  id: string;
  action: string;
  reason: string | null;
  createdByName: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type SaleDetail = {
  id: string;
  receiptNumber: string;
  status: SaleStatus;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  total: number;
  cashReceived: number | null;
  changeAmount: number | null;
  notes: string | null;
  statusReason: string | null;
  statusChangedAt: string | null;
  statusChangedByName: string | null;
  customerId: string | null;
  customerName: string | null;
  cashierId: string | null;
  cashierName: string | null;
  storeName: string;
  storeAddress: string | null;
  createdAt: string;
  updatedAt: string;
  items: SaleItemDetail[];
  payments: SalePaymentDetail[];
  auditEvents: SaleAuditEvent[];
};

export type SaleStatusAction = "void" | "refund";
