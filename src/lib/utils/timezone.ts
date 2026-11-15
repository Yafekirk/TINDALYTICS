import { brand } from "@/config/brand";

const MANILA = brand.timezone;

/** Parts of `date` in Asia/Manila (or configured store timezone). */
export function getZonedParts(date: Date, timeZone = MANILA) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });

  const parts = formatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "0";

  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    hour: Number(read("hour")),
    minute: Number(read("minute")),
    second: Number(read("second")),
    weekday: read("weekday"),
  };
}

/** Convert a Manila wall-clock datetime to a UTC Date. */
export function manilaWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const parts = getZonedParts(utcGuess);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const diff = utcGuess.getTime() - asUtc;
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second) + diff);
}

export function startOfManilaDay(date = new Date()): Date {
  const parts = getZonedParts(date);
  return manilaWallTimeToUtc(parts.year, parts.month, parts.day, 0, 0, 0);
}

export function addManilaDays(date: Date, days: number): Date {
  const parts = getZonedParts(date);
  const base = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  base.setUTCDate(base.getUTCDate() + days);
  return manilaWallTimeToUtc(
    base.getUTCFullYear(),
    base.getUTCMonth() + 1,
    base.getUTCDate(),
    0,
    0,
    0,
  );
}

export function formatManilaDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  },
): string {
  return new Intl.DateTimeFormat(brand.locale, {
    timeZone: MANILA,
    ...options,
  }).format(date);
}

export function manilaDayKey(date: Date): string {
  const parts = getZonedParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function manilaMonthKey(date: Date): string {
  const parts = getZonedParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}`;
}

export type DashboardPeriod = "today" | "7d" | "30d";

export function resolveDashboardPeriod(value?: string | null): DashboardPeriod {
  if (value === "7d" || value === "30d" || value === "today") return value;
  return "today";
}

export function getPeriodBounds(period: DashboardPeriod, now = new Date()) {
  const todayStart = startOfManilaDay(now);
  const tomorrowStart = addManilaDays(todayStart, 1);

  if (period === "7d") {
    return {
      start: addManilaDays(todayStart, -6),
      end: tomorrowStart,
      previousStart: addManilaDays(todayStart, -13),
      previousEnd: todayStart,
      label: "Last 7 days",
      comparisonLabel: "vs prior 7 days",
    };
  }

  if (period === "30d") {
    return {
      start: addManilaDays(todayStart, -29),
      end: tomorrowStart,
      previousStart: addManilaDays(todayStart, -59),
      previousEnd: addManilaDays(todayStart, -29),
      label: "Last 30 days",
      comparisonLabel: "vs prior 30 days",
    };
  }

  return {
    start: todayStart,
    end: tomorrowStart,
    previousStart: addManilaDays(todayStart, -1),
    previousEnd: todayStart,
    label: "Today",
    comparisonLabel: "vs yesterday",
  };
}
