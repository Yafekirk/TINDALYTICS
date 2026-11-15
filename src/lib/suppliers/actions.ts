"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { parseSupplierFormData } from "@/lib/validations/supplier";

export type SupplierActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

function requireManager(role: string | null) {
  return role === "owner" || role === "manager";
}

function revalidateSupplierPaths(supplierId?: string) {
  revalidatePath("/suppliers");
  revalidatePath("/products");
  revalidatePath("/purchase-orders");
  revalidatePath("/purchase-orders/new");
  if (supplierId) revalidatePath(`/suppliers/${supplierId}`);
}

export async function createSupplierAction(
  _prev: SupplierActionState,
  formData: FormData,
): Promise<SupplierActionState> {
  const { supabase, store, role } = await getCurrentStoreContext();
  if (!store) return { error: "No store found for this account." };
  if (!requireManager(role)) {
    return { error: "Only owners or managers can add suppliers." };
  }

  const parsed = parseSupplierFormData(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid supplier details",
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
    .from("suppliers")
    .insert({
      store_id: store.id,
      name: input.name,
      contact_person: input.contactPerson,
      phone: input.phone,
      email: input.email,
      address: input.address,
      notes: input.notes,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Unable to create supplier" };
  }

  revalidateSupplierPaths(data.id);
  redirect(`/suppliers/${data.id}`);
}

export async function updateSupplierAction(
  supplierId: string,
  _prev: SupplierActionState,
  formData: FormData,
): Promise<SupplierActionState> {
  const { supabase, store, role } = await getCurrentStoreContext();
  if (!store) return { error: "No store found for this account." };
  if (!requireManager(role)) {
    return { error: "Only owners or managers can edit suppliers." };
  }

  const parsed = parseSupplierFormData(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid supplier details",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0] ?? "form"),
          issue.message,
        ]),
      ),
    };
  }

  const input = parsed.data;
  const { error } = await supabase
    .from("suppliers")
    .update({
      name: input.name,
      contact_person: input.contactPerson,
      phone: input.phone,
      email: input.email,
      address: input.address,
      notes: input.notes,
    })
    .eq("store_id", store.id)
    .eq("id", supplierId)
    .is("archived_at", null);

  if (error) return { error: error.message };

  revalidateSupplierPaths(supplierId);
  return { success: "Supplier updated." };
}

export async function archiveSupplierAction(
  supplierId: string,
): Promise<SupplierActionState> {
  const { supabase, store, role } = await getCurrentStoreContext();
  if (!store) return { error: "No store found for this account." };
  if (!requireManager(role)) {
    return { error: "Only owners or managers can archive suppliers." };
  }

  const { error } = await supabase
    .from("suppliers")
    .update({ archived_at: new Date().toISOString() })
    .eq("store_id", store.id)
    .eq("id", supplierId)
    .is("archived_at", null);

  if (error) return { error: error.message };

  revalidateSupplierPaths(supplierId);
  return { success: "Supplier archived." };
}

export async function restoreSupplierAction(
  supplierId: string,
): Promise<SupplierActionState> {
  const { supabase, store, role } = await getCurrentStoreContext();
  if (!store) return { error: "No store found for this account." };
  if (!requireManager(role)) {
    return { error: "Only owners or managers can restore suppliers." };
  }

  const { error } = await supabase
    .from("suppliers")
    .update({ archived_at: null })
    .eq("store_id", store.id)
    .eq("id", supplierId)
    .not("archived_at", "is", null);

  if (error) return { error: error.message };

  revalidateSupplierPaths(supplierId);
  return { success: "Supplier restored." };
}
