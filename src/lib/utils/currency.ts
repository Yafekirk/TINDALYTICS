import { brand } from "@/config/brand";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(brand.locale, {
    style: "currency",
    currency: brand.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `${brand.currencySymbol}${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${brand.currencySymbol}${(amount / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
}
