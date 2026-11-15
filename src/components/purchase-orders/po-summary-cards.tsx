import { ClipboardList, PackageCheck, PackageOpen, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import { formatNumber } from "@/lib/utils/format";
import type { PurchaseOrderSummary } from "@/types/purchase-order";

type PoSummaryCardsProps = {
  summary: PurchaseOrderSummary;
};

export function PoSummaryCards({ summary }: PoSummaryCardsProps) {
  const cards = [
    {
      label: "Drafts",
      value: formatNumber(summary.draftCount),
      icon: ClipboardList,
      tone: "bg-slate-100 text-navy",
    },
    {
      label: "Ordered",
      value: formatNumber(summary.orderedCount),
      icon: PackageOpen,
      tone: "bg-accent-soft text-navy",
    },
    {
      label: "Partial / open value",
      value: formatCurrency(summary.openOrderValue),
      icon: Wallet,
      tone: "bg-amber-100 text-amber-800",
    },
    {
      label: "Received",
      value: formatNumber(summary.receivedCount),
      icon: PackageCheck,
      tone: "bg-primary/10 text-primary",
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
                {card.label.startsWith("Partial") ? (
                  <p className="mt-1 text-xs text-secondary">
                    {summary.partiallyReceivedCount} partially received
                  </p>
                ) : null}
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
