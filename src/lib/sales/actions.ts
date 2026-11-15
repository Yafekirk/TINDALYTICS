"use server";

import { revalidatePath } from "next/cache";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { parseSaleStatusFormData } from "@/lib/validations/sales";
import type { SaleStatusAction } from "@/types/sales";

export type SaleActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

function revalidateSalesPaths(saleId?: string) {
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  revalidatePath("/inventory/movements");
  revalidatePath("/pos");
  if (saleId) {
    revalidatePath(`/sales/${saleId}`);
    revalidatePath(`/pos/receipt/${saleId}`);
  }
}

export async function voidOrRefundSaleAction(
  _prev: SaleActionState,
  formData: FormData,
): Promise<SaleActionState> {
  const parsed = parseSaleStatusFormData(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid request",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0] ?? "form"),
          issue.message,
        ]),
      ),
    };
  }

  const { supabase, store, role } = await getCurrentStoreContext();
  if (!store) return { error: "No store found for this account." };
  if (role !== "owner" && role !== "manager") {
    return { error: "Only owners or managers can void or refund sales." };
  }

  const input = parsed.data;
  const { data, error } = await supabase.rpc("void_or_refund_sale", {
    target_store_id: store.id,
    target_sale_id: input.saleId,
    p_action: input.action,
    p_reason: input.reason,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateSalesPaths(input.saleId);

  const receipt =
    data && typeof data === "object" && "receipt_number" in data
      ? String((data as { receipt_number: string }).receipt_number)
      : "Sale";

  const verb = input.action === "void" ? "voided" : "refunded";

  return {
    success: `${receipt} was ${verb}. Inventory has been restored.`,
  };
}

export async function logReceiptReprintAction(
  saleId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, store } = await getCurrentStoreContext();
  if (!store) return { ok: false, error: "No store found for this account." };

  const { error } = await supabase.rpc("log_sale_receipt_reprint", {
    target_store_id: store.id,
    target_sale_id: saleId,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/sales/${saleId}`);
  return { ok: true };
}

export async function voidSaleAction(
  saleId: string,
  reason: string,
): Promise<SaleActionState> {
  const formData = new FormData();
  formData.set("saleId", saleId);
  formData.set("action", "void" satisfies SaleStatusAction);
  formData.set("reason", reason);
  return voidOrRefundSaleAction({}, formData);
}

export async function refundSaleAction(
  saleId: string,
  reason: string,
): Promise<SaleActionState> {
  const formData = new FormData();
  formData.set("saleId", saleId);
  formData.set("action", "refund" satisfies SaleStatusAction);
  formData.set("reason", reason);
  return voidOrRefundSaleAction({}, formData);
}
