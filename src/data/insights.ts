/* Every number the Insights tab shows — pure functions over a list of expenses.
 *
 * They all agree by construction: a period's category breakdown, its trend series and its
 * headline total are three views of the same sum, and nothing is dropped on the way
 * (an expense whose category was deleted lands in the "Uncategorised" slice).
 * src/data/insightsInvariants.test.ts checks that over generated data.
 */
import { addDays, isWithin } from "../lib/dates";
import { round2 } from "../lib/format";
import { DEFAULT_CATEGORY_COLOR } from "./categoryColors";
import { DEFAULT_CATEGORY_ICON } from "./categoryIcons";
import {
  cycleContaining, cycleShortLabel, daysBetween, recentCycles, recentYears,
  shiftCycle, shiftYear, yearContaining, yearLabel, type Span,
} from "./months";
import type { DateRange } from "./periods";
import type { Category, Expense } from "./types";

export const UNCATEGORISED_ID = "";
export const UNCATEGORISED_NAME = "Uncategorised";
/** URL token History uses for the slice holding expenses whose category was deleted. */
export const UNCATEGORISED_FILTER = "none";

export function totalOf(expenses: Expense[]): number {
  return round2(expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0));
}

export function inRange(expenses: Expense[], range: DateRange): Expense[] {
  return expenses.filter((e) => isWithin(e.date, range.from, range.to));
}

/* ---------- headline numbers ---------- */

export interface PeriodSummary {
  total: number;
  count: number;
  daysTotal: number;
  /** Days of the period that have already happened, at least 1 once it has started. */
  daysElapsed: number;
  daysLeft: number;
  dailyAverage: number;
  /** What the period ends at if the current rate holds. */
  projected: number;
}

export function summarise(expenses: Expense[], range: DateRange, today: string): PeriodSummary {
  const total = totalOf(expenses);
  const daysTotal = range.from && range.to ? Math.max(1, daysBetween(range.from, range.to)) : spanOf(expenses);
  const daysElapsed = elapsedDays(range, today, daysTotal);
  return {
    total,
    count: expenses.length,
    daysTotal,
    daysElapsed,
    daysLeft: Math.max(0, daysTotal - daysElapsed),
    dailyAverage: daysElapsed ? round2(total / daysElapsed) : 0,
    projected: daysElapsed ? round2((total / daysElapsed) * daysTotal) : total,
  };
}

function elapsedDays(range: DateRange, today: string, daysTotal: number): number {
  if (!range.from || !range.to) return daysTotal;
  if (today < range.from) return 0;
  if (today >= range.to) return daysTotal;
  return Math.max(1, daysBetween(range.from, today));
}

/** Days covered by an open-ended range: first spend to last spend. */
function spanOf(expenses: Expense[]): number {
  if (!expenses.length) return 1;
  const dates = expenses.map((e) => e.date).sort();
  return Math.max(1, daysBetween(dates[0], dates[dates.length - 1]));
}

/* ---------- by category ---------- */

export interface CategorySlice {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  count: number;
  /** Percent of the period total, 0 when nothing was spent. */
  share: number;
}

export function byCategory(expenses: Expense[], categories: Category[]): CategorySlice[] {
  const known = new Map(categories.map((c) => [c.id, c]));
  const buckets = new Map<string, { amount: number; count: number }>();
  expenses.forEach((e) => {
    const key = known.has(e.categoryId) ? e.categoryId : UNCATEGORISED_ID;
    const bucket = buckets.get(key) ?? { amount: 0, count: 0 };
    bucket.amount += Number(e.amount) || 0;
    bucket.count += 1;
    buckets.set(key, bucket);
  });

  const total = totalOf(expenses);
  return [...buckets.entries()]
    .map(([categoryId, bucket]) => {
      const category = known.get(categoryId);
      return {
        categoryId,
        name: category?.name ?? UNCATEGORISED_NAME,
        icon: category?.icon ?? DEFAULT_CATEGORY_ICON,
        color: category?.color ?? DEFAULT_CATEGORY_COLOR,
        amount: round2(bucket.amount),
        count: bucket.count,
        share: total ? round2((bucket.amount / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
}

/* ---------- day by day ---------- */

export interface DayPoint {
  date: string;
  amount: number;
  count: number;
}

/** One point per day of the range, including the days nothing was spent. */
export function byDay(expenses: Expense[], range: DateRange): DayPoint[] {
  const bounds = closedBounds(expenses, range);
  if (!bounds) return [];
  const buckets = new Map<string, { amount: number; count: number }>();
  expenses.forEach((e) => {
    const bucket = buckets.get(e.date) ?? { amount: 0, count: 0 };
    bucket.amount += Number(e.amount) || 0;
    bucket.count += 1;
    buckets.set(e.date, bucket);
  });

  const points: DayPoint[] = [];
  for (let date = bounds.from; date <= bounds.to; date = addDays(date, 1)) {
    const bucket = buckets.get(date);
    points.push({ date, amount: round2(bucket?.amount ?? 0), count: bucket?.count ?? 0 });
  }
  return points;
}

function closedBounds(expenses: Expense[], range: DateRange): DateRange | null {
  const dates = range.from && range.to ? [] : expenses.map((e) => e.date).sort();
  const from = range.from || dates[0];
  const to = range.to || dates[dates.length - 1];
  return from && to && from <= to ? { from, to } : null;
}

/** The days money actually went out, biggest first. */
export function busiestDays(points: DayPoint[], limit: number): DayPoint[] {
  return points.filter((p) => p.count > 0).sort((a, b) => b.amount - a.amount || b.date.localeCompare(a.date)).slice(0, limit);
}

export function biggestExpenses(expenses: Expense[], limit: number): Expense[] {
  return [...expenses].sort((a, b) => b.amount - a.amount || b.date.localeCompare(a.date)).slice(0, limit);
}

/* ---------- the trend chart, at whatever zoom the period needs ---------- */

export type Granularity = "day" | "month" | "year";

/** Above these many days a period is too wide to read day by day, then month by month. */
const MAX_DAYS_BY_DAY = 92;
const MAX_DAYS_BY_MONTH = 1100;
/** Nothing legitimate needs more bars than this; it also stops a bad date running the loop away. */
const MAX_BUCKETS = 400;

export interface TrendPoint {
  key: string;
  label: string;
  from: string;
  to: string;
  amount: number;
  count: number;
}

export function granularityFor(expenses: Expense[], range: DateRange): Granularity {
  const days = range.from && range.to ? daysBetween(range.from, range.to) : spanOf(expenses);
  if (days <= MAX_DAYS_BY_DAY) return "day";
  return days <= MAX_DAYS_BY_MONTH ? "month" : "year";
}

/** The period's spending, bucketed. Every expense passed in lands in exactly one bucket. */
export function trend(expenses: Expense[], range: DateRange, granularity: Granularity, monthStartDay: number): TrendPoint[] {
  const bounds = closedBounds(expenses, range);
  if (!bounds) return [];
  if (granularity === "day") {
    return byDay(expenses, bounds).map((p) => ({ key: p.date, label: String(Number(p.date.slice(8))), from: p.date, to: p.date, amount: p.amount, count: p.count }));
  }
  const spans = granularity === "month"
    ? coverSpans(bounds, cycleContaining(bounds.from, monthStartDay), (s) => shiftCycle(s, monthStartDay, 1))
    : coverSpans(bounds, yearContaining(bounds.from, monthStartDay), (s) => shiftYear(s, monthStartDay, 1));
  return spans.map((span) => toTrendPoint(expenses, span, granularity === "month" ? cycleShortLabel(span) : yearLabel(span, monthStartDay)));
}

function coverSpans(bounds: DateRange, first: Span, next: (span: Span) => Span): Span[] {
  const spans: Span[] = [];
  for (let span = first; span.from <= bounds.to && spans.length < MAX_BUCKETS; span = next(span)) spans.push(span);
  return spans;
}

function toTrendPoint(expenses: Expense[], span: Span, label: string): TrendPoint {
  const within = inRange(expenses, span);
  return { key: span.key, label, from: span.from, to: span.to, amount: totalOf(within), count: within.length };
}

/** The last `count` monthly cycles, whatever period is on screen. */
export function monthSeries(expenses: Expense[], today: string, monthStartDay: number, count: number): TrendPoint[] {
  return recentCycles(today, monthStartDay, count).map((span) => toTrendPoint(expenses, span, cycleShortLabel(span)));
}

/** The last `count` years, whatever period is on screen. */
export function yearSeries(expenses: Expense[], today: string, monthStartDay: number, count: number): TrendPoint[] {
  return recentYears(today, monthStartDay, count).map((span) => toTrendPoint(expenses, span, yearLabel(span, monthStartDay)));
}

/** How many whole years the records already cover — how far back a comparison can go. */
export function yearsOfHistory(expenses: Expense[], today: string, monthStartDay: number): number {
  if (!expenses.length) return 0;
  const oldest = expenses.reduce((min, e) => (e.date < min ? e.date : min), expenses[0].date);
  const first = yearContaining(oldest, monthStartDay);
  const current = yearContaining(today, monthStartDay);
  let years = 1;
  for (let span = first; span.from < current.from && years < MAX_BUCKETS; span = shiftYear(span, monthStartDay, 1)) years += 1;
  return years;
}

/* ---------- budget ---------- */

export interface BudgetStatus {
  budget: number;
  spent: number;
  /** Negative once the budget is blown. */
  left: number;
  /** Percent of the budget used; can go past 100. */
  usedShare: number;
  /** What is left to spend each remaining day without going over. */
  perDayLeft: number;
  overspent: boolean;
}

export function budgetStatus(spent: number, budget: number, daysLeft: number): BudgetStatus {
  const left = round2(budget - spent);
  return {
    budget,
    spent,
    left,
    usedShare: budget ? round2((spent / budget) * 100) : 0,
    perDayLeft: daysLeft > 0 ? round2(Math.max(0, left) / daysLeft) : 0,
    overspent: left < 0,
  };
}

/* ---------- comparison ---------- */

export interface Change {
  amount: number;
  /** null when there is nothing to compare against. */
  percent: number | null;
}

export function changeVs(current: number, previous: number): Change {
  return { amount: round2(current - previous), percent: previous ? round2(((current - previous) / previous) * 100) : null };
}
