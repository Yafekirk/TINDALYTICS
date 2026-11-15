"use server";

import { revalidatePath } from "next/cache";
import { getCurrentStoreContext } from "@/lib/auth/session";
import {
  parseStockAdjustmentFormData,
  parseStockInOutFormData,
} from "@/lib/validations/inventory";
import type { ManualMovementType } from "@/types/inventory";

export type InventoryActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

function requireManager(role: string | null) {
  return role === "owner" || role === "manager";
}

function revalidateInventoryPaths() {
  revalidatePath("/inventory");
  revalidatePath("/inventory/movements");
  revalidatePath("/dashboard");
  revalidatePath("/products");
}

async function runMovement(params: {
  movementType: ManualMovementType;
  productId: string;
  quantity?: number;
  setQuantity?: number;
  notes?: string | null;
}): Promise<InventoryActionState> {
  const { supabase, store, role } = await getCurrentStoreContext();

  if (!store) return { error: "No store found for this account." };
  if (!requireManager(role)) {
    return { error: "Only owners or managers can change inventory." };
  }

  const { data, error } = await supabase.rpc("apply_inventory_movement", {
    target_store_id: store.id,
    target_product_id: params.productId,
    p_movement_type: params.movementType,
    p_quantity: params.quantity ?? null,
    p_notes: params.notes ?? null,
    p_set_quantity: params.setQuantity ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateInventoryPaths();

  const nextQty =
    data && typeof data === "object" && "quantity" in data
      ? Number((data as { quantity: number }).quantity)
      : null;

  const label =
    params.movementType === "stock_in"
      ? "Stock-in recorded"
      : params.movementType === "stock_out"
        ? "Stock-out recorded"
        : "Stock adjustment recorded";

  return {
    success:
      nextQty == null
        ? `${label}.`
        : `${label}. New quantity: ${nextQty}.`,
  };
}

export async function stockInAction(
  _prev: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const parsed = parseStockInOutFormData(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid stock-in details",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0] ?? "form"),
          issue.message,
        ]),
      ),
    };
  }

  return runMovement({
    movementType: "stock_in",
    productId: parsed.data.productId,
    quantity: parsed.data.quantity,
    notes: parsed.data.notes,
  });
}

export async function stockOutAction(
  _prev: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const parsed = parseStockInOutFormData(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid stock-out details",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0] ?? "form"),
          issue.message,
        ]),
      ),
    };
  }

  return runMovement({
    movementType: "stock_out",
    productId: parsed.data.productId,
    quantity: parsed.data.quantity,
    notes: parsed.data.notes,
  });
}

export async function adjustStockAction(
  _prev: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const parsed = parseStockAdjustmentFormData(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid adjustment details",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0] ?? "form"),
          issue.message,
        ]),
      ),
    };
  }

  return runMovement({
    movementType: "adjustment",
    productId: parsed.data.productId,
    setQuantity: parsed.data.newQuantity,
    notes: parsed.data.notes,
  });
}
