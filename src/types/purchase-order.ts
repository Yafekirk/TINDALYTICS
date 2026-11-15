export type PurchaseOrderStatus =
  | "draft"
  | "ordered"
  | "partially_received"
  | "received"
  | "cancelled";

export type PurchaseOrderListFilters = {
  q?: string;
  status?: PurchaseOrderStatus | "all";
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type PurchaseOrderListItem = {
  id: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  supplierId: string | null;
  supplierName: string | null;
  orderDate: string;
  expectedDate: string | null;
  totalAmount: number;
  itemCount: number;
  createdByName: string | null;
  createdAt: string;
};

export type PurchaseOrderSummary = {
  draftCount: number;
  orderedCount: number;
  partiallyReceivedCount: number;
  receivedCount: number;
  openOrderValue: number;
};

export type PurchaseOrderListResult = {
  items: PurchaseOrderListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: PurchaseOrderSummary;
};

export type PurchaseOrderItemDetail = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
  lineTotal: number;
};

export type PurchaseOrderDetail = {
  id: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  supplierId: string | null;
  supplierName: string | null;
  orderDate: string;
  expectedDate: string | null;
  notes: string | null;
  totalAmount: number;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  items: PurchaseOrderItemDetail[];
};

export type PurchaseOrderLineInput = {
  productId: string;
  quantity: number;
  unitCost: number;
};

export type ProductOptionForPo = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  costPrice: number;
  supplierId: string | null;
};
