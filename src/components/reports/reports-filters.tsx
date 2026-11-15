"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ReportType } from "@/types/reports";

const reportTypes: { value: ReportType; label: string }[] = [
  { value: "overview", label: "Sales Overview" },
  { value: "products", label: "Sales by Product" },
  { value: "categories", label: "Sales by Category" },
  { value: "payments", label: "Payment Methods" },
  { value: "inventory", label: "Inventory Valuation" },
  { value: "expenses", label: "Expense Report" },
  { value: "pnl", label: "Profit & Loss" },
];

export function ReportsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const preset = searchParams.get("preset") ?? "30d";

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    startTransition(() => {
      const query = params.toString();
      router.push(query ? `/reports?${query}` : "/reports");
    });
  }

  return (
    <form
      className="grid gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm print:hidden md:grid-cols-2 xl:grid-cols-6"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const nextPreset = String(form.get("preset") || "30d");
        updateParams({
          type: String(form.get("type") || "overview"),
          preset: nextPreset,
          from:
            nextPreset === "custom"
              ? String(form.get("from") || "") || null
              : null,
          to:
            nextPreset === "custom"
              ? String(form.get("to") || "") || null
              : null,
        });
      }}
    >
      <Select
        name="type"
        defaultValue={searchParams.get("type") ?? "overview"}
        disabled={isPending}
      >
        {reportTypes.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </Select>
      <Select
        name="preset"
        defaultValue={preset}
        disabled={isPending}
        onChange={(event) => {
          const value = event.target.value;
          if (value !== "custom") {
            updateParams({
              type: searchParams.get("type") ?? "overview",
              preset: value,
              from: null,
              to: null,
            });
          }
        }}
      >
        <option value="today">Today</option>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="month">This month</option>
        <option value="year">This year</option>
        <option value="custom">Custom range</option>
      </Select>
      <Input
        name="from"
        type="date"
        defaultValue={searchParams.get("from") ?? ""}
        disabled={isPending || preset !== "custom"}
        aria-label="From date"
      />
      <Input
        name="to"
        type="date"
        defaultValue={searchParams.get("to") ?? ""}
        disabled={isPending || preset !== "custom"}
        aria-label="To date"
      />
      <div className="xl:col-span-2">
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          Apply filters
        </Button>
      </div>
    </form>
  );
}
