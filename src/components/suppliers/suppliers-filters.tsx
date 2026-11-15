"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function SuppliersFilters() {
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
      router.push(query ? `/suppliers?${query}` : "/suppliers");
    });
  }

  return (
    <form
      className="grid gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm md:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        updateParams({
          q: String(form.get("q") || "") || null,
          status: String(form.get("status") || "active"),
        });
      }}
    >
      <Input
        name="q"
        placeholder="Search supplier, contact, phone…"
        defaultValue={searchParams.get("q") ?? ""}
        disabled={isPending}
      />
      <Select
        name="status"
        defaultValue={searchParams.get("status") ?? "active"}
        disabled={isPending}
      >
        <option value="active">Active</option>
        <option value="archived">Archived</option>
        <option value="all">All</option>
      </Select>
      <Button type="submit" disabled={isPending}>
        Apply
      </Button>
    </form>
  );
}
