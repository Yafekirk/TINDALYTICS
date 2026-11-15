"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function CreditsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const customerId = searchParams.get("customerId");

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    if (!("page" in updates)) params.delete("page");
    startTransition(() => {
      const query = params.toString();
      router.push(query ? `/credits?${query}` : "/credits");
    });
  }

  return (
    <div className="space-y-2">
      <form
        className="grid gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          updateParams({
            q: String(form.get("q") || "") || null,
            status: String(form.get("status") || "outstanding"),
            customerId: customerId || null,
          });
        }}
      >
        <Input
          name="q"
          placeholder="Search customer…"
          defaultValue={searchParams.get("q") ?? ""}
          disabled={isPending}
        />
        <Select
          name="status"
          defaultValue={searchParams.get("status") ?? "outstanding"}
          disabled={isPending}
        >
          <option value="outstanding">Outstanding</option>
          <option value="overdue">Overdue</option>
          <option value="open">Open</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="voided">Voided</option>
          <option value="all">All statuses</option>
        </Select>
        <div className="flex gap-2 xl:col-span-2">
          <Button type="submit" disabled={isPending} className="flex-1">
            Apply filters
          </Button>
          {customerId ? (
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={() =>
                updateParams({
                  q: searchParams.get("q"),
                  status: searchParams.get("status") ?? "outstanding",
                  customerId: null,
                })
              }
            >
              Clear customer
            </Button>
          ) : null}
        </div>
      </form>
      {customerId ? (
        <p className="text-xs text-secondary">
          Showing credits for one customer.{" "}
          <Link href="/credits" className="font-medium text-primary hover:underline">
            Show all
          </Link>
        </p>
      ) : null}
    </div>
  );
}
