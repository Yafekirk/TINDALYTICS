import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ExpenseForm } from "@/components/expenses/expense-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentStoreContext } from "@/lib/auth/session";
import { getExpense } from "@/lib/services/expenses";
import { manilaDayKey } from "@/lib/utils/timezone";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: "Edit expense" };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditExpensePage({ params }: PageProps) {
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
  if (expense.status !== "active") redirect(`/expenses/${id}`);

  const canManage = role === "owner" || role === "manager";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/expenses/${expense.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to expense
      </Link>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Edit expense</CardTitle>
            <CardDescription>Update amount, category, or notes.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            mode="edit"
            expense={expense}
            defaultDate={expense.expenseDate || manilaDayKey(new Date())}
            canManage={canManage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
