import type { Metadata } from "next";
import Link from "next/link";
import { Truck } from "lucide-react";
import { Suspense } from "react";
import { SuppliersFilters } from "@/components/suppliers/suppliers-filters";
import { SuppliersPagination } from "@/components/suppliers/suppliers-pagination";
import { SuppliersTable } from "@/components/suppliers/suppliers-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { listSuppliersDetailed } from "@/lib/services/suppliers";
import type { SupplierStatusFilter } from "@/types/supplier";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "Suppliers" };

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
  }>;
};

async function SuppliersContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const { store, role } = await getCurrentStoreContext();

  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const page = Math.max(1, Number(params.page) || 1);
  const canManage = role === "owner" || role === "manager";
  const result = await listSuppliersDetailed(store.id, {
    q: params.q,
    status: params.status as SupplierStatusFilter | undefined,
    page,
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-navy">Suppliers</h2>
          <p className="mt-1 text-sm text-secondary">
            Manage supplier contacts, linked products, and purchase history.
          </p>
        </div>
        {canManage ? (
          <Link
            href="/suppliers/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            <Truck className="h-4 w-4" />
            Add supplier
          </Link>
        ) : null}
      </section>

      <Suspense fallback={<Skeleton className="h-16 w-full rounded-2xl" />}>
        <SuppliersFilters />
      </Suspense>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Supplier directory</CardTitle>
            <CardDescription>
              {result.total} supplier{result.total === 1 ? "" : "s"} in this
              view.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SuppliersTable items={result.items} />
          <SuppliersPagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            searchParams={{ q: params.q, status: params.status }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuppliersPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      }
    >
      <SuppliersContent {...props} />
    </Suspense>
  );
}
