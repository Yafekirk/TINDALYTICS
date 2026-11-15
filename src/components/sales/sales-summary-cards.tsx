import { Ban, CircleDollarSign, Receipt, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import { formatNumber } from "@/lib/utils/format";
import type { SaleSummary } from "@/types/sales";

type SalesSummaryCardsProps = {
  summary: SaleSummary;
};

const cards = [
  {
    key: "completedSales",
    label: "Completed sales",
    icon: CircleDollarSign,
    tone: "bg-primary/10 text-primary",
    format: "currency" as const,
  },
  {
    key: "transactionCount",
    label: "Transactions",
    icon: Receipt,
    tone: "bg-accent-soft text-navy",
    format: "number" as const,
  },
  {
    key: "averageTicket",
    label: "Average ticket",
    icon: CircleDollarSign,
    tone: "bg-slate-100 text-navy",
    format: "currency" as const,
  },
  {
    key: "voidedCount",
    label: "Voided",
    icon: Ban,
    tone: "bg-amber-100 text-amber-800",
    format: "number" as const,
  },
  {
    key: "refundedCount",
    label: "Refunded",
    icon: RotateCcw,
    tone: "bg-red-100 text-red-700",
    format: "number" as const,
  },
] as const;

export function SalesSummaryCards({ summary }: SalesSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const raw = summary[card.key];
        const value =
          card.format === "currency" ? formatCurrency(raw) : formatNumber(raw);

        return (
          <Card key={card.key}>
            <CardContent className="flex items-start justify-between gap-3 p-5">
              <div>
                <p className="text-sm text-secondary">{card.label}</p>
                <p className="mt-2 text-xl font-semibold text-navy">{value}</p>
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
