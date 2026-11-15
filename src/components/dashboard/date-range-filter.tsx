"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { DashboardPeriod } from "@/lib/utils/timezone";

const options: { value: DashboardPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

type DateRangeFilterProps = {
  period: DashboardPeriod;
};

export function DateRangeFilter({ period }: DateRangeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setPeriod(next: DashboardPeriod) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "today") {
      params.delete("period");
    } else {
      params.set("period", next);
    }

    startTransition(() => {
      const query = params.toString();
      router.push(query ? `/dashboard?${query}` : "/dashboard");
    });
  }

  return (
    <div
      className={cn(
        "inline-flex rounded-xl border border-border bg-white p-1",
        isPending && "opacity-70",
      )}
    >
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant="ghost"
          className={cn(
            "h-8 rounded-lg px-3 hover:bg-accent-soft/60",
            period === option.value &&
              "bg-primary !text-white shadow-sm hover:bg-primary-hover hover:!text-white",
          )}
          onClick={() => setPeriod(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
