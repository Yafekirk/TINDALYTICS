import { createClient } from "@/lib/supabase/server";
import type {
  SupplierDetail,
  SupplierListFilters,
  SupplierListItem,
  SupplierListResult,
  SupplierProduct,
  SupplierPurchaseOrder,
  SupplierStatusFilter,
} from "@/types/supplier";

const DEFAULT_PAGE_SIZE = 12;

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveStatus(status?: string | null): SupplierStatusFilter {
  if (status === "archived" || status === "all" || status === "active") {
    return status;
  }
  return "active";
}

type SupplierRow = {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  products: { id: string }[] | null;
  purchase_orders: { id: string }[] | null;
};

function mapSupplier(row: SupplierRow): SupplierListItem {
  return {
    id: row.id,
    name: row.name,
    contactPerson: row.contact_person,
    phone: row.phone,
    email: row.email,
    address: row.address,
    notes: row.notes,
    archivedAt: row.archived_at,
    productCount: row.products?.length ?? 0,
    purchaseOrderCount: row.purchase_orders?.length ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listSuppliersDetailed(
  storeId: string,
  filters: SupplierListFilters = {},
): Promise<SupplierListResult> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE));
  const status = resolveStatus(filters.status);
  const q = filters.q?.trim() ?? "";
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("suppliers")
    .select(
      `
      id, name, contact_person, phone, email, address, notes, archived_at,
      created_at, updated_at,
      products(id),
      purchase_orders(id)
    `,
      { count: "exact" },
    )
    .eq("store_id", storeId)
    .order("name", { ascending: true })
    .range(from, to);

  if (status === "active") query = query.is("archived_at", null);
  if (status === "archived") query = query.not("archived_at", "is", null);
  if (q) {
    query = query.or(
      `name.ilike.%${q}%,contact_person.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`,
    );
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("listSuppliersDetailed:", error.message);
    return { items: [], total: 0, page, pageSize, totalPages: 1 };
  }

  const total = count ?? 0;
  return {
    items: ((data ?? []) as unknown as SupplierRow[]).map(mapSupplier),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getSupplier(
  storeId: string,
  supplierId: string,
): Promise<SupplierDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("suppliers")
    .select(
      `
      id, name, contact_person, phone, email, address, notes, archived_at,
      created_at, updated_at,
      products(
        id, name, sku, unit, cost_price, selling_price, is_active, archived_at,
        inventory(quantity)
      ),
      purchase_orders(id, po_number, status, order_date, total_amount, created_at)
    `,
    )
    .eq("store_id", storeId)
    .eq("id", supplierId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("getSupplier:", error.message);
    return null;
  }

  const products: SupplierProduct[] = (
    (data.products as Array<{
      id: string;
      name: string;
      sku: string;
      unit: string;
      cost_price: number | string;
      selling_price: number | string;
      is_active: boolean;
      archived_at: string | null;
      inventory:
        | { quantity: number | string }
        | { quantity: number | string }[]
        | null;
    }>) ?? []
  )
    .filter((product) => !product.archived_at)
    .map((product) => {
      const inventory = unwrapOne(product.inventory);
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        costPrice: toNumber(product.cost_price),
        sellingPrice: toNumber(product.selling_price),
        stock: toNumber(inventory?.quantity),
        isActive: product.is_active,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const purchaseOrders: SupplierPurchaseOrder[] = (
    (data.purchase_orders as Array<{
      id: string;
      po_number: string;
      status: string;
      order_date: string;
      total_amount: number | string;
      created_at: string;
    }>) ?? []
  )
    .map((po) => ({
      id: po.id,
      poNumber: po.po_number,
      status: po.status,
      orderDate: po.order_date,
      totalAmount: toNumber(po.total_amount),
      createdAt: po.created_at,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const base = mapSupplier({
    ...(data as unknown as SupplierRow),
    products: products.map((p) => ({ id: p.id })),
    purchase_orders: purchaseOrders.map((p) => ({ id: p.id })),
  });

  return {
    ...base,
    products,
    purchaseOrders,
  };
}
