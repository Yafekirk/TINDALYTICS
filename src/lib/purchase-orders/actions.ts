"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { generateNextPoNumber } from "@/lib/services/purchase-orders";
import {
  purchaseOrderSchema,
  receivePurchaseOrderSchema,
  type PurchaseOrderInput,
} from "@/lib/validations/purchase-order";

export type PurchaseOrderActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

function requireManager(role: string | null) {
  return role === "owner" || role === "manager";
}

function revalidatePoPaths(poId?: string) {
  revalidatePath("/purchase-orders");
  revalidatePath("/inventory");
  revalidatePath("/inventory/movements");
  revalidatePath("/dashboard");
  revalidatePath("/suppliers");
  if (poId) {
    revalidatePath(`/purchase-orders/${poId}`);
  }
}

function parsePurchaseOrderPayload(formData: FormData) {
  let items: PurchaseOrderInput["items"] = [];
  const rawItems = String(formData.get("itemsJson") || "");
  try {
    const parsed = JSON.parse(rawItems) as Array<{
      productId: string;
      quantity: number;
      unitCost: number;
    }>;
    items = parsed.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
    }));
  } catch {
    items = [];
  }

  return purchaseOrderSchema.safeParse({
    supplierId: String(formData.get("supplierId") || ""),
    orderDate: String(formData.get("orderDate") || ""),
    expectedDate: String(formData.get("expectedDate") || "") || null,
    notes: String(formData.get("notes") || "") || null,
    items,
  });
}

export async function createPurchaseOrderAction(
  _prev: PurchaseOrderActionState,
  formData: FormData,
): Promise<PurchaseOrderActionState> {
  const { supabase, store, role, user } = await getCurrentStoreContext();
  if (!store) return { error: "No store found for this account." };
  if (!requireManager(role)) {
    return { error: "Only owners or managers can create purchase orders." };
  }

  const parsed = parsePurchaseOrderPayload(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid purchase order",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path.join(".") || "form"),
          issue.message,
        ]),
      ),
    };
  }

  const input = parsed.data;
  const submitAsOrdered = String(formData.get("submitAs") || "draft") === "ordered";

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("id")
    .eq("store_id", store.id)
    .eq("id", input.supplierId)
    .is("archived_at", null)
    .maybeSingle();

  if (!supplier) {
    return {
      error: "Supplier not found or archived.",
      fieldErrors: { supplierId: "Select an active supplier" },
    };
  }

  const productIds = input.items.map((item) => item.productId);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id")
    .eq("store_id", store.id)
    .in("id", productIds)
    .is("archived_at", null);

  if (productsError) return { error: productsError.message };
  if ((products ?? []).length !== productIds.length) {
    return { error: "One or more products are invalid for this store." };
  }

  const totalAmount = Math.round(
    input.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0) *
      100,
  ) / 100;

  let poNumber = await generateNextPoNumber(store.id);
  let created:
    | { id: string; po_number: string }
    | null = null;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase
      .from("purchase_orders")
      .insert({
        store_id: store.id,
        supplier_id: input.supplierId,
        po_number: poNumber,
        status: submitAsOrdered ? "ordered" : "draft",
        order_date: input.orderDate,
        expected_date: input.expectedDate,
        notes: input.notes,
        total_amount: totalAmount,
        created_by: user.id,
      })
      .select("id, po_number")
      .single();

    if (!error && data) {
      created = data;
      break;
    }

    lastError = error?.message ?? "Unable to create purchase order";
    if (error?.code === "23505") {
      poNumber = await generateNextPoNumber(store.id);
      continue;
    }
    return { error: lastError };
  }

  if (!created) {
    return { error: lastError ?? "Unable to create purchase order" };
  }

  const { error: itemsError } = await supabase.from("purchase_order_items").insert(
    input.items.map((item) => ({
      purchase_order_id: created.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_cost: item.unitCost,
      received_quantity: 0,
    })),
  );

  if (itemsError) {
    await supabase
      .from("purchase_orders")
      .delete()
      .eq("id", created.id)
      .eq("store_id", store.id);
    return { error: itemsError.message };
  }

  revalidatePoPaths(created.id);
  redirect(`/purchase-orders/${created.id}`);
}

export async function updateDraftPurchaseOrderAction(
  purchaseOrderId: string,
  _prev: PurchaseOrderActionState,
  formData: FormData,
): Promise<PurchaseOrderActionState> {
  const { supabase, store, role } = await getCurrentStoreContext();
  if (!store) return { error: "No store found for this account." };
  if (!requireManager(role)) {
    return { error: "Only owners or managers can edit purchase orders." };
  }

  const parsed = parsePurchaseOrderPayload(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid purchase order",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path.join(".") || "form"),
          issue.message,
        ]),
      ),
    };
  }

  const input = parsed.data;

  const { data: existing } = await supabase
    .from("purchase_orders")
    .select("id, status")
    .eq("store_id", store.id)
    .eq("id", purchaseOrderId)
    .maybeSingle();

  if (!existing) return { error: "Purchase order not found." };
  if (existing.status !== "draft") {
    return { error: "Only draft purchase orders can be edited." };
  }

  const totalAmount = Math.round(
    input.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0) *
      100,
  ) / 100;

  const { error: updateError } = await supabase
    .from("purchase_orders")
    .update({
      supplier_id: input.supplierId,
      order_date: input.orderDate,
      expected_date: input.expectedDate,
      notes: input.notes,
      total_amount: totalAmount,
    })
    .eq("id", purchaseOrderId)
    .eq("store_id", store.id);

  if (updateError) return { error: updateError.message };

  await supabase
    .from("purchase_order_items")
    .delete()
    .eq("purchase_order_id", purchaseOrderId);

  const { error: itemsError } = await supabase.from("purchase_order_items").insert(
    input.items.map((item) => ({
      purchase_order_id: purchaseOrderId,
      product_id: item.productId,
      quantity: item.quantity,
      unit_cost: item.unitCost,
      received_quantity: 0,
    })),
  );

  if (itemsError) return { error: itemsError.message };

  revalidatePoPaths(purchaseOrderId);
  return { success: "Draft purchase order updated." };
}

export async function markPurchaseOrderOrderedAction(
  purchaseOrderId: string,
): Promise<PurchaseOrderActionState> {
  const { supabase, store, role } = await getCurrentStoreContext();
  if (!store) return { error: "No store found for this account." };
  if (!requireManager(role)) {
    return { error: "Only owners or managers can mark orders." };
  }

  const { data: existing } = await supabase
    .from("purchase_orders")
    .select("id, status")
    .eq("store_id", store.id)
    .eq("id", purchaseOrderId)
    .maybeSingle();

  if (!existing) return { error: "Purchase order not found." };
  if (existing.status !== "draft") {
    return { error: "Only draft orders can be marked as ordered." };
  }

  const { error } = await supabase
    .from("purchase_orders")
    .update({ status: "ordered" })
    .eq("id", purchaseOrderId)
    .eq("store_id", store.id);

  if (error) return { error: error.message };

  revalidatePoPaths(purchaseOrderId);
  return { success: "Purchase order marked as ordered." };
}

export async function cancelPurchaseOrderAction(
  purchaseOrderId: string,
): Promise<PurchaseOrderActionState> {
  const { supabase, store, role } = await getCurrentStoreContext();
  if (!store) return { error: "No store found for this account." };
  if (!requireManager(role)) {
    return { error: "Only owners or managers can cancel orders." };
  }

  const { data: existing } = await supabase
    .from("purchase_orders")
    .select("id, status")
    .eq("store_id", store.id)
    .eq("id", purchaseOrderId)
    .maybeSingle();

  if (!existing) return { error: "Purchase order not found." };
  if (!["draft", "ordered"].includes(existing.status)) {
    return {
      error: "Only draft or ordered purchase orders can be cancelled.",
    };
  }

  const { error } = await supabase
    .from("purchase_orders")
    .update({ status: "cancelled" })
    .eq("id", purchaseOrderId)
    .eq("store_id", store.id);

  if (error) return { error: error.message };

  revalidatePoPaths(purchaseOrderId);
  return { success: "Purchase order cancelled." };
}

export async function receivePurchaseOrderAction(
  _prev: PurchaseOrderActionState,
  formData: FormData,
): Promise<PurchaseOrderActionState> {
  const { supabase, store, role } = await getCurrentStoreContext();
  if (!store) return { error: "No store found for this account." };
  if (!requireManager(role)) {
    return { error: "Only owners or managers can receive purchase orders." };
  }

  let items: { itemId: string; quantity: number }[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("itemsJson") || "[]")) as Array<{
      itemId: string;
      quantity: number;
    }>;
    items = parsed.map((item) => ({
      itemId: item.itemId,
      quantity: Number(item.quantity),
    }));
  } catch {
    items = [];
  }

  const parsed = receivePurchaseOrderSchema.safeParse({
    purchaseOrderId: String(formData.get("purchaseOrderId") || ""),
    items,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid receive details",
    };
  }

  const input = parsed.data;
  const { data, error } = await supabase.rpc("receive_purchase_order", {
    target_store_id: store.id,
    target_po_id: input.purchaseOrderId,
    receive_items: input.items.map((item) => ({
      item_id: item.itemId,
      quantity: item.quantity,
    })),
  });

  if (error) return { error: error.message };

  revalidatePoPaths(input.purchaseOrderId);

  const status =
    data && typeof data === "object" && "status" in data
      ? String((data as { status: string }).status)
      : "updated";

  return {
    success: `Goods received. Purchase order is now ${status.replaceAll("_", " ")}.`,
  };
}
