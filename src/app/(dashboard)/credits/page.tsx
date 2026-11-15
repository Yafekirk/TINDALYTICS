import type { Metadata } from "next";
import Link from "next/link";
import { HandCoins } from "lucide-react";
import { Suspense } from "react";
import { CreditsFilters } from "@/components/credits/credits-filters";
import { CreditsPagination } from "@/components/credits/credits-pagination";
import { CreditsSummaryCards } from "@/components/credits/credits-summary-cards";
import { CreditsTable } from "@/components/credits/credits-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { listCredits } from "@/lib/services/credits";
import type { CreditListFilters } from "@/types/credit";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "Utang / Customer Credit" };

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    customerId?: string;
    page?: string;
  }>;
};

async function CreditsContent({ searchParams }: PageProps) {
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
  const result = await listCredits(store.id, {
    q: params.q,
    status: params.status as CreditListFilters["status"],
    customerId: params.customerId,
    page,
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-navy">
            Utang / Customer Credit
          </h2>
          <p className="mt-1 text-sm text-secondary">
            Track customer balances, due dates, and partial or full payments.
          </p>
        </div>
        <Link
          href="/credits/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover"
        >
          <HandCoins className="h-4 w-4" />
          Create credit
        </Link>
      </section>

      <CreditsSummaryCards summary={result.summary} />

      <Suspense fallback={<Skeleton className="h-16 w-full rounded-2xl" />}>
        <CreditsFilters />
      </Suspense>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Credit records</CardTitle>
            <CardDescription>
              {result.total} record{result.total === 1 ? "" : "s"} in this view.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CreditsTable items={result.items} />
          <CreditsPagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            searchParams={{
              q: params.q,
              status: params.status,
              customerId: params.customerId,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreditsPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      }
    >
      <CreditsContent {...props} />
    </Suspense>
  );
}
