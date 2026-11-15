"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { listLinkableSalesForCustomer } from "@/lib/services/credits";
import {
  parseCreateCreditFormData,
  parseCreditPaymentFormData,
} from "@/lib/validations/credit";
import type { CreditSaleOption } from "@/types/credit";

export type CreditActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

function requireManager(role: string | null) {
  return role === "owner" || role === "manager";
}

function revalidateCreditPaths(creditId?: string, customerId?: string) {
  revalidatePath("/credits");
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  if (creditId) revalidatePath(`/credits/${creditId}`);
  if (customerId) revalidatePath(`/customers/${customerId}`);
}

export async function createCreditAction(
  _prev: CreditActionState,
  formData: FormData,
): Promise<CreditActionState> {
  const { supabase, store } = await getCurrentStoreContext();
  if (!store) return { error: "No store found for this account." };

  const parsed = parseCreateCreditFormData(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid credit details",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0] ?? "form"),
          issue.message,
        ]),
      ),
    };
  }

  const input = parsed.data;

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("store_id", store.id)
    .eq("id", input.customerId)
    .maybeSingle();

  if (!customer) return { error: "Customer not found in this store." };

  if (input.saleId) {
    const { data: sale } = await supabase
      .from("sales")
      .select("id, customer_id, status, total")
      .eq("store_id", store.id)
      .eq("id", input.saleId)
      .maybeSingle();

    if (!sale) return { error: "Linked sale not found." };
    if (sale.status !== "completed") {
      return { error: "Only completed sales can be linked to utang." };
    }
    if (sale.customer_id !== input.customerId) {
      return { error: "Sale does not belong to the selected customer." };
    }

    const { data: existingLink } = await supabase
      .from("customer_credits")
      .select("id")
      .eq("store_id", store.id)
      .eq("sale_id", input.saleId)
      .in("status", ["open", "partial", "paid"])
      .maybeSingle();

    if (existingLink) {
      return { error: "This sale already has a credit record." };
    }
  }

  const amount = Math.round(input.amount * 100) / 100;

  const { data, error } = await supabase
    .from("customer_credits")
    .insert({
      store_id: store.id,
      customer_id: input.customerId,
      sale_id: input.saleId,
      amount,
      balance: amount,
      due_date: input.dueDate,
      status: "open",
      notes: input.notes,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Unable to create credit" };
  }

  revalidateCreditPaths(data.id, input.customerId);
  redirect(`/credits/${data.id}`);
}

export async function recordCreditPaymentAction(
  creditId: string,
  _prev: CreditActionState,
  formData: FormData,
): Promise<CreditActionState> {
  const { supabase, store } = await getCurrentStoreContext();
  if (!store) return { error: "No store found for this account." };

  const parsed = parseCreditPaymentFormData(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid payment details",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0] ?? "form"),
          issue.message,
        ]),
      ),
    };
  }

  const { data: credit } = await supabase
    .from("customer_credits")
    .select("id, customer_id, balance, status")
    .eq("store_id", store.id)
    .eq("id", creditId)
    .maybeSingle();

  if (!credit) return { error: "Credit record not found." };
  if (!["open", "partial"].includes(credit.status)) {
    return { error: "Only open or partial credits can accept payments." };
  }

  const amount = Math.round(parsed.data.amount * 100) / 100;
  const balance = Number(credit.balance);
  if (amount > balance) {
    return {
      error: "Payment exceeds outstanding balance. Overpayment is not allowed.",
      fieldErrors: { amount: "Cannot exceed remaining balance" },
    };
  }

  const { data, error } = await supabase.rpc("record_credit_payment", {
    target_store_id: store.id,
    target_credit_id: creditId,
    p_amount: amount,
    p_payment_method: parsed.data.paymentMethod,
    p_notes: parsed.data.notes,
    p_paid_at: null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateCreditPaths(creditId, credit.customer_id);
  const result = data as { balance?: number; status?: string } | null;
  if (result?.status === "paid") {
    return { success: "Full payment recorded. Utang is fully paid." };
  }
  return {
    success: `Partial payment recorded. Remaining balance: ₱${Number(result?.balance ?? 0).toFixed(2)}`,
  };
}

export async function getLinkableSalesAction(
  customerId: string,
): Promise<CreditSaleOption[]> {
  const { store } = await getCurrentStoreContext();
  if (!store || !customerId) return [];
  return listLinkableSalesForCustomer(store.id, customerId);
}

export async function voidCreditAction(
  creditId: string,
  formData?: FormData,
): Promise<CreditActionState> {
  const { supabase, store, role } = await getCurrentStoreContext();
  if (!store) return { error: "No store found for this account." };
  if (!requireManager(role)) {
    return { error: "Only owners or managers can void credits." };
  }

  const reason = String(formData?.get("reason") || "").trim() || null;

  const { data: credit } = await supabase
    .from("customer_credits")
    .select("id, customer_id, status")
    .eq("store_id", store.id)
    .eq("id", creditId)
    .maybeSingle();

  if (!credit) return { error: "Credit record not found." };
  if (!["open", "partial"].includes(credit.status)) {
    return { error: "Only open or partial credits can be voided." };
  }

  const { error } = await supabase.rpc("void_customer_credit", {
    target_store_id: store.id,
    target_credit_id: creditId,
    p_reason: reason,
  });

  if (error) return { error: error.message };

  revalidateCreditPaths(creditId, credit.customer_id);
  return { success: "Credit voided." };
}
