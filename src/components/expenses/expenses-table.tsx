import Link from "next/link";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { expenseCategoryLabel } from "@/lib/validations/expense";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/format";
import type { ExpenseListItem, ExpenseStatus } from "@/types/expense";

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

type ExpensesTableProps = {
  items: ExpenseListItem[];
};

export function ExpensesTable({ items }: ExpensesTableProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No expenses found"
        description="Track rent, utilities, and other store costs here."
        action={
          <Link
            href="/expenses/new"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            Add expense
          </Link>
        }
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Expense</TH>
          <TH>Category</TH>
          <TH>Date</TH>
          <TH>Payment</TH>
          <TH>Amount</TH>
          <TH>Status</TH>
          <TH className="text-right">Actions</TH>
        </TR>
      </THead>
      <TBody>
        {items.map((expense) => (
          <TR key={expense.id}>
            <TD>
              <Link
                href={`/expenses/${expense.id}`}
                className="font-medium text-navy hover:text-primary hover:underline"
              >
                {expense.name}
              </Link>
              {expense.description ? (
                <p className="mt-0.5 text-xs text-secondary line-clamp-1">
                  {expense.description}
                </p>
              ) : null}
            </TD>
            <TD>{expenseCategoryLabel(expense.category)}</TD>
            <TD>{formatDate(expense.expenseDate)}</TD>
            <TD>{paymentLabel(expense.paymentMethod)}</TD>
            <TD className="font-medium text-navy">
              {formatCurrency(expense.amount)}
            </TD>
            <TD>
              <Badge tone={statusTone[expense.status]} className="capitalize">
                {expense.status}
              </Badge>
            </TD>
            <TD>
              <div className="flex justify-end">
                <Link
                  href={`/expenses/${expense.id}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-secondary transition hover:bg-accent-soft/60 hover:text-navy"
                  aria-label={`View ${expense.name}`}
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </div>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
