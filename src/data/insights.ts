/* Every number the Insights tab shows — pure functions over a list of expenses.
 *
 * They all agree by construction: a period's category breakdown, its trend series and its
 * headline total are three views of the same sum, and nothing is dropped on the way
 * (an expense whose category was deleted lands in the "Uncategorised" slice).
 * src/data/insightsInvariants.test.ts checks that over generated data.
 */
import { addDays, isWithin, parseISODate } from "../lib/dates";
import { round2 } from "../lib/format";
import { DEFAULT_CATEGORY_COLOR } from "./categoryColors";
import { DEFAULT_CATEGORY_ICON } from "./categoryIcons";
import {
  cycleContaining, cycleShortLabel, daysBetween, recentCycles, recentYears,
  shiftCycle, shiftYear, yearContaining, yearLabel, type Span,
} from "./months";
import type { DateRange } from "./periods";
import { SPEND_METHODS } from "./methods";
import { costsIn } from "./spread";
import type { Category, Expense, SpendMethod } from "./types";

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

/** How many payments these amounts came from. A payment spread over months arrives once
 *  per cycle it covers, and counting those as separate expenses would overstate every
 *  "entries" figure on screen, so they are counted by id. */
export function countOf(expenses: Expense[]): number {
  return new Set(expenses.map((e) => e.id)).size;
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
    count: countOf(expenses),
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
  const buckets = new Map<string, { amount: number; ids: Set<string> }>();
  expenses.forEach((e) => {
    const key = known.has(e.categoryId) ? e.categoryId : UNCATEGORISED_ID;
    const bucket = buckets.get(key) ?? { amount: 0, ids: new Set<string>() };
    bucket.amount += Number(e.amount) || 0;
    bucket.ids.add(e.id);
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
        count: bucket.ids.size,
        share: total ? round2((bucket.amount / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
}

export interface CategoryMovement extends CategorySlice {
  /** What this category cost in the period before. */
  previous: number;
  /** Positive means it grew — the categories worth looking at first. */
  change: number;
}

/** Pairs this period's slices with the same categories in the period before. */
export function withPrevious(slices: CategorySlice[], previousSlices: CategorySlice[]): CategoryMovement[] {
  const before = new Map(previousSlices.map((s) => [s.categoryId, s.amount]));
  return slices.map((slice) => {
    const previous = before.get(slice.categoryId) ?? 0;
    return { ...slice, previous, change: round2(slice.amount - previous) };
  });
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

/* ---------- cumulative pace ---------- */

export interface CumulativePoint {
  date: string;
  /** Everything spent from the start of the period up to and including this day. */
  total: number;
}

/** The running total day by day — what a budget is actually raced against. `opening` is
 *  what the period owed before any of it was spent: cost carried in from a payment made
 *  earlier, which the month starts out already down by. */
export function cumulativeSeries(points: DayPoint[], opening = 0): CumulativePoint[] {
  let running = round2(opening);
  return points.map((point) => {
    running = round2(running + point.amount);
    return { date: point.date, total: running };
  });
}

/* ---------- by weekday ---------- */

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface WeekdayPoint {
  /** 0 is Monday, to match the calendar. */
  weekday: number;
  label: string;
  amount: number;
  count: number;
  /** How many of this weekday the period held, so the average means something. */
  days: number;
  average: number;
}

/** Which day of the week the money goes on, averaged over how often that day came round. */
export function byWeekday(points: DayPoint[]): WeekdayPoint[] {
  const buckets = WEEKDAY_LABELS.map((label, weekday) => ({ weekday, label, amount: 0, count: 0, days: 0, average: 0 }));
  points.forEach((point) => {
    const bucket = buckets[(parseISODate(point.date).getDay() + 6) % 7];
    bucket.amount += point.amount;
    bucket.count += point.count;
    bucket.days += 1;
  });
  return buckets.map((b) => ({ ...b, amount: round2(b.amount), average: b.days ? round2(b.amount / b.days) : 0 }));
}

/* ---------- by payment method ---------- */

export interface MethodSlice {
  method: SpendMethod;
  label: string;
  amount: number;
  count: number;
  share: number;
}

/** How the money left: cash, UPI or card. Methods with nothing against them drop out. */
export function byMethod(expenses: Expense[]): MethodSlice[] {
  const total = totalOf(expenses);
  return SPEND_METHODS
    .map(({ value, label }) => {
      const mine = expenses.filter((e) => e.method === value);
      const amount = totalOf(mine);
      return { method: value, label, amount, count: countOf(mine), share: total ? round2((amount / total) * 100) : 0 };
    })
    .filter((slice) => slice.count > 0)
    .sort((a, b) => b.amount - a.amount);
}

/* ---------- what is still safe to spend, per category ---------- */

export interface CategoryAllowance {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  spent: number;
  /** What is left: the category's own budget minus its spend, or its share of what the
   *  month's budget still allows. */
  left: number;
  perDay: number;
  /** True when the figure comes from a budget set on the category itself. */
  ownBudget: boolean;
  overspent: boolean;
}

/**
 * How much each category still allows. A category with its own budget is measured against
 * it; the rest share what is left of the month's budget in the proportion they have been
 * used, which is the honest answer to "if I carry on like this, what do I have left".
 */
export function safeToSpend(slices: CategorySlice[], categories: Category[], budgetLeft: number, daysLeft: number): CategoryAllowance[] {
  const budgets = new Map(categories.map((c) => [c.id, c.monthlyBudget]));
  const pool = Math.max(0, budgetLeft);
  return slices.map((slice) => {
    const own = budgets.get(slice.categoryId) ?? 0;
    const left = own > 0 ? round2(own - slice.amount) : round2(pool * (slice.share / 100));
    return {
      categoryId: slice.categoryId,
      name: slice.name,
      icon: slice.icon,
      color: slice.color,
      spent: slice.amount,
      left,
      perDay: daysLeft > 0 ? round2(Math.max(0, left) / daysLeft) : 0,
      ownBudget: own > 0,
      overspent: left < 0,
    };
  });
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
  return spans.map((span) => toTrendPoint(expenses, span, granularity === "month" ? cycleShortLabel(span) : yearLabel(span, monthStartDay), monthStartDay));
}

function coverSpans(bounds: DateRange, first: Span, next: (span: Span) => Span): Span[] {
  const spans: Span[] = [];
  for (let span = first; span.from <= bounds.to && spans.length < MAX_BUCKETS; span = next(span)) spans.push(span);
  return spans;
}

/* Each bucket is charged what it costs, not what was paid inside it: a six-month recharge
 * shows up as a sixth in each of six bars rather than a spike in one. Expenses already
 * reduced to one window's cost pass through costsIn() as a plain filter, so a series
 * built from raw records and one built from a period's costs both come out right. */
function toTrendPoint(expenses: Expense[], span: Span, label: string, monthStartDay: number): TrendPoint {
  const within = costsIn(expenses, span, monthStartDay);
  return { key: span.key, label, from: span.from, to: span.to, amount: totalOf(within), count: countOf(within) };
}

/** The last `count` monthly cycles, whatever period is on screen. */
export function monthSeries(expenses: Expense[], today: string, monthStartDay: number, count: number): TrendPoint[] {
  return recentCycles(today, monthStartDay, count).map((span) => toTrendPoint(expenses, span, cycleShortLabel(span), monthStartDay));
}

/** Drops the empty run at the front of a series: a first month of use should not open on
 *  eleven blank bars. Never trims below `keepAtLeast`, so the chart keeps its shape. */
export function trimLeadingEmpty(points: TrendPoint[], keepAtLeast: number): TrendPoint[] {
  const firstUsed = points.findIndex((p) => p.amount !== 0);
  if (firstUsed < 0) return points.slice(-keepAtLeast);
  return points.slice(Math.min(firstUsed, Math.max(0, points.length - keepAtLeast)));
}

/** The average of the buckets that had something in them — the line worth drawing. */
export function meanOfUsed(points: TrendPoint[]): number {
  const used = points.filter((p) => p.amount !== 0);
  return used.length ? round2(used.reduce((sum, p) => sum + p.amount, 0) / used.length) : 0;
}

/** The last `count` years, whatever period is on screen. */
export function yearSeries(expenses: Expense[], today: string, monthStartDay: number, count: number): TrendPoint[] {
  return recentYears(today, monthStartDay, count).map((span) => toTrendPoint(expenses, span, yearLabel(span, monthStartDay), monthStartDay));
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

/** How far past the budget counts as merely over, and as badly over. */
const CLOSE_SHARE = 90;
const FAR_OVER_SHARE = 150;

export type BudgetSeverity = "ok" | "close" | "over" | "farOver";

export interface BudgetStatus {
  budget: number;
  spent: number;
  /** Negative once the budget is blown. */
  left: number;
  /** Percent of the budget used; can go past 100. */
  usedShare: number;
  /** What is left to spend each remaining day without going over. */
  perDayLeft: number;
  /** The even daily rate the budget allows across the whole period. */
  dailyAllowance: number;
  /** What an even spender would be at by now. */
  expectedByNow: number;
  /** Spent minus that: positive means running hot. */
  aheadOfPace: number;
  /** What has been spent each day so far. */
  paceSoFar: number;
  overspent: boolean;
  severity: BudgetSeverity;
}

function severityOf(usedShare: number): BudgetSeverity {
  if (usedShare > FAR_OVER_SHARE) return "farOver";
  if (usedShare > 100) return "over";
  return usedShare >= CLOSE_SHARE ? "close" : "ok";
}

export function budgetStatus(spent: number, budget: number, daysTotal: number, daysElapsed: number): BudgetStatus {
  const left = round2(budget - spent);
  const daysLeft = Math.max(0, daysTotal - daysElapsed);
  const usedShare = budget ? round2((spent / budget) * 100) : 0;
  const dailyAllowance = daysTotal > 0 ? round2(budget / daysTotal) : 0;
  const expectedByNow = round2(dailyAllowance * daysElapsed);
  return {
    budget,
    spent,
    left,
    usedShare,
    perDayLeft: daysLeft > 0 ? round2(Math.max(0, left) / daysLeft) : 0,
    dailyAllowance,
    expectedByNow,
    aheadOfPace: round2(spent - expectedByNow),
    paceSoFar: daysElapsed > 0 ? round2(spent / daysElapsed) : 0,
    overspent: left < 0,
    severity: severityOf(usedShare),
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
