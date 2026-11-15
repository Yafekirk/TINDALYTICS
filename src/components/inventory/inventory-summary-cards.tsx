import {
  AlertTriangle,
  PackageCheck,
  PackageX,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import { formatNumber } from "@/lib/utils/format";
import type { InventorySummary } from "@/types/inventory";

type InventorySummaryCardsProps = {
  summary: InventorySummary;
};

const cards = [
  {
    key: "valuation",
    label: "Inventory value (cost)",
    icon: Wallet,
    tone: "bg-primary/10 text-primary",
  },
  {
    key: "inStock",
    label: "In stock SKUs",
    icon: PackageCheck,
    tone: "bg-emerald-100 text-emerald-800",
  },
  {
    key: "lowStock",
    label: "Low stock alerts",
    icon: AlertTriangle,
    tone: "bg-amber-100 text-amber-800",
  },
  {
    key: "outOfStock",
    label: "Out of stock",
    icon: PackageX,
    tone: "bg-red-100 text-red-700",
  },
] as const;

export function InventorySummaryCards({ summary }: InventorySummaryCardsProps) {
  const values = {
    valuation: formatCurrency(summary.valuationAtCost),
    inStock: formatNumber(summary.inStock),
    lowStock: formatNumber(summary.lowStock),
    outOfStock: formatNumber(summary.outOfStock),
  };

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.key}>
            <CardContent className="flex items-start justify-between gap-3 p-5">
              <div>
                <p className="text-sm text-secondary">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold text-navy">
                  {values[card.key]}
                </p>
                {card.key === "valuation" ? (
                  <p className="mt-1 text-xs text-secondary">
                    Retail: {formatCurrency(summary.valuationAtRetail)}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-secondary">
                    of {formatNumber(summary.totalSkus)} active SKUs
                  </p>
                )}
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
    </section>
  );
}
