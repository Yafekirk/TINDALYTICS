"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createExpenseAction,
  updateExpenseAction,
  type ExpenseActionState,
} from "@/lib/expenses/actions";
import { expenseCategoryLabel } from "@/lib/validations/expense";
import { EXPENSE_CATEGORIES, type ExpenseDetail } from "@/types/expense";

type ExpenseFormProps = {
  mode: "create" | "edit";
  expense?: ExpenseDetail;
  defaultDate: string;
  canManage: boolean;
};

export function ExpenseForm({
  mode,
  expense,
  defaultDate,
  canManage,
}: ExpenseFormProps) {
  const [state, setState] = useState<ExpenseActionState>({});
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    if (!canManage) return;
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createExpenseAction({}, formData)
          : await updateExpenseAction(expense!.id, {}, formData);
      setState(result);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="name">Expense name</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={expense?.name ?? ""}
            disabled={!canManage || isPending}
          />
          {state.fieldErrors?.name ? (
            <p className="mt-1 text-xs text-danger">{state.fieldErrors.name}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            name="category"
            required
            defaultValue={expense?.category ?? "miscellaneous"}
            disabled={!canManage || isPending}
          >
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {expenseCategoryLabel(category)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="amount">Amount (₱)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            defaultValue={expense?.amount ?? ""}
            disabled={!canManage || isPending}
          />
          {state.fieldErrors?.amount ? (
            <p className="mt-1 text-xs text-danger">
              {state.fieldErrors.amount}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="expenseDate">Date</Label>
          <Input
            id="expenseDate"
            name="expenseDate"
            type="date"
            required
            defaultValue={expense?.expenseDate ?? defaultDate}
            disabled={!canManage || isPending}
          />
        </div>
        <div>
          <Label htmlFor="paymentMethod">Payment method</Label>
          <Select
            id="paymentMethod"
            name="paymentMethod"
            defaultValue={expense?.paymentMethod ?? "cash"}
            disabled={!canManage || isPending}
          >
            <option value="cash">Cash</option>
            <option value="gcash">GCash</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={expense?.description ?? ""}
            disabled={!canManage || isPending}
          />
        </div>
      </div>

      {state.error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
          {state.success}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canManage ? (
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Saving…"
              : mode === "create"
                ? "Create expense"
                : "Save changes"}
          </Button>
        ) : null}
        <Link
          href={expense ? `/expenses/${expense.id}` : "/expenses"}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-navy transition hover:border-accent hover:bg-accent-soft/40"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
