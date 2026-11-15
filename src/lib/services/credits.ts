import { createClient } from "@/lib/supabase/server";
import { manilaDayKey } from "@/lib/utils/timezone";
import { isCreditStatus } from "@/lib/validations/credit";
import type {
  CreditCustomerOption,
  CreditDetail,
  CreditListFilters,
  CreditListItem,
  CreditListResult,
  CreditPayment,
  CreditSaleOption,
  CreditStatus,
  CreditSummary,
} from "@/types/credit";

const DEFAULT_PAGE_SIZE = 15;

function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function emptySummary(): CreditSummary {
  return {
    outstandingTotal: 0,
    outstandingCount: 0,
    overdueTotal: 0,
    overdueCount: 0,
    paidCount: 0,
    openCount: 0,
    partialCount: 0,
  };
}

function resolveStatusFilter(
  status?: string | null,
): CreditListFilters["status"] {
  if (
    status === "all" ||
    status === "outstanding" ||
    status === "overdue" ||
    isCreditStatus(status)
  ) {
    return status;
  }
  return "outstanding";
}

type CreditRow = {
  id: string;
  customer_id: string;
  sale_id: string | null;
  amount: number | string;
  balance: number | string;
  due_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer:
    | { name: string; contact_number: string | null }
    | { name: string; contact_number: string | null }[]
    | null;
  sale:
    | { id: string; receipt_number: string }
    | { id: string; receipt_number: string }[]
    | null;
};

function mapCredit(
  row: CreditRow,
  todayKey = manilaDayKey(new Date()),
): CreditListItem {
  const customer = unwrapOne(row.customer);
  const sale = unwrapOne(row.sale);
  const status = (isCreditStatus(row.status) ? row.status : "open") as CreditStatus;
  const dueDate = row.due_date;
  const isOverdue =
    Boolean(dueDate) &&
    ["open", "partial"].includes(status) &&
    dueDate! < todayKey;

  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: customer?.name ?? "Unknown customer",
    customerContact: customer?.contact_number ?? null,
    saleId: row.sale_id,
    saleReceiptNumber: sale?.receipt_number ?? null,
    amount: toNumber(row.amount),
    balance: toNumber(row.balance),
    dueDate,
    status,
    notes: row.notes,
    isOverdue,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function resolveCustomerIdsForSearch(
  storeId: string,
  q: string,
): Promise<string[] | null> {
  const needle = q.trim();
  if (!needle) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id")
    .eq("store_id", storeId)
    .or(`name.ilike.%${needle}%,contact_number.ilike.%${needle}%`);

  if (error) {
    console.error("resolveCustomerIdsForSearch:", error.message);
    return [];
  }

  return (data ?? []).map((row) => row.id as string);
}

export async function getCreditSummary(
  storeId: string,
  filters: CreditListFilters = {},
): Promise<CreditSummary> {
  const supabase = await createClient();
  const todayKey = manilaDayKey(new Date());
  const customerIds = await resolveCustomerIdsForSearch(
    storeId,
    filters.q ?? "",
  );

  if (customerIds && customerIds.length === 0) {
    return emptySummary();
  }

  let query = supabase
    .from("customer_credits")
    .select("amount, balance, status, due_date")
    .eq("store_id", storeId);

  if (filters.customerId) query = query.eq("customer_id", filters.customerId);
  if (customerIds) query = query.in("customer_id", customerIds);

  const { data, error } = await query;
  if (error) {
    console.error("getCreditSummary:", error.message);
    return emptySummary();
  }

  const summary = emptySummary();

  for (const row of data ?? []) {
    const balance = toNumber(row.balance);
    const status = row.status;
    const dueDate = row.due_date as string | null;
    const overdue =
      Boolean(dueDate) &&
      ["open", "partial"].includes(status) &&
      dueDate! < todayKey;

    if (status === "open") summary.openCount += 1;
    if (status === "partial") summary.partialCount += 1;
    if (status === "paid") summary.paidCount += 1;

    if (status === "open" || status === "partial") {
      summary.outstandingCount += 1;
      summary.outstandingTotal += balance;
      if (overdue) {
        summary.overdueCount += 1;
        summary.overdueTotal += balance;
      }
    }
  }

  summary.outstandingTotal = roundMoney(summary.outstandingTotal);
  summary.overdueTotal = roundMoney(summary.overdueTotal);
  return summary;
}

export async function listCredits(
  storeId: string,
  filters: CreditListFilters = {},
): Promise<CreditListResult> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE));
  const status = resolveStatusFilter(filters.status);
  const todayKey = manilaDayKey(new Date());
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const customerIds = await resolveCustomerIdsForSearch(
    storeId,
    filters.q ?? "",
  );

  if (customerIds && customerIds.length === 0) {
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 1,
      summary: emptySummary(),
    };
  }

  let query = supabase
    .from("customer_credits")
    .select(
      `
      id, customer_id, sale_id, amount, balance, due_date, status, notes,
      created_at, updated_at,
      customer:customers!customer_credits_customer_id_fkey(name, contact_number),
      sale:sales!customer_credits_sale_id_fkey(id, receipt_number)
    `,
      { count: "exact" },
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.customerId) query = query.eq("customer_id", filters.customerId);
  if (customerIds) query = query.in("customer_id", customerIds);

  if (status === "outstanding") {
    query = query.in("status", ["open", "partial"]);
  } else if (status === "overdue") {
    query = query
      .in("status", ["open", "partial"])
      .not("due_date", "is", null)
      .lt("due_date", todayKey);
  } else if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("listCredits:", error.message);
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 1,
      summary: emptySummary(),
    };
  }

  const items = ((data ?? []) as unknown as CreditRow[]).map((row) =>
    mapCredit(row, todayKey),
  );

  const summary = await getCreditSummary(storeId, filters);
  const total = count ?? 0;

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    summary,
  };
}

export async function getCredit(
  storeId: string,
  creditId: string,
): Promise<CreditDetail | null> {
  const supabase = await createClient();
  const todayKey = manilaDayKey(new Date());

  const { data, error } = await supabase
    .from("customer_credits")
    .select(
      `
      id, customer_id, sale_id, amount, balance, due_date, status, notes,
      created_at, updated_at,
      customer:customers!customer_credits_customer_id_fkey(name, contact_number),
      sale:sales!customer_credits_sale_id_fkey(id, receipt_number)
    `,
    )
    .eq("store_id", storeId)
    .eq("id", creditId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("getCredit:", error.message);
    return null;
  }

  const base = mapCredit(data as unknown as CreditRow, todayKey);

  const { data: paymentRows, error: paymentError } = await supabase
    .from("credit_payments")
    .select(
      `
      id, amount, payment_method, paid_at, notes, created_at,
      creator:profiles!credit_payments_created_by_fkey(full_name)
    `,
    )
    .eq("store_id", storeId)
    .eq("credit_id", creditId)
    .order("paid_at", { ascending: false });

  if (paymentError) {
    console.error("getCredit payments:", paymentError.message);
  }

  const payments: CreditPayment[] = (paymentRows ?? []).map((row) => ({
    id: row.id,
    amount: toNumber(row.amount),
    paymentMethod: row.payment_method,
    paidAt: row.paid_at,
    notes: row.notes,
    createdByName:
      unwrapOne(
        row.creator as { full_name: string } | { full_name: string }[] | null,
      )?.full_name ?? null,
    createdAt: row.created_at,
  }));

  return {
    ...base,
    payments,
    amountPaid: roundMoney(base.amount - base.balance),
  };
}

export async function listCreditCustomerOptions(
  storeId: string,
): Promise<CreditCustomerOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select(
      `
      id, name, contact_number,
      customer_credits(balance, status)
    `,
    )
    .eq("store_id", storeId)
    .order("name", { ascending: true });

  if (error) {
    console.error("listCreditCustomerOptions:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const openCredits = (
      (row.customer_credits as Array<{
        balance: number | string;
        status: string;
      }> | null) ?? []
    ).filter((credit) => ["open", "partial"].includes(credit.status));

    return {
      id: row.id,
      name: row.name,
      contactNumber: row.contact_number,
      outstandingBalance: roundMoney(
        openCredits.reduce((sum, credit) => sum + toNumber(credit.balance), 0),
      ),
    };
  });
}

export async function listLinkableSalesForCustomer(
  storeId: string,
  customerId: string,
): Promise<CreditSaleOption[]> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("customer_credits")
    .select("sale_id")
    .eq("store_id", storeId)
    .eq("customer_id", customerId)
    .not("sale_id", "is", null)
    .in("status", ["open", "partial", "paid"]);

  const linkedSaleIds = new Set(
    (existing ?? [])
      .map((row) => row.sale_id as string | null)
      .filter((id): id is string => Boolean(id)),
  );

  const { data, error } = await supabase
    .from("sales")
    .select("id, receipt_number, total, created_at")
    .eq("store_id", storeId)
    .eq("customer_id", customerId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("listLinkableSalesForCustomer:", error.message);
    return [];
  }

  return (data ?? [])
    .filter((sale) => !linkedSaleIds.has(sale.id))
    .map((sale) => ({
      id: sale.id,
      receiptNumber: sale.receipt_number,
      total: toNumber(sale.total),
      createdAt: sale.created_at,
    }));
}
