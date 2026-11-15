import { createClient } from "@/lib/supabase/server";
import type {
  CustomerCreditSummary,
  CustomerDetail,
  CustomerListFilters,
  CustomerListItem,
  CustomerListResult,
  CustomerSale,
} from "@/types/customer";

const DEFAULT_PAGE_SIZE = 15;

function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

type CustomerRow = {
  id: string;
  name: string;
  contact_number: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  sales:
    | { id: string; total: number | string; status: string }[]
    | null;
  customer_credits:
    | { id: string; balance: number | string; status: string }[]
    | null;
};

function mapListItem(row: CustomerRow): CustomerListItem {
  const completedSales = (row.sales ?? []).filter(
    (sale) => sale.status === "completed",
  );
  const openCredits = (row.customer_credits ?? []).filter((credit) =>
    ["open", "partial"].includes(credit.status),
  );

  return {
    id: row.id,
    name: row.name,
    contactNumber: row.contact_number,
    address: row.address,
    notes: row.notes,
    purchaseCount: completedSales.length,
    totalSpent: roundMoney(
      completedSales.reduce((sum, sale) => sum + toNumber(sale.total), 0),
    ),
    outstandingBalance: roundMoney(
      openCredits.reduce((sum, credit) => sum + toNumber(credit.balance), 0),
    ),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCustomers(
  storeId: string,
  filters: CustomerListFilters = {},
): Promise<CustomerListResult> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE));
  const q = filters.q?.trim() ?? "";
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("customers")
    .select(
      `
      id, name, contact_number, address, notes, created_at, updated_at,
      sales(id, total, status),
      customer_credits(id, balance, status)
    `,
      { count: "exact" },
    )
    .eq("store_id", storeId)
    .order("name", { ascending: true })
    .range(from, to);

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,contact_number.ilike.%${q}%,address.ilike.%${q}%`,
    );
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("listCustomers:", error.message);
    return { items: [], total: 0, page, pageSize, totalPages: 1 };
  }

  const total = count ?? 0;
  return {
    items: ((data ?? []) as unknown as CustomerRow[]).map(mapListItem),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getCustomer(
  storeId: string,
  customerId: string,
): Promise<CustomerDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select(
      `
      id, name, contact_number, address, notes, created_at, updated_at,
      sales(id, receipt_number, status, total, payment_method, created_at),
      customer_credits(id, amount, balance, status, due_date, created_at)
    `,
    )
    .eq("store_id", storeId)
    .eq("id", customerId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("getCustomer:", error.message);
    return null;
  }

  const sales: CustomerSale[] = (
    (data.sales as Array<{
      id: string;
      receipt_number: string;
      status: string;
      total: number | string;
      payment_method: string;
      created_at: string;
    }>) ?? []
  )
    .map((sale) => ({
      id: sale.id,
      receiptNumber: sale.receipt_number,
      status: sale.status,
      total: toNumber(sale.total),
      paymentMethod: sale.payment_method,
      createdAt: sale.created_at,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const credits: CustomerCreditSummary[] = (
    (data.customer_credits as Array<{
      id: string;
      amount: number | string;
      balance: number | string;
      status: string;
      due_date: string | null;
      created_at: string;
    }>) ?? []
  )
    .map((credit) => ({
      id: credit.id,
      amount: toNumber(credit.amount),
      balance: toNumber(credit.balance),
      status: credit.status,
      dueDate: credit.due_date,
      createdAt: credit.created_at,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const base = mapListItem({
    id: data.id,
    name: data.name,
    contact_number: data.contact_number,
    address: data.address,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
    sales: sales.map((sale) => ({
      id: sale.id,
      total: sale.total,
      status: sale.status,
    })),
    customer_credits: credits.map((credit) => ({
      id: credit.id,
      balance: credit.balance,
      status: credit.status,
    })),
  });

  return {
    ...base,
    sales,
    credits,
  };
}
