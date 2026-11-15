import { Suspense } from "react";
import { connection } from "next/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { getProfile } from "@/lib/services/profile";
import { getUnreadNotificationCount } from "@/lib/services/notifications";

async function DashboardLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Request-time boundary so Date.now()/new Date() in dashboard data never runs during prerender.
  await connection();
  const { supabase, user, store, role } = await getCurrentStoreContext();
  const [profile, unreadNotifications] = await Promise.all([
    getProfile(user.id),
    store
      ? getUnreadNotificationCount(supabase, store.id, user.id)
      : Promise.resolve(0),
  ]);

  return (
    <DashboardShell
      user={{
        id: user.id,
        email: user.email ?? profile?.email ?? "",
        fullName:
          profile?.fullName ??
          (user.user_metadata?.full_name as string | undefined) ??
          user.email ??
          "User",
      }}
      store={
        store
          ? {
              id: store.id,
              name: store.name,
              address: store.address,
            }
          : null
      }
      role={role}
      unreadNotifications={unreadNotifications}
    >
      {children}
    </DashboardShell>
  );
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-page">
          <aside className="hidden w-64 border-r border-border bg-white p-4 lg:block">
            <Skeleton className="mb-6 h-10 w-40 rounded-xl" />
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-full rounded-xl" />
              ))}
            </div>
          </aside>
          <div className="flex-1 space-y-4 p-6">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      }
    >
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
