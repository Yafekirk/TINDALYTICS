import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/dashboard";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Dashboard",
};

type PageProps = {
  searchParams: Promise<{ period?: string }>;
};

async function DashboardContent({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const { user, store, role } = await getCurrentStoreContext();

  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
        <p className="mt-2 text-sm text-secondary">
          We couldn&apos;t find a store for this account. Sign out and register
          again, or contact support.
        </p>
      </div>
    );
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email ??
    "Store Owner";

  const data = await getDashboardData(
    store.id,
    fullName,
    store.name,
    role,
    params.period,
  );

  return <DashboardPage data={data} />;
}

export default function Page({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}
