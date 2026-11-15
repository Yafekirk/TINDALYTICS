"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CustomersFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const q = String(form.get("q") || "");
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        startTransition(() => {
          const query = params.toString();
          router.push(query ? `/customers?${query}` : "/customers");
        });
      }}
    >
      <Input
        name="q"
        placeholder="Search name, phone, or address…"
        defaultValue={searchParams.get("q") ?? ""}
        disabled={isPending}
        className="flex-1"
      />
      <Button type="submit" disabled={isPending}>
        Search
      </Button>
    </form>
  );
}
