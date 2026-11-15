import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  PackageX,
  Receipt,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PesoIcon } from "@/components/ui/peso-icon";
import { formatCurrency } from "@/lib/utils/currency";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { KpiMetric } from "@/types/dashboard";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

const iconMap: Record<string, IconComponent> = {
  "today-sales": PesoIcon,
  "today-transactions": Receipt,
  "total-products": Boxes,
  "inventory-value": Warehouse,
  "gross-profit": TrendingUp,
  "low-stock": PackageX,
};

const toneStyles = {
  default: "bg-slate-100 text-navy",
  success: "bg-primary/10 text-primary",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-700",
  info: "bg-accent-soft text-navy",
} as const;

type KpiCardProps = {
  metric: KpiMetric;
};

export function KpiCard({ metric }: KpiCardProps) {
  const Icon = iconMap[metric.id] ?? PesoIcon;
  const isPositive = metric.change >= 0;
  const formattedValue =
    metric.format === "currency"
      ? formatCurrency(metric.value)
      : formatNumber(metric.value);

  return (
    <Card className="group cursor-default hover:-translate-y-1">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-secondary">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-navy">
              {formattedValue}
            </p>
          </div>
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110",
              toneStyles[metric.tone],
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              isPositive ? "text-primary" : "text-danger",
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {Math.abs(metric.change)}
            {metric.id === "low-stock" || metric.id === "total-products"
              ? ""
              : "%"}
          </span>
          <span className="text-secondary">{metric.changeLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}
