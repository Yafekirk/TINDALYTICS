import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportsContent } from "@/components/reports/reports-content";
import { ReportsExportBar } from "@/components/reports/reports-export-bar";
import { ReportsFilters } from "@/components/reports/reports-filters";
import { ReportsSummaryCards } from "@/components/reports/reports-summary-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { getReportsData } from "@/lib/services/reports";
import {
  reportTypeLabel,
  resolveReportType,
} from "@/lib/utils/reports-range";

export const metadata: Metadata = { title: "Reports & Analytics" };

type PageProps = {
  searchParams: Promise<{
    type?: string;
    preset?: string;
    from?: string;
    to?: string;
  }>;
};

async function ReportsPageContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const { store } = await getCurrentStoreContext();

  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const type = resolveReportType(params.type);
  const data = await getReportsData(store.id, {
    preset: params.preset,
    from: params.from,
    to: params.to,
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-navy">
            Reports & Analytics
          </h2>
          <p className="mt-1 text-sm text-secondary">
            {reportTypeLabel(type)} · {data.range.label}
          </p>
        </div>
        <ReportsExportBar type={type} data={data} />
      </section>

      <Suspense fallback={<Skeleton className="h-16 w-full rounded-2xl" />}>
        <ReportsFilters />
      </Suspense>

      {type !== "inventory" ? (
        <ReportsSummaryCards summary={data.summary} />
      ) : null}

      <ReportsContent type={type} data={data} />
    </div>
  );
}

export default function ReportsPage(props: PageProps) {
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
      <ReportsPageContent {...props} />
    </Suspense>
  );
}
