import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { Suspense } from "react";
import { CustomersFilters } from "@/components/customers/customers-filters";
import { CustomersPagination } from "@/components/customers/customers-pagination";
import { CustomersTable } from "@/components/customers/customers-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { listCustomers } from "@/lib/services/customers";

export const metadata: Metadata = { title: "Customers" };

type PageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
};

async function CustomersContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const { store } = await getCurrentStoreContext();

  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const page = Math.max(1, Number(params.page) || 1);
  const result = await listCustomers(store.id, {
    q: params.q,
    page,
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-navy">Customers</h2>
          <p className="mt-1 text-sm text-secondary">
            Optional profiles for regulars, purchase history, and utang tracking.
          </p>
        </div>
        <Link
          href="/customers/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover"
        >
          <Users className="h-4 w-4" />
          Add customer
        </Link>
      </section>

      <Suspense fallback={<Skeleton className="h-16 w-full rounded-2xl" />}>
        <CustomersFilters />
      </Suspense>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Customer directory</CardTitle>
            <CardDescription>
              {result.total} customer{result.total === 1 ? "" : "s"} in this
              view.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CustomersTable items={result.items} />
          <CustomersPagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            searchParams={{ q: params.q }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CustomersPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      }
    >
      <CustomersContent {...props} />
    </Suspense>
  );
}
