import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { ExpenseStatusButtons } from "@/components/expenses/expense-status-buttons";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { expenseCategoryLabel } from "@/lib/validations/expense";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import type { ExpenseDetail, ExpenseStatus } from "@/types/expense";

const statusTone: Record<ExpenseStatus, "success" | "warning" | "default"> = {
  active: "success",
  voided: "warning",
  archived: "default",
};

function paymentLabel(method: string) {
  if (method === "cash") return "Cash";
  if (method === "gcash") return "GCash";
  return "Other";
}

type ExpenseDetailViewProps = {
  expense: ExpenseDetail;
  canManage: boolean;
};

export function ExpenseDetailView({
  expense,
  canManage,
}: ExpenseDetailViewProps) {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Link
            href="/expenses"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to expenses
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-navy">{expense.name}</h2>
            <Badge tone={statusTone[expense.status]} className="capitalize">
              {expense.status}
            </Badge>
          </div>
          <p className="text-sm text-secondary">
            {expenseCategoryLabel(expense.category)} ·{" "}
            {formatDate(expense.expenseDate)} ·{" "}
            {paymentLabel(expense.paymentMethod)}
          </p>
        </div>

        {canManage ? (
          <div className="flex flex-wrap gap-2">
            {expense.status === "active" ? (
              <Link
                href={`/expenses/${expense.id}/edit`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-medium text-navy transition hover:border-accent hover:bg-accent-soft/40"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            ) : null}
            <ExpenseStatusButtons
              expenseId={expense.id}
              status={expense.status}
            />
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Expense details</CardTitle>
              <CardDescription>
                Recorded store operating cost.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-secondary">Amount</span>
              <span className="text-lg font-semibold text-navy">
                {formatCurrency(expense.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Category</span>
              <span>{expenseCategoryLabel(expense.category)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Payment method</span>
              <span>{paymentLabel(expense.paymentMethod)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Expense date</span>
              <span>{formatDate(expense.expenseDate)}</span>
            </div>
            {expense.description ? (
              <p className="rounded-xl bg-slate-50 px-3 py-2 text-secondary whitespace-pre-wrap">
                {expense.description}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Audit</CardTitle>
              <CardDescription>Who created this record.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between text-secondary">
              <span>Created by</span>
              <span className="text-navy">
                {expense.createdByName ?? "Staff"}
              </span>
            </div>
            <div className="flex justify-between text-secondary">
              <span>Created</span>
              <span>{formatDateTime(expense.createdAt)}</span>
            </div>
            <div className="flex justify-between text-secondary">
              <span>Updated</span>
              <span>{formatDateTime(expense.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
