import { createClient } from "@/lib/supabase/server";
import { expenseCategoryLabel } from "@/lib/validations/expense";
import type {
  ExpenseCategory,
  ExpenseDetail,
  ExpenseListFilters,
  ExpenseListItem,
  ExpenseListResult,
  ExpenseStatus,
  ExpenseSummary,
} from "@/types/expense";
import { EXPENSE_CATEGORIES } from "@/types/expense";

const DEFAULT_PAGE_SIZE = 15;

function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function resolveCategory(
  category?: string | null,
): ExpenseCategory | "all" {
  if (EXPENSE_CATEGORIES.includes(category as ExpenseCategory)) {
    return category as ExpenseCategory;
  }
  return "all";
}

function resolveStatus(status?: string | null): ExpenseStatus | "all" {
  if (status === "active" || status === "voided" || status === "archived") {
    return status;
  }
  return "active";
}

type ExpenseRow = {
  id: string;
  name: string;
  category: string;
  amount: number | string;
  expense_date: string;
  description: string | null;
  payment_method: string;
  status: string;
  created_at: string;
  updated_at: string;
  creator: { full_name: string } | { full_name: string }[] | null;
};

function mapExpense(row: ExpenseRow): ExpenseListItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category as ExpenseCategory,
    amount: toNumber(row.amount),
    expenseDate: row.expense_date,
    description: row.description,
    paymentMethod: row.payment_method,
    status: row.status as ExpenseStatus,
    createdByName: unwrapOne(row.creator)?.full_name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function emptySummary(): ExpenseSummary {
  return {
    totalAmount: 0,
    activeCount: 0,
    voidedCount: 0,
    archivedCount: 0,
    byCategory: [],
  };
}

export async function listExpenses(
  storeId: string,
  filters: ExpenseListFilters = {},
): Promise<ExpenseListResult> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE));
  const category = resolveCategory(filters.category);
  const status = resolveStatus(filters.status);
  const q = filters.q?.trim() ?? "";
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("expenses")
    .select(
      `
      id, name, category, amount, expense_date, description, payment_method,
      status, created_at, updated_at,
      creator:profiles!expenses_created_by_fkey(full_name)
    `,
      { count: "exact" },
    )
    .eq("store_id", storeId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status !== "all") query = query.eq("status", status);
  if (category !== "all") query = query.eq("category", category);
  if (filters.dateFrom) query = query.gte("expense_date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("expense_date", filters.dateTo);
  if (q) {
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("listExpenses:", error.message);
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 1,
      summary: emptySummary(),
    };
  }

  const summary = await getExpenseSummary(storeId, {
    ...filters,
    status: status === "all" ? "all" : status,
  });

  const total = count ?? 0;
  return {
    items: ((data ?? []) as unknown as ExpenseRow[]).map(mapExpense),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    summary,
  };
}

export async function getExpenseSummary(
  storeId: string,
  filters: ExpenseListFilters = {},
): Promise<ExpenseSummary> {
  const supabase = await createClient();
  const category = resolveCategory(filters.category);
  const status = resolveStatus(filters.status);
  const q = filters.q?.trim() ?? "";

  let query = supabase
    .from("expenses")
    .select("category, amount, status")
    .eq("store_id", storeId);

  if (status !== "all") query = query.eq("status", status);
  if (category !== "all") query = query.eq("category", category);
  if (filters.dateFrom) query = query.gte("expense_date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("expense_date", filters.dateTo);
  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) {
    console.error("getExpenseSummary:", error.message);
    return emptySummary();
  }

  const summary = emptySummary();
  const categoryMap = new Map<
    ExpenseCategory,
    { amount: number; count: number }
  >();

  for (const row of data ?? []) {
    const amount = toNumber(row.amount);
    if (row.status === "active") {
      summary.activeCount += 1;
      summary.totalAmount += amount;
      const key = row.category as ExpenseCategory;
      const current = categoryMap.get(key) ?? { amount: 0, count: 0 };
      current.amount += amount;
      current.count += 1;
      categoryMap.set(key, current);
    } else if (row.status === "voided") {
      summary.voidedCount += 1;
    } else if (row.status === "archived") {
      summary.archivedCount += 1;
    }
  }

  summary.totalAmount = Math.round(summary.totalAmount * 100) / 100;
  summary.byCategory = [...categoryMap.entries()]
    .map(([cat, value]) => ({
      category: cat,
      label: expenseCategoryLabel(cat),
      amount: Math.round(value.amount * 100) / 100,
      count: value.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  return summary;
}

export async function getExpense(
  storeId: string,
  expenseId: string,
): Promise<ExpenseDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(
      `
      id, name, category, amount, expense_date, description, payment_method,
      status, created_at, updated_at,
      creator:profiles!expenses_created_by_fkey(full_name)
    `,
    )
    .eq("store_id", storeId)
    .eq("id", expenseId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("getExpense:", error.message);
    return null;
  }

  return mapExpense(data as unknown as ExpenseRow);
}
