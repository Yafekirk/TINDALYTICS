import {
  addManilaDays,
  getZonedParts,
  manilaDayKey,
  manilaWallTimeToUtc,
  startOfManilaDay,
} from "@/lib/utils/timezone";
import type { ReportPreset, ReportRange, ReportType } from "@/types/reports";

export function resolveReportType(value?: string | null): ReportType {
  if (
    value === "products" ||
    value === "categories" ||
    value === "payments" ||
    value === "inventory" ||
    value === "expenses" ||
    value === "pnl" ||
    value === "overview"
  ) {
    return value;
  }
  return "overview";
}

export function resolveReportPreset(value?: string | null): ReportPreset {
  if (
    value === "today" ||
    value === "7d" ||
    value === "30d" ||
    value === "month" ||
    value === "year" ||
    value === "custom"
  ) {
    return value;
  }
  return "30d";
}

function parseDateOnly(value?: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day };
}

export function getReportRange(params: {
  preset?: string | null;
  from?: string | null;
  to?: string | null;
  now?: Date;
}): ReportRange {
  const now = params.now ?? new Date();
  const preset = resolveReportPreset(params.preset);
  const todayStart = startOfManilaDay(now);
  const tomorrowStart = addManilaDays(todayStart, 1);
  const parts = getZonedParts(now);

  let start = todayStart;
  let end = tomorrowStart;
  let label = "Today";
  let effectivePreset = preset;

  if (preset === "7d") {
    start = addManilaDays(todayStart, -6);
    label = "Last 7 days";
  } else if (preset === "30d") {
    start = addManilaDays(todayStart, -29);
    label = "Last 30 days";
  } else if (preset === "month") {
    start = manilaWallTimeToUtc(parts.year, parts.month, 1);
    label = new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      month: "long",
      year: "numeric",
    }).format(now);
  } else if (preset === "year") {
    start = manilaWallTimeToUtc(parts.year, 1, 1);
    label = `Year ${parts.year}`;
  } else if (preset === "custom") {
    const fromParts = parseDateOnly(params.from);
    const toParts = parseDateOnly(params.to);
    if (fromParts && toParts) {
      start = manilaWallTimeToUtc(
        fromParts.year,
        fromParts.month,
        fromParts.day,
      );
      const toStart = manilaWallTimeToUtc(
        toParts.year,
        toParts.month,
        toParts.day,
      );
      end = addManilaDays(toStart, 1);
      label = `${params.from} to ${params.to}`;
    } else {
      // Fall back to 30d if custom dates are incomplete
      effectivePreset = "30d";
      start = addManilaDays(todayStart, -29);
      label = "Last 30 days";
    }
  } else {
    label = "Today";
  }

  if (start >= end) {
    start = addManilaDays(end, -1);
  }

  const dateFrom = manilaDayKey(start);
  const dateTo = manilaDayKey(addManilaDays(end, -1));

  return {
    preset: effectivePreset,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    label,
    dateFrom,
    dateTo,
  };
}

export function getReportRangeDates(range: ReportRange) {
  return {
    start: new Date(range.startIso),
    end: new Date(range.endIso),
  };
}

export function reportTypeLabel(type: ReportType): string {
  switch (type) {
    case "products":
      return "Sales by Product";
    case "categories":
      return "Sales by Category";
    case "payments":
      return "Payment Methods";
    case "inventory":
      return "Inventory Valuation";
    case "expenses":
      return "Expense Report";
    case "pnl":
      return "Profit & Loss";
    default:
      return "Sales Overview";
  }
}
