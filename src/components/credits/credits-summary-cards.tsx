import { AlertTriangle, CheckCircle2, HandCoins, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import { formatNumber } from "@/lib/utils/format";
import type { CreditSummary } from "@/types/credit";

type CreditsSummaryCardsProps = {
  summary: CreditSummary;
};

export function CreditsSummaryCards({ summary }: CreditsSummaryCardsProps) {
  const cards = [
    {
      label: "Outstanding utang",
      value: formatCurrency(summary.outstandingTotal),
      hint: `${formatNumber(summary.outstandingCount)} open records`,
      icon: HandCoins,
      tone: "bg-primary/10 text-primary",
    },
    {
      label: "Overdue",
      value: formatCurrency(summary.overdueTotal),
      hint: `${formatNumber(summary.overdueCount)} past due`,
      icon: AlertTriangle,
      tone: "bg-amber-100 text-amber-800",
    },
    {
      label: "Open / partial",
      value: formatNumber(summary.openCount + summary.partialCount),
      hint: `${formatNumber(summary.openCount)} open · ${formatNumber(summary.partialCount)} partial`,
      icon: Wallet,
      tone: "bg-accent-soft text-navy",
    },
    {
      label: "Fully paid",
      value: formatNumber(summary.paidCount),
      hint: "Closed credit records",
      icon: CheckCircle2,
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
