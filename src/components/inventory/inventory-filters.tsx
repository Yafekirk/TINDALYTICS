"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CategoryOption } from "@/types/product";

type InventoryFiltersProps = {
  categories: CategoryOption[];
};

export function InventoryFilters({ categories }: InventoryFiltersProps) {
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
      router.push(query ? `/inventory?${query}` : "/inventory");
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
          category: String(form.get("category") || "") || null,
          status: String(form.get("status") || "all"),
          sort: String(form.get("sort") || "name"),
          dir: String(form.get("dir") || "asc"),
        });
      }}
    >
      <Input
        name="q"
        placeholder="Search product or SKU…"
        defaultValue={searchParams.get("q") ?? ""}
        disabled={isPending}
      />
      <Select
        name="category"
        defaultValue={searchParams.get("category") ?? ""}
        disabled={isPending}
      >
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>
      <Select
        name="status"
        defaultValue={searchParams.get("status") ?? "all"}
        disabled={isPending}
      >
        <option value="all">All stock statuses</option>
        <option value="in_stock">In stock</option>
        <option value="low_stock">Low stock</option>
        <option value="out_of_stock">Out of stock</option>
      </Select>
      <Select
        name="sort"
        defaultValue={searchParams.get("sort") ?? "name"}
        disabled={isPending}
      >
        <option value="name">Sort by name</option>
        <option value="sku">Sort by SKU</option>
        <option value="quantity">Sort by quantity</option>
        <option value="value">Sort by value</option>
      </Select>
      <div className="flex gap-2">
        <Select
          name="dir"
          defaultValue={searchParams.get("dir") ?? "asc"}
          disabled={isPending}
          className="flex-1"
        >
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </Select>
        <Button type="submit" disabled={isPending} className="shrink-0">
          Apply
        </Button>
      </div>
    </form>
  );
}
