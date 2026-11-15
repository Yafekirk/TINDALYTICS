import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoreSettings } from "@/types/account";

export async function getStoreSettings(
  supabase: SupabaseClient,
  storeId: string,
  role: string | null,
): Promise<StoreSettings | null> {
  const { data, error } = await supabase
    .from("stores")
    .select("id, name, address, phone, timezone, currency")
    .eq("id", storeId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    address: data.address,
    phone: data.phone,
    timezone: data.timezone,
    currency: data.currency,
    role,
    canEdit: role === "owner",
  };
}
