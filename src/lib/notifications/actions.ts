"use server";

import { revalidatePath } from "next/cache";
import { getCurrentStoreContext } from "@/lib/auth/session";

export type NotificationActionState = {
  error?: string;
  success?: string;
};

export async function markNotificationReadAction(
  notificationId: string,
): Promise<NotificationActionState> {
  const { supabase, store, user } = await getCurrentStoreContext();
  if (!store) return { error: "No store found for this account." };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("store_id", store.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  void user;
  return { success: "Marked as read." };
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionState> {
  const { supabase, store, user } = await getCurrentStoreContext();
  if (!store) return { error: "No store found for this account." };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("store_id", store.id)
    .eq("is_read", false)
    .or(`user_id.is.null,user_id.eq.${user.id}`);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { success: "All notifications marked as read." };
}
