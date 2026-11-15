"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { SupplierOption } from "@/types/product";

type PoFiltersProps = {
  suppliers: SupplierOption[];
};

export function PoFilters({ suppliers }: PoFiltersProps) {
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
      router.push(query ? `/purchase-orders?${query}` : "/purchase-orders");
    });
  }

  return (
    <form
      className="grid gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        updateParams({
          q: String(form.get("q") || "") || null,
          status: String(form.get("status") || "all"),
          supplier: String(form.get("supplier") || "") || null,
          from: String(form.get("from") || "") || null,
          to: String(form.get("to") || "") || null,
        });
      }}
    >
      <Input
        name="q"
        placeholder="Search PO number…"
        defaultValue={searchParams.get("q") ?? ""}
        disabled={isPending}
      />
      <Select
        name="status"
        defaultValue={searchParams.get("status") ?? "all"}
        disabled={isPending}
      >
        <option value="all">All statuses</option>
        <option value="draft">Draft</option>
        <option value="ordered">Ordered</option>
        <option value="partially_received">Partially received</option>
        <option value="received">Received</option>
        <option value="cancelled">Cancelled</option>
      </Select>
      <Select
        name="supplier"
        defaultValue={searchParams.get("supplier") ?? ""}
        disabled={isPending}
      >
        <option value="">All suppliers</option>
        {suppliers.map((supplier) => (
          <option key={supplier.id} value={supplier.id}>
            {supplier.name}
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
