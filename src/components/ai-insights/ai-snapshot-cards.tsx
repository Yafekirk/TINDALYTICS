import {
  CircleDollarSign,
  PackageX,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import { formatNumber } from "@/lib/utils/format";
import type { AiInsightsSnapshot } from "@/types/ai-insights";

type AiSnapshotCardsProps = {
  snapshot: AiInsightsSnapshot;
};

export function AiSnapshotCards({ snapshot }: AiSnapshotCardsProps) {
  const cards = [
    {
      label: "Revenue (30d)",
      value: formatCurrency(snapshot.summary.revenue),
      hint: `${formatNumber(snapshot.summary.transactions)} transactions`,
      icon: CircleDollarSign,
      tone: "bg-primary/10 text-primary",
    },
    {
      label: "Gross profit",
      value: formatCurrency(snapshot.summary.grossProfit),
      hint: `Net ${formatCurrency(snapshot.summary.netProfit)}`,
      icon: TrendingUp,
      tone: "bg-accent-soft text-navy",
    },
    {
      label: "Avg ticket",
      value: formatCurrency(snapshot.summary.averageTicket),
      hint: `${formatNumber(snapshot.summary.itemsSold)} items sold`,
      icon: Receipt,
      tone: "bg-slate-100 text-navy",
    },
    {
      label: "Expenses",
      value: formatCurrency(snapshot.summary.expenses),
      hint: `${formatNumber(snapshot.lowStock.length)} low-stock SKUs`,
      icon: snapshot.lowStock.length > 0 ? PackageX : Wallet,
      tone:
        snapshot.lowStock.length > 0
          ? "bg-amber-100 text-amber-800"
          : "bg-slate-100 text-navy",
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
