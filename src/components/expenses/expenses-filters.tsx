"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EXPENSE_CATEGORIES } from "@/types/expense";
import { expenseCategoryLabel } from "@/lib/validations/expense";

export function ExpensesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    if (!("page" in updates)) params.delete("page");
    startTransition(() => {
      const query = params.toString();
      router.push(query ? `/expenses?${query}` : "/expenses");
    });
  }

  return (
    <form
      className="grid gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-6"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        updateParams({
          q: String(form.get("q") || "") || null,
          category: String(form.get("category") || "all"),
          status: String(form.get("status") || "active"),
          from: String(form.get("from") || "") || null,
          to: String(form.get("to") || "") || null,
        });
      }}
    >
      <Input
        name="q"
        placeholder="Search expense…"
        defaultValue={searchParams.get("q") ?? ""}
        disabled={isPending}
      />
      <Select
        name="category"
        defaultValue={searchParams.get("category") ?? "all"}
        disabled={isPending}
      >
        <option value="all">All categories</option>
        {EXPENSE_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {expenseCategoryLabel(category)}
          </option>
        ))}
      </Select>
      <Select
        name="status"
        defaultValue={searchParams.get("status") ?? "active"}
        disabled={isPending}
      >
        <option value="active">Active</option>
        <option value="voided">Voided</option>
        <option value="archived">Archived</option>
        <option value="all">All statuses</option>
      </Select>
      <Input
        name="from"
        type="date"
        defaultValue={searchParams.get("from") ?? ""}
        disabled={isPending}
        aria-label="From date"
      />
      <Input
        name="to"
        type="date"
        defaultValue={searchParams.get("to") ?? ""}
        disabled={isPending}
        aria-label="To date"
      />
      <Button type="submit" disabled={isPending}>
        Apply
      </Button>
    </form>
  );
}
