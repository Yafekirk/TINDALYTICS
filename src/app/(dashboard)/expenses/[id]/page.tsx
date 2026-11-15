import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExpenseDetailView } from "@/components/expenses/expense-detail-view";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { getExpense } from "@/lib/services/expenses";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "Expense details" };

type PageProps = {
  params: Promise<{ id: string }>;
};

async function ExpenseDetailContent({ params }: PageProps) {
  const { id } = await params;
  const { store, role } = await getCurrentStoreContext();
  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  const expense = await getExpense(store.id, id);
  if (!expense) notFound();

  return (
    <ExpenseDetailView
      expense={expense}
      canManage={role === "owner" || role === "manager"}
    />
  );
}

export default function ExpenseDetailPage(props: PageProps) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <ExpenseDetailContent {...props} />
    </Suspense>
  );
}
