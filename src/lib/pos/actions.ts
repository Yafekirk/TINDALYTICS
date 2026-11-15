"use server";

import { revalidatePath } from "next/cache";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { checkoutSchema } from "@/lib/validations/pos";
import type { CheckoutPayload, CheckoutResult, PaymentMethod } from "@/types/pos";

export type CheckoutActionResult =
  | { ok: true; data: CheckoutResult }
  | { ok: false; error: string };

function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function checkoutAction(
  payload: CheckoutPayload,
): Promise<CheckoutActionResult> {
  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid checkout details",
    };
  }

  const { supabase, store, role } = await getCurrentStoreContext();
  if (!store) {
    return { ok: false, error: "No store found for this account." };
  }

  const input = parsed.data;

  if ((input.discount ?? 0) > 0 && role !== "owner" && role !== "manager") {
    return {
      ok: false,
      error: "Only owners or managers can apply discounts.",
    };
  }

  const { data, error } = await supabase.rpc("pos_checkout", {
    target_store_id: store.id,
    cart_items: input.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
    })),
    p_payment_method: input.paymentMethod,
    p_cash_received: input.cashReceived ?? null,
    p_discount: input.discount ?? 0,
    p_customer_id: input.customerId ?? null,
    p_notes: input.notes ?? null,
    p_idempotency_key: input.idempotencyKey,
  });

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Checkout failed" };
  }

  const result = data as Record<string, unknown>;

  revalidatePath("/pos");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  revalidatePath("/inventory/movements");
  revalidatePath("/sales");
  revalidatePath("/products");

  return {
    ok: true,
    data: {
      saleId: String(result.sale_id),
      receiptNumber: String(result.receipt_number),
      subtotal: toNumber(result.subtotal),
      discount: toNumber(result.discount),
      total: toNumber(result.total),
      paymentMethod: String(result.payment_method) as PaymentMethod,
      cashReceived: toNumber(result.cash_received),
      changeAmount: toNumber(result.change_amount),
      replayed: Boolean(result.replayed),
    },
  };
}
