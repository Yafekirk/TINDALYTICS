import { createClient } from "@/lib/supabase/server";
import {
  addManilaDays,
  manilaWallTimeToUtc,
} from "@/lib/utils/timezone";
import type {
  CashierOption,
  SaleAuditEvent,
  SaleDetail,
  SaleItemDetail,
  SaleListFilters,
  SaleListItem,
  SaleListResult,
  SalePaymentDetail,
  SaleStatus,
  SaleSummary,
} from "@/types/sales";

const DEFAULT_PAGE_SIZE = 15;

type SaleRow = {
  id: string;
  receipt_number: string;
  status: string;
  payment_method: string;
  subtotal: number | string;
  discount: number | string;
  total: number | string;
  cash_received: number | string | null;
  change_amount: number | string | null;
  cashier_id: string | null;
  created_at: string;
  customer: { name: string } | { name: string }[] | null;
  cashier: { full_name: string } | { full_name: string }[] | null;
  sale_items: { id: string }[] | null;
};

function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function resolveStatus(status?: string | null): SaleStatus | "all" {
  if (status === "completed" || status === "voided" || status === "refunded") {
    return status;
  }
  return "all";
}

function parseDateOnly(value?: string | null): {
  year: number;
  month: number;
  day: number;
} | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day };
}

function dateRangeBounds(dateFrom?: string, dateTo?: string) {
  const fromParts = parseDateOnly(dateFrom);
  const toParts = parseDateOnly(dateTo);

  const from = fromParts
    ? manilaWallTimeToUtc(fromParts.year, fromParts.month, fromParts.day, 0, 0, 0)
    : null;

  let toExclusive: Date | null = null;
  if (toParts) {
    const toStart = manilaWallTimeToUtc(
      toParts.year,
      toParts.month,
      toParts.day,
      0,
      0,
      0,
    );
    toExclusive = addManilaDays(toStart, 1);
  }

  return {
    fromIso: from?.toISOString() ?? null,
    toExclusiveIso: toExclusive?.toISOString() ?? null,
  };
}

function mapSaleListItem(row: SaleRow): SaleListItem {
  return {
    id: row.id,
    receiptNumber: row.receipt_number,
    status: row.status as SaleStatus,
    paymentMethod: row.payment_method,
    subtotal: toNumber(row.subtotal),
    discount: toNumber(row.discount),
    total: toNumber(row.total),
    cashReceived:
      row.cash_received == null ? null : toNumber(row.cash_received),
    changeAmount:
      row.change_amount == null ? null : toNumber(row.change_amount),
    customerName: unwrapOne(row.customer)?.name ?? null,
    cashierId: row.cashier_id,
    cashierName: unwrapOne(row.cashier)?.full_name ?? null,
    itemCount: row.sale_items?.length ?? 0,
    createdAt: row.created_at,
  };
}

function emptySummary(): SaleSummary {
  return {
    transactionCount: 0,
    completedCount: 0,
    voidedCount: 0,
    refundedCount: 0,
    completedSales: 0,
    averageTicket: 0,
  };
}

export async function listCashiers(storeId: string): Promise<CashierOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_members")
    .select("user_id, profile:profiles!store_members_user_id_fkey(full_name)")
    .eq("store_id", storeId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("listCashiers:", error.message);
    return [];
  }

  const options: CashierOption[] = [];
  for (const row of data ?? []) {
    const profile = unwrapOne(
      row.profile as { full_name: string } | { full_name: string }[] | null,
    );
    if (!row.user_id) continue;
    options.push({
      id: row.user_id,
      fullName: profile?.full_name?.trim() || "Team member",
    });
  }

  return options;
}

export async function listSales(
  storeId: string,
  filters: SaleListFilters = {},
): Promise<SaleListResult> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE));
  const status = resolveStatus(filters.status);
  const q = filters.q?.trim() ?? "";
  const { fromIso, toExclusiveIso } = dateRangeBounds(
    filters.dateFrom,
    filters.dateTo,
  );
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("sales")
    .select(
      `
      id, receipt_number, status, payment_method, subtotal, discount, total,
      cash_received, change_amount, cashier_id, created_at,
      customer:customers(name),
      cashier:profiles!sales_cashier_id_fkey(full_name),
      sale_items(id)
    `,
      { count: "exact" },
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status !== "all") query = query.eq("status", status);
  if (filters.paymentMethod) {
    query = query.eq("payment_method", filters.paymentMethod);
  }
  if (filters.cashierId) query = query.eq("cashier_id", filters.cashierId);
  if (fromIso) query = query.gte("created_at", fromIso);
  if (toExclusiveIso) query = query.lt("created_at", toExclusiveIso);
  if (q) {
    query = query.or(
      `receipt_number.ilike.%${q}%,notes.ilike.%${q}%`,
    );
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("listSales:", error.message);
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 1,
      summary: emptySummary(),
    };
  }

  const summary = await getSalesSummary(storeId, {
    ...filters,
    status: "all",
  });

  const total = count ?? 0;

  return {
    items: ((data ?? []) as unknown as SaleRow[]).map(mapSaleListItem),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    summary,
  };
}

export async function getSalesSummary(
  storeId: string,
  filters: SaleListFilters = {},
): Promise<SaleSummary> {
  const supabase = await createClient();
  const { fromIso, toExclusiveIso } = dateRangeBounds(
    filters.dateFrom,
    filters.dateTo,
  );
  const q = filters.q?.trim() ?? "";

  let query = supabase
    .from("sales")
    .select("status, total")
    .eq("store_id", storeId);

  if (filters.paymentMethod) {
    query = query.eq("payment_method", filters.paymentMethod);
  }
  if (filters.cashierId) query = query.eq("cashier_id", filters.cashierId);
  if (fromIso) query = query.gte("created_at", fromIso);
  if (toExclusiveIso) query = query.lt("created_at", toExclusiveIso);
  if (q) {
    query = query.or(
      `receipt_number.ilike.%${q}%,notes.ilike.%${q}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("getSalesSummary:", error.message);
    return emptySummary();
  }

  let completedCount = 0;
  let voidedCount = 0;
  let refundedCount = 0;
  let completedSales = 0;

  for (const row of data ?? []) {
    if (row.status === "completed") {
      completedCount += 1;
      completedSales += toNumber(row.total);
    } else if (row.status === "voided") {
      voidedCount += 1;
    } else if (row.status === "refunded") {
      refundedCount += 1;
    }
  }

  const transactionCount = (data ?? []).length;

  return {
    transactionCount,
    completedCount,
    voidedCount,
    refundedCount,
    completedSales,
    averageTicket:
      completedCount > 0 ? completedSales / completedCount : 0,
  };
}

export async function getSaleDetail(
  storeId: string,
  saleId: string,
): Promise<SaleDetail | null> {
  const supabase = await createClient();

  const { data: sale, error } = await supabase
    .from("sales")
    .select(
      `
      id, receipt_number, status, payment_method, subtotal, discount, total,
      cash_received, change_amount, notes, status_reason, status_changed_at,
      cashier_id, customer_id, created_at, updated_at,
      customer:customers(name),
      cashier:profiles!sales_cashier_id_fkey(full_name),
      status_changer:profiles!sales_status_changed_by_fkey(full_name),
      store:stores(name, address),
      sale_items(
        id, product_id, quantity, unit_price, line_total,
        product:products(name, sku, unit)
      ),
      payments(id, method, amount, reference, created_at)
    `,
    )
    .eq("store_id", storeId)
    .eq("id", saleId)
    .maybeSingle();

  if (error || !sale) {
    if (error) console.error("getSaleDetail:", error.message);
    return null;
  }

  const { data: auditRows, error: auditError } = await supabase
    .from("sale_audit_events")
    .select(
      `
      id, action, reason, created_at, metadata,
      actor:profiles!sale_audit_events_created_by_fkey(full_name)
    `,
    )
    .eq("store_id", storeId)
    .eq("sale_id", saleId)
    .order("created_at", { ascending: false });

  if (auditError) {
    console.error("getSaleDetail audit:", auditError.message);
  }

  const customer = unwrapOne(
    sale.customer as { name: string } | { name: string }[] | null,
  );
  const cashier = unwrapOne(
    sale.cashier as { full_name: string } | { full_name: string }[] | null,
  );
  const statusChanger = unwrapOne(
    sale.status_changer as
      | { full_name: string }
      | { full_name: string }[]
      | null,
  );
  const store = unwrapOne(
    sale.store as
      | { name: string; address: string | null }
      | { name: string; address: string | null }[]
      | null,
  );

  const items: SaleItemDetail[] = (
    (sale.sale_items as Array<{
      id: string;
      product_id: string;
      quantity: number | string;
      unit_price: number | string;
      line_total: number | string;
      product:
        | { name: string; sku: string; unit: string }
        | { name: string; sku: string; unit: string }[]
        | null;
    }>) ?? []
  ).map((item) => {
    const product = unwrapOne(item.product);
    return {
      id: item.id,
      productId: item.product_id,
      productName: product?.name ?? "Product",
      sku: product?.sku ?? "—",
      unit: product?.unit ?? "pc",
      quantity: toNumber(item.quantity),
      unitPrice: toNumber(item.unit_price),
      lineTotal: toNumber(item.line_total),
    };
  });

  const payments: SalePaymentDetail[] = (
    (sale.payments as Array<{
      id: string;
      method: string;
      amount: number | string;
      reference: string | null;
      created_at: string;
    }>) ?? []
  ).map((payment) => ({
    id: payment.id,
    method: payment.method,
    amount: toNumber(payment.amount),
    reference: payment.reference,
    createdAt: payment.created_at,
  }));

  const auditEvents: SaleAuditEvent[] = (
    (auditRows as Array<{
      id: string;
      action: string;
      reason: string | null;
      created_at: string;
      metadata: Record<string, unknown> | null;
      actor: { full_name: string } | { full_name: string }[] | null;
    }>) ?? []
  ).map((event) => ({
    id: event.id,
    action: event.action,
    reason: event.reason,
    createdByName: unwrapOne(event.actor)?.full_name ?? null,
    createdAt: event.created_at,
    metadata: event.metadata ?? {},
  }));

  return {
    id: sale.id,
    receiptNumber: sale.receipt_number,
    status: sale.status as SaleStatus,
    paymentMethod: sale.payment_method,
    subtotal: toNumber(sale.subtotal),
    discount: toNumber(sale.discount),
    total: toNumber(sale.total),
    cashReceived:
      sale.cash_received == null ? null : toNumber(sale.cash_received),
    changeAmount:
      sale.change_amount == null ? null : toNumber(sale.change_amount),
    notes: sale.notes,
    statusReason: sale.status_reason,
    statusChangedAt: sale.status_changed_at,
    statusChangedByName: statusChanger?.full_name ?? null,
    customerId: sale.customer_id,
    customerName: customer?.name ?? null,
    cashierId: sale.cashier_id,
    cashierName: cashier?.full_name ?? null,
    storeName: store?.name ?? "Store",
    storeAddress: store?.address ?? null,
    createdAt: sale.created_at,
    updatedAt: sale.updated_at,
    items,
    payments,
    auditEvents,
  };
}
