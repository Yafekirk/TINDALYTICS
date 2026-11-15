import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AuthStoreInfo } from "@/types/auth";

type StoreRow = AuthStoreInfo & {
  phone?: string | null;
  timezone?: string;
  currency?: string;
};

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user, claims: data.claims };
}

export async function getCurrentStoreContext() {
  const { supabase, user } = await requireUser();

  const { data: membership } = await supabase
    .from("store_members")
    .select("role, store:stores(id, name, address, phone, timezone, currency)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const linkedStore = membership?.store
    ? ((Array.isArray(membership.store)
        ? membership.store[0]
        : membership.store) as StoreRow | null)
    : null;

  if (!linkedStore) {
    const storeName =
      (user.user_metadata?.store_name as string | undefined) ??
      "My Sari-Sari Store";

    const { data: createdStore, error } = await supabase.rpc(
      "create_store_with_owner",
      {
        store_name: storeName,
        store_address: null,
        store_phone: null,
      },
    );

    if (error || !createdStore) {
      return {
        supabase,
        user,
        store: null,
        role: null as string | null,
      };
    }

    const store = createdStore as StoreRow;

    return {
      supabase,
      user,
      store: {
        id: store.id,
        name: store.name,
        address: store.address ?? null,
      },
      role: "owner" as const,
    };
  }

  return {
    supabase,
    user,
    store: {
      id: linkedStore.id,
      name: linkedStore.name,
      address: linkedStore.address ?? null,
    },
    role: membership?.role as string,
  };
}
