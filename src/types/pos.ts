export type PaymentMethod = "cash" | "gcash" | "other";

export type PosProduct = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  sellingPrice: number;
  categoryId: string | null;
  categoryName: string | null;
  imageUrl: string | null;
  stock: number;
};

export type CartLine = {
  productId: string;
  name: string;
  sku: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  stock: number;
  imageUrl: string | null;
};

export type CheckoutPayload = {
  items: { productId: string; quantity: number }[];
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  discount?: number;
  customerId?: string | null;
  notes?: string | null;
  idempotencyKey: string;
};

export type CheckoutResult = {
  saleId: string;
  receiptNumber: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived: number;
  changeAmount: number;
  replayed: boolean;
};

export type ReceiptData = {
  saleId: string;
  receiptNumber: string;
  storeName: string;
  storeAddress: string | null;
  cashierName: string;
  customerName: string | null;
  status: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  total: number;
  cashReceived: number | null;
  changeAmount: number | null;
  createdAt: string;
  items: {
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    unit: string;
  }[];
};
