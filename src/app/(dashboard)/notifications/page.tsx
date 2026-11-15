import type { Metadata } from "next";
import { NotificationsPanel } from "@/components/notifications/notifications-panel";
import { getCurrentStoreContext } from "@/lib/auth/session";
import {
  listNotifications,
  syncLowStockNotifications,
} from "@/lib/services/notifications";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const { supabase, store, role } = await getCurrentStoreContext();

  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  await syncLowStockNotifications(supabase, store.id, role);
  const notifications = await listNotifications(supabase, store.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-navy">Notifications</h2>
        <p className="mt-1 text-sm text-secondary">
          Low-stock alerts and store notices for {store.name}.
        </p>
      </div>
      <NotificationsPanel notifications={notifications} />
    </div>
  );
}
