import {
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PesoIcon } from "@/components/ui/peso-icon";
import { formatCurrency } from "@/lib/utils/currency";
import { formatNumber } from "@/lib/utils/format";
import type { ReportSummary } from "@/types/reports";

type ReportsSummaryCardsProps = {
  summary: ReportSummary;
};

export function ReportsSummaryCards({ summary }: ReportsSummaryCardsProps) {
  const cards = [
    {
      label: "Revenue",
      value: formatCurrency(summary.revenue),
      hint: `${formatNumber(summary.transactions)} transactions`,
      icon: PesoIcon,
      tone: "bg-primary/10 text-primary",
    },
    {
      label: "Gross profit",
      value: formatCurrency(summary.grossProfit),
      hint: `COGS ${formatCurrency(summary.cogs)}`,
      icon: TrendingUp,
      tone: "bg-accent-soft text-navy",
    },
    {
      label: "Expenses",
      value: formatCurrency(summary.expenses),
      hint: "Active expenses in range",
      icon: Wallet,
      tone: "bg-amber-100 text-amber-800",
    },
    {
      label: "Net profit",
      value: formatCurrency(summary.netProfit),
      hint:
        summary.netProfit >= 0 ? "Revenue − COGS − expenses" : "Net loss",
      icon: summary.netProfit >= 0 ? TrendingUp : TrendingDown,
      tone:
        summary.netProfit >= 0
          ? "bg-primary/10 text-primary"
          : "bg-red-100 text-red-700",
    },
    {
      label: "Avg ticket",
      value: formatCurrency(summary.averageTicket),
      hint: `${formatNumber(summary.itemsSold)} items sold`,
      icon: Receipt,
      tone: "bg-slate-100 text-navy",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
