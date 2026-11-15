export type ProductStatusFilter = "active" | "archived" | "all";

export type ProductSortField =
  | "name"
  | "sku"
  | "selling_price"
  | "created_at"
  | "stock";

export type ProductSortDirection = "asc" | "desc";

export type ProductListItem = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  costPrice: number;
  sellingPrice: number;
  unit: string;
  minStockLevel: number;
  isActive: boolean;
  archivedAt: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  supplierId: string | null;
  supplierName: string | null;
  stock: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductDetail = ProductListItem;

export type CategoryOption = {
  id: string;
  name: string;
};

export type SupplierOption = {
  id: string;
  name: string;
};

export type ProductListResult = {
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ProductListFilters = {
  q?: string;
  categoryId?: string;
  status?: ProductStatusFilter;
  sort?: ProductSortField;
  dir?: ProductSortDirection;
  page?: number;
  pageSize?: number;
};
