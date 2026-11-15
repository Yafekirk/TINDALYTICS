export const EXPENSE_CATEGORIES = [
  "electricity",
  "water",
  "rent",
  "transportation",
  "supplies",
  "miscellaneous",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type ExpenseStatus = "active" | "voided" | "archived";

export type ExpenseListFilters = {
  q?: string;
  category?: ExpenseCategory | "all";
  status?: ExpenseStatus | "all";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type ExpenseListItem = {
  id: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  description: string | null;
  paymentMethod: string;
  status: ExpenseStatus;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseCategorySummary = {
  category: ExpenseCategory;
  label: string;
  amount: number;
  count: number;
};

export type ExpenseSummary = {
  totalAmount: number;
  activeCount: number;
  voidedCount: number;
  archivedCount: number;
  byCategory: ExpenseCategorySummary[];
};

export type ExpenseListResult = {
  items: ExpenseListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: ExpenseSummary;
};

export type ExpenseDetail = ExpenseListItem;
