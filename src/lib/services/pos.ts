import { createClient } from "@/lib/supabase/server";
import type { PosProduct, ReceiptData } from "@/types/pos";

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  selling_price: number | string;
  category_id: string | null;
  image_url: string | null;
  category: { name: string } | { name: string }[] | null;
  inventory:
    | { quantity: number | string }
    | { quantity: number | string }[]
    | null;
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

export async function listPosProducts(storeId: string): Promise<PosProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id, name, sku, unit, selling_price, category_id, image_url,
      category:categories(name),
      inventory(quantity)
    `,
    )
    .eq("store_id", storeId)
    .eq("is_active", true)
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("listPosProducts:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as ProductRow[]).map((row) => {
    const inventory = unwrapOne(row.inventory);
    return {
      id: row.id,
      name: row.name,
      sku: row.sku,
      unit: row.unit,
      sellingPrice: toNumber(row.selling_price),
      categoryId: row.category_id,
      categoryName: unwrapOne(row.category)?.name ?? null,
      imageUrl: row.image_url,
      stock: toNumber(inventory?.quantity),
    };
  });
}

export async function getSaleReceipt(
  storeId: string,
  saleId: string,
): Promise<ReceiptData | null> {
  const supabase = await createClient();

  const { data: sale, error } = await supabase
    .from("sales")
    .select(
      `
      id, receipt_number, status, payment_method, subtotal, discount, total,
      cash_received, change_amount, created_at,
      cashier:profiles!sales_cashier_id_fkey(full_name),
      customer:customers(name),
      store:stores(name, address),
      sale_items(
        quantity, unit_price, line_total,
        product:products(name, sku, unit)
      )
    `,
    )
    .eq("store_id", storeId)
    .eq("id", saleId)
    .maybeSingle();

  if (error || !sale) {
    if (error) console.error("getSaleReceipt:", error.message);
    return null;
  }

  const cashier = unwrapOne(
    sale.cashier as { full_name: string } | { full_name: string }[] | null,
  );
  const customer = unwrapOne(
    sale.customer as { name: string } | { name: string }[] | null,
  );
  const store = unwrapOne(
    sale.store as
      | { name: string; address: string | null }
      | { name: string; address: string | null }[]
      | null,
  );

  const items = (
    (sale.sale_items as Array<{
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
      name: product?.name ?? "Product",
      sku: product?.sku ?? "—",
      unit: product?.unit ?? "pc",
      quantity: toNumber(item.quantity),
      unitPrice: toNumber(item.unit_price),
      lineTotal: toNumber(item.line_total),
    };
  });

  return {
    saleId: sale.id,
    receiptNumber: sale.receipt_number,
    storeName: store?.name ?? "Store",
    storeAddress: store?.address ?? null,
    cashierName: cashier?.full_name ?? "Cashier",
    customerName: customer?.name ?? null,
    status: sale.status,
    paymentMethod: sale.payment_method,
    subtotal: toNumber(sale.subtotal),
    discount: toNumber(sale.discount),
    total: toNumber(sale.total),
    cashReceived:
      sale.cash_received == null ? null : toNumber(sale.cash_received),
    changeAmount:
      sale.change_amount == null ? null : toNumber(sale.change_amount),
    createdAt: sale.created_at,
    items,
  };
}
