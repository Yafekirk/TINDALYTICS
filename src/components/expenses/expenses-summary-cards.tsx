import { Ban, Archive, Receipt, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import { formatNumber } from "@/lib/utils/format";
import type { ExpenseSummary } from "@/types/expense";

type ExpensesSummaryCardsProps = {
  summary: ExpenseSummary;
};

export function ExpensesSummaryCards({ summary }: ExpensesSummaryCardsProps) {
  const cards = [
    {
      label: "Active total",
      value: formatCurrency(summary.totalAmount),
      hint: `${formatNumber(summary.activeCount)} active`,
      icon: Wallet,
      tone: "bg-primary/10 text-primary",
    },
    {
      label: "Active expenses",
      value: formatNumber(summary.activeCount),
      hint: "Included in reports",
      icon: Receipt,
      tone: "bg-accent-soft text-navy",
    },
    {
      label: "Voided",
      value: formatNumber(summary.voidedCount),
      hint: "Excluded from totals",
      icon: Ban,
      tone: "bg-amber-100 text-amber-800",
    },
    {
      label: "Archived",
      value: formatNumber(summary.archivedCount),
      hint: "Kept for history",
      icon: Archive,
      tone: "bg-slate-100 text-navy",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <CardContent className="flex items-start justify-between gap-3 p-5">
              <div>
                <p className="text-sm text-secondary">{card.label}</p>
                <p className="mt-2 text-xl font-semibold text-navy">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-secondary">{card.hint}</p>
              </div>
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.tone}`}
              >
                <Icon className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
