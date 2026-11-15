import { brand } from "@/config/brand";

export function formatDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  },
) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(brand.locale, {
    timeZone: brand.timezone,
    ...options,
  }).format(date);
}

export function formatDateTime(value: string | Date) {
  return formatDate(value, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat(brand.locale).format(value);
}
