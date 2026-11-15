import { createClient } from "@/lib/supabase/server";
import type {
  CategoryOption,
  ProductDetail,
  ProductListFilters,
  ProductListItem,
  ProductListResult,
  ProductSortField,
  ProductStatusFilter,
  SupplierOption,
} from "@/types/product";

const DEFAULT_PAGE_SIZE = 10;

type ProductJoinRow = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  cost_price: number | string;
  selling_price: number | string;
  unit: string;
  min_stock_level: number | string;
  is_active: boolean;
  archived_at: string | null;
  image_url: string | null;
  category_id: string | null;
  supplier_id: string | null;
  created_at: string;
  updated_at: string;
  category: { name: string } | { name: string }[] | null;
  supplier: { name: string } | { name: string }[] | null;
  inventory: { quantity: number | string } | { quantity: number | string }[] | null;
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

function mapProduct(row: ProductJoinRow): ProductListItem {
  const category = unwrapOne(row.category);
  const supplier = unwrapOne(row.supplier);
  const inventory = unwrapOne(row.inventory);

  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode,
    description: row.description,
    costPrice: toNumber(row.cost_price),
    sellingPrice: toNumber(row.selling_price),
    unit: row.unit,
    minStockLevel: toNumber(row.min_stock_level),
    isActive: row.is_active,
    archivedAt: row.archived_at,
    imageUrl: row.image_url,
    categoryId: row.category_id,
    categoryName: category?.name ?? null,
    supplierId: row.supplier_id,
    supplierName: supplier?.name ?? null,
    stock: toNumber(inventory?.quantity),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function resolveStatus(status?: string | null): ProductStatusFilter {
  if (status === "archived" || status === "all" || status === "active") {
    return status;
  }
  return "active";
}

function resolveSort(sort?: string | null): ProductSortField {
  if (
    sort === "sku" ||
    sort === "selling_price" ||
    sort === "created_at" ||
    sort === "stock" ||
    sort === "name"
  ) {
    return sort;
  }
  return "name";
}

const productSelect = `
  id, name, sku, barcode, description, cost_price, selling_price, unit,
  min_stock_level, is_active, archived_at, image_url, category_id, supplier_id,
  created_at, updated_at,
  category:categories(name),
  supplier:suppliers(name),
  inventory(quantity)
`;

export async function listProducts(
  storeId: string,
  filters: ProductListFilters = {},
): Promise<ProductListResult> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE));
  const status = resolveStatus(filters.status);
  const sort = resolveSort(filters.sort);
  const dir = filters.dir === "desc" ? "desc" : "asc";
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("products")
    .select(productSelect, { count: "exact" })
    .eq("store_id", storeId);

  if (status === "active") {
    query = query.is("archived_at", null);
  } else if (status === "archived") {
    query = query.not("archived_at", "is", null);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.q?.trim()) {
    const term = filters.q.trim().replace(/[%_,]/g, "");
    query = query.or(
      `name.ilike.%${term}%,sku.ilike.%${term}%,barcode.ilike.%${term}%`,
    );
  }

  if (sort === "stock") {
    // Stock lives on inventory; fetch a wider window then sort in memory for this page.
    const { data, error, count } = await query.order("name", { ascending: true });
    if (error) {
      console.error("listProducts:", error.message);
      return { items: [], total: 0, page, pageSize, totalPages: 0 };
    }

    const mapped = ((data ?? []) as unknown as ProductJoinRow[])
      .map(mapProduct)
      .sort((a, b) =>
        dir === "asc" ? a.stock - b.stock : b.stock - a.stock,
      );

    const items = mapped.slice(from, to + 1);
    const total = count ?? mapped.length;
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  const column =
    sort === "selling_price"
      ? "selling_price"
      : sort === "created_at"
        ? "created_at"
        : sort === "sku"
          ? "sku"
          : "name";

  const { data, error, count } = await query
    .order(column, { ascending: dir === "asc" })
    .range(from, to);

  if (error) {
    console.error("listProducts:", error.message);
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const total = count ?? 0;
  return {
    items: ((data ?? []) as unknown as ProductJoinRow[]).map(mapProduct),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize) || 1),
  };
}

export async function getProduct(
  storeId: string,
  productId: string,
): Promise<ProductDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("store_id", storeId)
    .eq("id", productId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("getProduct:", error.message);
    return null;
  }

  return mapProduct(data as unknown as ProductJoinRow);
}

export async function listCategories(storeId: string): Promise<CategoryOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("store_id", storeId)
    .order("name", { ascending: true });

  if (error) {
    console.error("listCategories:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({ id: row.id, name: row.name }));
}

export async function listSuppliers(storeId: string): Promise<SupplierOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, name")
    .eq("store_id", storeId)
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("listSuppliers:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({ id: row.id, name: row.name }));
}
