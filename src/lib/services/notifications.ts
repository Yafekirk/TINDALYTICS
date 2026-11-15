import type { SupabaseClient } from "@supabase/supabase-js";
import { getLowStockAlerts } from "@/lib/services/inventory";
import type { StoreNotification } from "@/types/account";

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

function mapNotification(row: NotificationRow): StoreNotification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export async function getUnreadNotificationCount(
  supabase: SupabaseClient,
  storeId: string,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId)
    .eq("is_read", false)
    .or(`user_id.is.null,user_id.eq.${userId}`);

  if (error) return 0;
  return count ?? 0;
}

export async function listNotifications(
  supabase: SupabaseClient,
  storeId: string,
): Promise<StoreNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, message, type, is_read, created_at")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data.map(mapNotification);
}

/** Create low-stock alerts when missing (managers/owners only via RLS). */
export async function syncLowStockNotifications(
  supabase: SupabaseClient,
  storeId: string,
  role: string | null,
): Promise<void> {
  if (role !== "owner" && role !== "manager") return;

  const lowStock = await getLowStockAlerts(storeId, 20);
  if (lowStock.length === 0) return;

  const { data: existing } = await supabase
    .from("notifications")
    .select("message")
    .eq("store_id", storeId)
    .eq("type", "warning")
    .eq("is_read", false);

  const existingMessages = new Set((existing ?? []).map((row) => row.message));

  const rows = lowStock.flatMap((item) => {
    const message = `${item.name} is ${item.status.toLowerCase()} (${item.quantity} ${item.unit} left; min ${item.minStockLevel}).`;
    if (existingMessages.has(message)) return [];
    return [
      {
        store_id: storeId,
        user_id: null as string | null,
        title: item.status === "Out of Stock" ? "Out of stock" : "Low stock alert",
        message,
        type: "warning",
        is_read: false,
      },
    ];
  });

  if (rows.length === 0) return;

  await supabase.from("notifications").insert(rows);
}
