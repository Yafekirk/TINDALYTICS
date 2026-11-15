"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CashierOption } from "@/types/sales";

type SalesFiltersProps = {
  cashiers: CashierOption[];
};

export function SalesFilters({ cashiers }: SalesFiltersProps) {
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
      router.push(query ? `/sales?${query}` : "/sales");
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
          status: String(form.get("status") || "all"),
          payment: String(form.get("payment") || "") || null,
          cashier: String(form.get("cashier") || "") || null,
          from: String(form.get("from") || "") || null,
          to: String(form.get("to") || "") || null,
        });
      }}
    >
      <Input
        name="q"
        placeholder="Search receipt #…"
        defaultValue={searchParams.get("q") ?? ""}
        disabled={isPending}
      />
      <Select
        name="status"
        defaultValue={searchParams.get("status") ?? "all"}
        disabled={isPending}
      >
        <option value="all">All statuses</option>
        <option value="completed">Completed</option>
        <option value="voided">Voided</option>
        <option value="refunded">Refunded</option>
      </Select>
      <Select
        name="payment"
        defaultValue={searchParams.get("payment") ?? ""}
        disabled={isPending}
      >
        <option value="">All payments</option>
        <option value="cash">Cash</option>
        <option value="gcash">GCash</option>
        <option value="other">Other</option>
      </Select>
      <Select
        name="cashier"
        defaultValue={searchParams.get("cashier") ?? ""}
        disabled={isPending}
      >
        <option value="">All cashiers</option>
        {cashiers.map((cashier) => (
          <option key={cashier.id} value={cashier.id}>
            {cashier.fullName}
          </option>
        ))}
      </Select>
      <Input
        name="from"
        type="date"
        defaultValue={searchParams.get("from") ?? ""}
        disabled={isPending}
        aria-label="From date"
      />
      <div className="flex gap-2">
        <Input
          name="to"
          type="date"
          defaultValue={searchParams.get("to") ?? ""}
          disabled={isPending}
          aria-label="To date"
          className="flex-1"
        />
        <Button type="submit" disabled={isPending} className="shrink-0">
          Apply
        </Button>
      </div>
    </form>
  );
}
