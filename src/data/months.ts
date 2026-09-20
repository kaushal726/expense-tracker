/* Spending cycles — "this month" and "this year" as the app means them.
 *
 * A cycle starts on the configured day (1–28) and runs to the day before the next one, so
 * a salary-day budget works the same as a calendar month. A year is twelve of those
 * cycles, starting with the one that begins in January. Both tile the calendar: every date
 * belongs to exactly one, with no gaps and no overlaps.
 */
import { formatDate, parseISODate, toISODate } from "../lib/dates";

export interface Span {
  /** The start date, which also identifies the span. */
  key: string;
  from: string;
  to: string;
}

const MS_PER_DAY = 86_400_000;
export const MONTHS_PER_YEAR = 12;

/** Whole days from `from` to `to`, both ends counted. */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / MS_PER_DAY) + 1;
}

function spanOfMonths(start: Date, startDay: number, months: number): Span {
  const from = toISODate(start);
  const to = toISODate(new Date(start.getFullYear(), start.getMonth() + months, startDay - 1));
  return { key: from, from, to };
}

/* ---------- monthly cycles ---------- */

/** The cycle a date falls in. */
export function cycleContaining(iso: string, startDay: number): Span {
  const d = parseISODate(iso);
  const monthOffset = d.getDate() >= startDay ? 0 : -1;
  return spanOfMonths(new Date(d.getFullYear(), d.getMonth() + monthOffset, startDay), startDay, 1);
}

/** The cycle `delta` cycles away (−1 is the previous one). */
export function shiftCycle(cycle: Span, startDay: number, delta: number): Span {
  const start = parseISODate(cycle.from);
  return spanOfMonths(new Date(start.getFullYear(), start.getMonth() + delta, startDay), startDay, 1);
}

/** `count` cycles ending with the one containing `iso`, oldest first. */
export function recentCycles(iso: string, startDay: number, count: number): Span[] {
  const current = cycleContaining(iso, startDay);
  return Array.from({ length: count }, (_, i) => shiftCycle(current, startDay, i - count + 1));
}

/** "September 2026" for a calendar month, "20 Sep – 19 Oct 2026" otherwise. */
export function cycleLabel(cycle: Span, startDay: number): string {
  if (startDay === 1) return formatDate(cycle.from, { month: "long", year: "numeric" });
  return `${formatDate(cycle.from, { day: "numeric", month: "short" })} – ${formatDate(cycle.to, { day: "numeric", month: "short", year: "numeric" })}`;
}

/** Chart-axis label: "Sep", and "Jan '26" where the year turns over. */
export function cycleShortLabel(cycle: Span): string {
  const start = parseISODate(cycle.from);
  const month = formatDate(cycle.from, { month: "short" });
  return start.getMonth() === 0 ? `${month} '${String(start.getFullYear()).slice(2)}` : month;
}

/* ---------- yearly spans ---------- */

/** The twelve cycles a date falls in, starting with January's. */
export function yearContaining(iso: string, startDay: number): Span {
  const year = parseISODate(cycleContaining(iso, startDay).from).getFullYear();
  return spanOfMonths(new Date(year, 0, startDay), startDay, MONTHS_PER_YEAR);
}

export function shiftYear(year: Span, startDay: number, delta: number): Span {
  const start = parseISODate(year.from);
  return spanOfMonths(new Date(start.getFullYear() + delta, 0, startDay), startDay, MONTHS_PER_YEAR);
}

/** `count` years ending with the one containing `iso`, oldest first. */
export function recentYears(iso: string, startDay: number, count: number): Span[] {
  const current = yearContaining(iso, startDay);
  return Array.from({ length: count }, (_, i) => shiftYear(current, startDay, i - count + 1));
}

/** "2026", or "2026–27" when the year doesn't start in January. */
export function yearLabel(year: Span, startDay: number): string {
  const start = parseISODate(year.from).getFullYear();
  return startDay === 1 ? String(start) : `${start}–${String(start + 1).slice(2)}`;
}
