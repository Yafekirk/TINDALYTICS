import { createClient } from "@/lib/supabase/server";
import type {
  InventoryListFilters,
  InventoryListResult,
  InventoryMovementRow,
  InventoryRow,
  InventorySortField,
  InventoryStatusFilter,
  InventorySummary,
  StockStatus,
} from "@/types/inventory";

const DEFAULT_PAGE_SIZE = 10;

type ProductInventoryRow = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  cost_price: number | string;
  selling_price: number | string;
  min_stock_level: number | string;
  is_active: boolean;
  archived_at: string | null;
  category_id: string | null;
  category: { name: string } | { name: string }[] | null;
  inventory:
    | { id: string; quantity: number | string }
    | { id: string; quantity: number | string }[]
    | null;
};

type MovementJoinRow = {
  id: string;
  product_id: string;
  movement_type: string;
  quantity: number | string;
  notes: string | null;
  created_at: string;
  product: {
    name: string;
    sku: string;
    unit: string;
  } | null;
  created_by_profile: { full_name: string } | { full_name: string }[] | null;
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

export function getStockStatus(quantity: number, minStock: number): StockStatus {
  if (quantity <= 0) return "Out of Stock";
  if (quantity <= minStock) return "Low Stock";
  return "In Stock";
}

function resolveStatus(status?: string | null): InventoryStatusFilter {
  if (
    status === "in_stock" ||
    status === "low_stock" ||
    status === "out_of_stock" ||
    status === "all"
  ) {
    return status;
  }
  return "all";
}

function resolveSort(sort?: string | null): InventorySortField {
  if (sort === "sku" || sort === "quantity" || sort === "value" || sort === "name") {
    return sort;
  }
  return "name";
}

function mapRow(row: ProductInventoryRow): InventoryRow {
  const inventory = unwrapOne(row.inventory);
  const quantity = toNumber(inventory?.quantity);
  const costPrice = toNumber(row.cost_price);
  const minStock = toNumber(row.min_stock_level);

  return {
    inventoryId: inventory?.id ?? null,
    productId: row.id,
    name: row.name,
    sku: row.sku,
    unit: row.unit,
    categoryName: unwrapOne(row.category)?.name ?? null,
    costPrice,
    sellingPrice: toNumber(row.selling_price),
    minStockLevel: minStock,
    quantity,
    valueAtCost: quantity * costPrice,
    status: getStockStatus(quantity, minStock),
    isActive: row.is_active,
  };
}

function buildSummary(items: InventoryRow[]): InventorySummary {
  return items.reduce<InventorySummary>(
    (acc, item) => {
      acc.totalSkus += 1;
      acc.valuationAtCost += item.valueAtCost;
      acc.valuationAtRetail += item.quantity * item.sellingPrice;
      if (item.status === "In Stock") acc.inStock += 1;
      if (item.status === "Low Stock") acc.lowStock += 1;
      if (item.status === "Out of Stock") acc.outOfStock += 1;
      return acc;
    },
    {
      totalSkus: 0,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
      valuationAtCost: 0,
      valuationAtRetail: 0,
    },
  );
}

export async function listInventory(
  storeId: string,
  filters: InventoryListFilters = {},
): Promise<InventoryListResult> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE));
  const status = resolveStatus(filters.status);
  const sort = resolveSort(filters.sort);
  const dir = filters.dir === "desc" ? "desc" : "asc";

  let query = supabase
    .from("products")
    .select(
      `
      id, name, sku, unit, cost_price, selling_price, min_stock_level,
      is_active, archived_at, category_id,
      category:categories(name),
      inventory(id, quantity)
    `,
    )
    .eq("store_id", storeId)
    .is("archived_at", null)
    .eq("is_active", true);

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.q?.trim()) {
    const term = filters.q.trim().replace(/[%_,]/g, "");
    query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
  }

  const { data, error } = await query.order("name", { ascending: true });

  if (error) {
    console.error("listInventory:", error.message);
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      summary: {
        totalSkus: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
        valuationAtCost: 0,
        valuationAtRetail: 0,
      },
    };
  }

  let mapped = ((data ?? []) as unknown as ProductInventoryRow[]).map(mapRow);
  const summary = buildSummary(mapped);

  if (status === "in_stock") {
    mapped = mapped.filter((item) => item.status === "In Stock");
  } else if (status === "low_stock") {
    mapped = mapped.filter((item) => item.status === "Low Stock");
  } else if (status === "out_of_stock") {
    mapped = mapped.filter((item) => item.status === "Out of Stock");
  }

  mapped.sort((a, b) => {
    let comparison = 0;
    if (sort === "sku") comparison = a.sku.localeCompare(b.sku);
    else if (sort === "quantity") comparison = a.quantity - b.quantity;
    else if (sort === "value") comparison = a.valueAtCost - b.valueAtCost;
    else comparison = a.name.localeCompare(b.name);
    return dir === "asc" ? comparison : -comparison;
  });

  const total = mapped.length;
  const from = (page - 1) * pageSize;
  const items = mapped.slice(from, from + pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize) || 1),
    summary,
  };
}

export async function listInventoryMovements(
  storeId: string,
  options: { productId?: string; limit?: number; page?: number } = {},
): Promise<{ items: InventoryMovementRow[]; total: number }> {
  const supabase = await createClient();
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(50, Math.max(1, options.limit ?? 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("inventory_movements")
    .select(
      `
      id, product_id, movement_type, quantity, notes, created_at,
      product:products(name, sku, unit),
      created_by_profile:profiles!inventory_movements_created_by_fkey(full_name)
    `,
      { count: "exact" },
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options.productId) {
    query = query.eq("product_id", options.productId);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("listInventoryMovements:", error.message);
    return { items: [], total: 0 };
  }

  const items: InventoryMovementRow[] = (
    (data ?? []) as unknown as MovementJoinRow[]
  ).map((row) => {
    const product = unwrapOne(row.product);
    const createdBy = unwrapOne(row.created_by_profile);
    return {
      id: row.id,
      productId: row.product_id,
      productName: product?.name ?? "Unknown product",
      sku: product?.sku ?? "—",
      unit: product?.unit ?? "pc",
      movementType: row.movement_type,
      quantity: toNumber(row.quantity),
      notes: row.notes,
      createdByName: createdBy?.full_name ?? null,
      createdAt: row.created_at,
    };
  });

  return { items, total: count ?? items.length };
}

export async function getLowStockAlerts(storeId: string, limit = 8) {
  const result = await listInventory(storeId, {
    status: "all",
    page: 1,
    pageSize: 500,
  });

  return result.items
    .filter((item) => item.status !== "In Stock")
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, limit);
}
