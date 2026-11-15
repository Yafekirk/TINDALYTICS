export const CREDIT_STATUSES = [
  "open",
  "partial",
  "paid",
  "voided",
] as const;

export type CreditStatus = (typeof CREDIT_STATUSES)[number];

export type CreditListFilters = {
  q?: string;
  status?: CreditStatus | "all" | "outstanding" | "overdue";
  customerId?: string;
  page?: number;
  pageSize?: number;
};

export type CreditListItem = {
  id: string;
  customerId: string;
  customerName: string;
  customerContact: string | null;
  saleId: string | null;
  saleReceiptNumber: string | null;
  amount: number;
  balance: number;
  dueDate: string | null;
  status: CreditStatus;
  notes: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreditSummary = {
  outstandingTotal: number;
  outstandingCount: number;
  overdueTotal: number;
  overdueCount: number;
  paidCount: number;
  openCount: number;
  partialCount: number;
};

export type CreditListResult = {
  items: CreditListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: CreditSummary;
};

export type CreditPayment = {
  id: string;
  amount: number;
  paymentMethod: string;
  paidAt: string;
  notes: string | null;
  createdByName: string | null;
  createdAt: string;
};

export type CreditDetail = CreditListItem & {
  payments: CreditPayment[];
  amountPaid: number;
};

export type CreditCustomerOption = {
  id: string;
  name: string;
  contactNumber: string | null;
  outstandingBalance: number;
};

export type CreditSaleOption = {
  id: string;
  receiptNumber: string;
  total: number;
  createdAt: string;
};
