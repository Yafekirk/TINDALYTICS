import { Suspense } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

async function DashboardLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, store, role } = await getCurrentStoreContext();

  return (
    <DashboardShell
      user={{
        id: user.id,
        email: user.email ?? "",
        fullName:
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
