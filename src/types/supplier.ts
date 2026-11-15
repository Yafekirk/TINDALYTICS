export type SupplierStatusFilter = "active" | "archived" | "all";

export type SupplierListFilters = {
  q?: string;
  status?: SupplierStatusFilter;
  page?: number;
  pageSize?: number;
};

export type SupplierListItem = {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  archivedAt: string | null;
  productCount: number;
  purchaseOrderCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SupplierListResult = {
  items: SupplierListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type SupplierProduct = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  isActive: boolean;
};

export type SupplierPurchaseOrder = {
  id: string;
  poNumber: string;
  status: string;
  orderDate: string;
  totalAmount: number;
  createdAt: string;
};

export type SupplierDetail = SupplierListItem & {
  products: SupplierProduct[];
  purchaseOrders: SupplierPurchaseOrder[];
};
