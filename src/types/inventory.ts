export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

export type InventoryStatusFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

export type InventorySortField = "name" | "sku" | "quantity" | "value";

export type ManualMovementType = "stock_in" | "stock_out" | "adjustment";

export type InventoryRow = {
  inventoryId: string | null;
  productId: string;
  name: string;
  sku: string;
  unit: string;
  categoryName: string | null;
  costPrice: number;
  sellingPrice: number;
  minStockLevel: number;
  quantity: number;
  valueAtCost: number;
  status: StockStatus;
  isActive: boolean;
};

export type InventorySummary = {
  totalSkus: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  valuationAtCost: number;
  valuationAtRetail: number;
};

export type InventoryListResult = {
  items: InventoryRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: InventorySummary;
};

export type InventoryListFilters = {
  q?: string;
  categoryId?: string;
  status?: InventoryStatusFilter;
  sort?: InventorySortField;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export type InventoryMovementRow = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  movementType: string;
  quantity: number;
  notes: string | null;
  createdByName: string | null;
  createdAt: string;
};
