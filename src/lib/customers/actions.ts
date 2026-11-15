"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { parseCustomerFormData } from "@/lib/validations/customer";

export type CustomerActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

function revalidateCustomerPaths(customerId?: string) {
  revalidatePath("/customers");
  revalidatePath("/pos");
  revalidatePath("/credits");
  if (customerId) revalidatePath(`/customers/${customerId}`);
}

export async function createCustomerAction(
  _prev: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const { supabase, store } = await getCurrentStoreContext();
  if (!store) return { error: "No store found for this account." };

  const parsed = parseCustomerFormData(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid customer details",
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
    .from("customers")
    .insert({
      store_id: store.id,
      name: input.name,
      contact_number: input.contactNumber,
      address: input.address,
      notes: input.notes,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Unable to create customer" };
  }

  revalidateCustomerPaths(data.id);
  redirect(`/customers/${data.id}`);
}

export async function updateCustomerAction(
  customerId: string,
  _prev: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const { supabase, store } = await getCurrentStoreContext();
  if (!store) return { error: "No store found for this account." };

  const parsed = parseCustomerFormData(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid customer details",
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
    .from("customers")
    .update({
      name: input.name,
      contact_number: input.contactNumber,
      address: input.address,
      notes: input.notes,
    })
    .eq("store_id", store.id)
    .eq("id", customerId);

  if (error) return { error: error.message };

  revalidateCustomerPaths(customerId);
  return { success: "Customer updated." };
}
