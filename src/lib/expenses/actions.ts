"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { parseExpenseFormData } from "@/lib/validations/expense";
import type { ExpenseStatus } from "@/types/expense";

export type ExpenseActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

function requireManager(role: string | null) {
  return role === "owner" || role === "manager";
}

function revalidateExpensePaths(expenseId?: string) {
  revalidatePath("/expenses");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  if (expenseId) revalidatePath(`/expenses/${expenseId}`);
}

export async function createExpenseAction(
  _prev: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const { supabase, store, role, user } = await getCurrentStoreContext();
  if (!store) return { error: "No store found for this account." };
  if (!requireManager(role)) {
    return { error: "Only owners or managers can add expenses." };
  }

  const parsed = parseExpenseFormData(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid expense details",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0] ?? "form"),
          issue.message,
        ]),
      ),
    };
  }

  const input = parsed.data;
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      store_id: store.id,
      name: input.name,
      category: input.category,
      amount: input.amount,
      expense_date: input.expenseDate,
      description: input.description,
      payment_method: input.paymentMethod,
      status: "active",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Unable to create expense" };
  }

  revalidateExpensePaths(data.id);
  redirect(`/expenses/${data.id}`);
}

export async function updateExpenseAction(
  expenseId: string,
  _prev: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const { supabase, store, role } = await getCurrentStoreContext();
  if (!store) return { error: "No store found for this account." };
  if (!requireManager(role)) {
    return { error: "Only owners or managers can edit expenses." };
  }

  const parsed = parseExpenseFormData(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid expense details",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0] ?? "form"),
          issue.message,
        ]),
      ),
    };
  }

  const { data: existing } = await supabase
    .from("expenses")
    .select("id, status")
    .eq("store_id", store.id)
    .eq("id", expenseId)
    .maybeSingle();

  if (!existing) return { error: "Expense not found." };
  if (existing.status !== "active") {
    return { error: "Only active expenses can be edited." };
  }

  const input = parsed.data;
  const { error } = await supabase
    .from("expenses")
    .update({
      name: input.name,
      category: input.category,
      amount: input.amount,
      expense_date: input.expenseDate,
      description: input.description,
      payment_method: input.paymentMethod,
    })
    .eq("store_id", store.id)
    .eq("id", expenseId);

  if (error) return { error: error.message };

  revalidateExpensePaths(expenseId);
  return { success: "Expense updated." };
}

async function setExpenseStatus(
  expenseId: string,
  status: ExpenseStatus,
): Promise<ExpenseActionState> {
  const { supabase, store, role } = await getCurrentStoreContext();
  if (!store) return { error: "No store found for this account." };
  if (!requireManager(role)) {
    return { error: "Only owners or managers can update expenses." };
  }

  const { data: existing } = await supabase
    .from("expenses")
    .select("id, status")
    .eq("store_id", store.id)
    .eq("id", expenseId)
    .maybeSingle();

  if (!existing) return { error: "Expense not found." };

  if (status === "active" && existing.status === "active") {
    return { error: "Expense is already active." };
  }
  if (status !== "active" && existing.status !== "active") {
    return { error: "Only active expenses can be voided or archived." };
  }

  const { error } = await supabase
    .from("expenses")
    .update({ status })
    .eq("store_id", store.id)
    .eq("id", expenseId);

  if (error) return { error: error.message };

  revalidateExpensePaths(expenseId);
  const label =
    status === "voided"
      ? "voided"
      : status === "archived"
        ? "archived"
        : "restored";
  return { success: `Expense ${label}.` };
}

export async function voidExpenseAction(expenseId: string) {
  return setExpenseStatus(expenseId, "voided");
}

export async function archiveExpenseAction(expenseId: string) {
  return setExpenseStatus(expenseId, "archived");
}

export async function restoreExpenseAction(expenseId: string) {
  return setExpenseStatus(expenseId, "active");
}
