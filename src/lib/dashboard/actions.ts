"use server";

import { revalidatePath } from "next/cache";
import { getCurrentStoreContext } from "@/lib/auth/session";

export type SeedDemoResult = {
  ok: boolean;
  message: string;
};

export async function seedDemoStoreData(): Promise<SeedDemoResult> {
  const { supabase, store, role } = await getCurrentStoreContext();

  if (!store) {
    return { ok: false, message: "No store found for this account." };
  }

  if (role !== "owner" && role !== "manager") {
    return {
      ok: false,
      message: "Only store owners or managers can load demo data.",
    };
  }

  const { data, error } = await supabase.rpc("seed_demo_store_data", {
    target_store_id: store.id,
  });

  if (error) {
    return {
      ok: false,
      message: error.message || "Unable to load demo data.",
    };
  }

  revalidatePath("/dashboard");

  const products =
    data && typeof data === "object" && "products" in data
      ? Number((data as { products: number }).products)
      : 0;
  const sales =
    data && typeof data === "object" && "sales" in data
      ? Number((data as { sales: number }).sales)
      : 0;

  return {
    ok: true,
    message: `Loaded ${products} products and ${sales} sample sales.`,
  };
}
