import { createClient } from "@/lib/supabase/server";
import {
  addManilaDays,
  manilaWallTimeToUtc,
} from "@/lib/utils/timezone";
import type {
  ProductOptionForPo,
  PurchaseOrderDetail,
  PurchaseOrderItemDetail,
  PurchaseOrderListFilters,
  PurchaseOrderListItem,
  PurchaseOrderListResult,
  PurchaseOrderStatus,
  PurchaseOrderSummary,
} from "@/types/purchase-order";

const DEFAULT_PAGE_SIZE = 12;

function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function resolveStatus(
  status?: string | null,
): PurchaseOrderStatus | "all" {
  if (
    status === "draft" ||
    status === "ordered" ||
    status === "partially_received" ||
    status === "received" ||
    status === "cancelled"
  ) {
    return status;
  }
  return "all";
}

function parseDateOnly(value?: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day };
}

function dateRangeBounds(dateFrom?: string, dateTo?: string) {
  const fromParts = parseDateOnly(dateFrom);
  const toParts = parseDateOnly(dateTo);
  const from = fromParts
    ? manilaWallTimeToUtc(fromParts.year, fromParts.month, fromParts.day)
    : null;
  let toExclusive: Date | null = null;
  if (toParts) {
    const start = manilaWallTimeToUtc(toParts.year, toParts.month, toParts.day);
    toExclusive = addManilaDays(start, 1);
  }
  return {
    fromIso: from?.toISOString() ?? null,
    toExclusiveIso: toExclusive?.toISOString() ?? null,
  };
}

function emptySummary(): PurchaseOrderSummary {
  return {
    draftCount: 0,
    orderedCount: 0,
    partiallyReceivedCount: 0,
    receivedCount: 0,
    openOrderValue: 0,
  };
}

type PoRow = {
  id: string;
  po_number: string;
  status: string;
  supplier_id: string | null;
  order_date: string;
  expected_date: string | null;
  total_amount: number | string;
  created_at: string;
  supplier: { name: string } | { name: string }[] | null;
  creator: { full_name: string } | { full_name: string }[] | null;
  purchase_order_items: { id: string }[] | null;
};

function mapListItem(row: PoRow): PurchaseOrderListItem {
  return {
    id: row.id,
    poNumber: row.po_number,
    status: row.status as PurchaseOrderStatus,
    supplierId: row.supplier_id,
    supplierName: unwrapOne(row.supplier)?.name ?? null,
    orderDate: row.order_date,
    expectedDate: row.expected_date,
    totalAmount: toNumber(row.total_amount),
    itemCount: row.purchase_order_items?.length ?? 0,
    createdByName: unwrapOne(row.creator)?.full_name ?? null,
    createdAt: row.created_at,
  };
}

export async function listPurchaseOrders(
  storeId: string,
  filters: PurchaseOrderListFilters = {},
): Promise<PurchaseOrderListResult> {
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
    .from("purchase_orders")
    .select(
      `
      id, po_number, status, supplier_id, order_date, expected_date,
      total_amount, created_at,
      supplier:suppliers(name),
      creator:profiles!purchase_orders_created_by_fkey(full_name),
      purchase_order_items(id)
    `,
      { count: "exact" },
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status !== "all") query = query.eq("status", status);
  if (filters.supplierId) query = query.eq("supplier_id", filters.supplierId);
  if (fromIso) query = query.gte("created_at", fromIso);
  if (toExclusiveIso) query = query.lt("created_at", toExclusiveIso);
  if (q) query = query.or(`po_number.ilike.%${q}%,notes.ilike.%${q}%`);

  const { data, error, count } = await query;
  if (error) {
    console.error("listPurchaseOrders:", error.message);
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 1,
      summary: emptySummary(),
    };
  }

  const summary = await getPurchaseOrderSummary(storeId, filters);
  const total = count ?? 0;

  return {
    items: ((data ?? []) as unknown as PoRow[]).map(mapListItem),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    summary,
  };
}

export async function getPurchaseOrderSummary(
  storeId: string,
  filters: PurchaseOrderListFilters = {},
): Promise<PurchaseOrderSummary> {
  const supabase = await createClient();
  const { fromIso, toExclusiveIso } = dateRangeBounds(
    filters.dateFrom,
    filters.dateTo,
  );
  const q = filters.q?.trim() ?? "";

  let query = supabase
    .from("purchase_orders")
    .select("status, total_amount")
    .eq("store_id", storeId);

  if (filters.supplierId) query = query.eq("supplier_id", filters.supplierId);
  if (fromIso) query = query.gte("created_at", fromIso);
  if (toExclusiveIso) query = query.lt("created_at", toExclusiveIso);
  if (q) query = query.or(`po_number.ilike.%${q}%,notes.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) {
    console.error("getPurchaseOrderSummary:", error.message);
    return emptySummary();
  }

  const summary = emptySummary();
  for (const row of data ?? []) {
    if (row.status === "draft") summary.draftCount += 1;
    if (row.status === "ordered") {
      summary.orderedCount += 1;
      summary.openOrderValue += toNumber(row.total_amount);
    }
    if (row.status === "partially_received") {
      summary.partiallyReceivedCount += 1;
      summary.openOrderValue += toNumber(row.total_amount);
    }
    if (row.status === "received") summary.receivedCount += 1;
  }
  return summary;
}

export async function getPurchaseOrder(
  storeId: string,
  purchaseOrderId: string,
): Promise<PurchaseOrderDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_orders")
    .select(
      `
      id, po_number, status, supplier_id, order_date, expected_date, notes,
      total_amount, created_at, updated_at,
      supplier:suppliers(name),
      creator:profiles!purchase_orders_created_by_fkey(full_name),
      purchase_order_items(
        id, product_id, quantity, received_quantity, unit_cost,
        product:products(name, sku, unit)
      )
    `,
    )
    .eq("store_id", storeId)
    .eq("id", purchaseOrderId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("getPurchaseOrder:", error.message);
    return null;
  }

  const items: PurchaseOrderItemDetail[] = (
    (data.purchase_order_items as Array<{
      id: string;
      product_id: string;
      quantity: number | string;
      received_quantity: number | string;
      unit_cost: number | string;
      product:
        | { name: string; sku: string; unit: string }
        | { name: string; sku: string; unit: string }[]
        | null;
    }>) ?? []
  ).map((item) => {
    const product = unwrapOne(item.product);
    const quantity = toNumber(item.quantity);
    const unitCost = toNumber(item.unit_cost);
    return {
      id: item.id,
      productId: item.product_id,
      productName: product?.name ?? "Product",
      sku: product?.sku ?? "—",
      unit: product?.unit ?? "pc",
      quantity,
      receivedQuantity: toNumber(item.received_quantity),
      unitCost,
      lineTotal: Math.round(quantity * unitCost * 100) / 100,
    };
  });

  return {
    id: data.id,
    poNumber: data.po_number,
    status: data.status as PurchaseOrderStatus,
    supplierId: data.supplier_id,
    supplierName: unwrapOne(
      data.supplier as { name: string } | { name: string }[] | null,
    )?.name ?? null,
    orderDate: data.order_date,
    expectedDate: data.expected_date,
    notes: data.notes,
    totalAmount: toNumber(data.total_amount),
    createdByName: unwrapOne(
      data.creator as { full_name: string } | { full_name: string }[] | null,
    )?.full_name ?? null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    items,
  };
}

export async function listProductsForPurchaseOrder(
  storeId: string,
  supplierId?: string | null,
): Promise<ProductOptionForPo[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("id, name, sku, unit, cost_price, supplier_id")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (supplierId) {
    query = query.or(`supplier_id.eq.${supplierId},supplier_id.is.null`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("listProductsForPurchaseOrder:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    unit: row.unit,
    costPrice: toNumber(row.cost_price),
    supplierId: row.supplier_id,
  }));
}

export async function generateNextPoNumber(storeId: string): Promise<string> {
  const supabase = await createClient();
  const manilaToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // YYYY-MM-DD
  const compact = manilaToday.replaceAll("-", "");

  const { count } = await supabase
    .from("purchase_orders")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId)
    .like("po_number", `PO-${compact}-%`);

  const seq = String((count ?? 0) + 1).padStart(4, "0");
  return `PO-${compact}-${seq}`;
}
