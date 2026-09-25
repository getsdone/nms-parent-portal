const wholeDollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const withCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCents(cents: number): string {
  return cents % 100 === 0 ? wholeDollars.format(cents / 100) : withCents.format(cents / 100);
}

/**
 * A date-only string ("YYYY-MM-DD") parsed by `new Date()` is UTC midnight,
 * which shows as the previous day west of UTC. Parse it as local midnight.
 */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Whole calendar days from today to the given date-only string; negative when past. */
export function daysFromToday(value: string): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parseDateOnly(value).getTime() - today.getTime()) / MS_PER_DAY);
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const monthShort = new Intl.DateTimeFormat("en-US", { month: "short" });
const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

export function formatMonthDay(date: Date): string {
  return monthDay.format(date);
}

export function formatWeekday(date: Date): string {
  return weekday.format(date);
}

export function formatMonthShort(date: Date): string {
  return monthShort.format(date);
}

export function formatTime(date: Date): string {
  return time.format(date);
}

/** "Thu, Oct 1 · 7:00 PM" for an ISO timestamp. */
export function formatEventWhen(iso: string): string {
  const date = new Date(iso);
  return `${formatWeekday(date)}, ${formatMonthDay(date)} · ${formatTime(date)}`;
}
