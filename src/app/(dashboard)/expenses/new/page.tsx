import type { Metadata } from "next";
import Link from "next/link";
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
import { manilaDayKey } from "@/lib/utils/timezone";

export const metadata: Metadata = { title: "Add expense" };

export default async function NewExpensePage() {
  const { store, role } = await getCurrentStoreContext();
  const canManage = role === "owner" || role === "manager";

  if (!store) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-navy">Store setup needed</h2>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/expenses"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to expenses
      </Link>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Add expense</CardTitle>
            <CardDescription>
              Record an operating cost for your store.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!canManage ? (
            <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-secondary">
              View-only access. Only owners or managers can add expenses.
            </p>
          ) : (
            <ExpenseForm
              mode="create"
              defaultDate={manilaDayKey(new Date())}
              canManage={canManage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
