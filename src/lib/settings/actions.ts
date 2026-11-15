"use server";

import { revalidatePath } from "next/cache";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { parseStoreSettingsFormData } from "@/lib/validations/settings";

export type SettingsActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

export async function updateStoreSettingsAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const { supabase, store, role } = await getCurrentStoreContext();
  if (!store) return { error: "No store found for this account." };
  if (role !== "owner") {
    return { error: "Only the store owner can update store settings." };
  }

  const parsed = parseStoreSettingsFormData(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid store settings",
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
    .from("stores")
    .update({
      name: input.name,
      address: input.address,
      phone: input.phone,
      timezone: input.timezone,
      currency: input.currency,
    })
    .eq("id", store.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return { success: "Store settings saved." };
}
