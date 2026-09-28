/* Property tests for the money maths: hundreds of generated spending histories, each
 * checked against the promise Insights makes — the headline total, the category
 * breakdown and the trend are three views of one sum, nothing is dropped, and the month
 * boundaries follow the configured start day whatever it is set to.
 */
import { describe, expect, it } from "vitest";
import { addDays } from "../lib/dates";
import { round2 } from "../lib/format";
import {
  biggestExpenses, budgetStatus, busiestDays, byCategory, byDay, changeVs, granularityFor,
  inRange, monthSeries, summarise, totalOf, trend, UNCATEGORISED_ID, yearSeries, yearsOfHistory,
} from "./insights";
import { cycleContaining, daysBetween, recentCycles, recentYears, shiftCycle, yearContaining } from "./months";
import { presetRange, previousRange, type DateRange, type PeriodPreset } from "./periods";
import type { Category, Expense, SpendMethod } from "./types";

const CENT = 0.005;
const TODAY = "2026-09-20";
const METHODS: SpendMethod[] = ["cash", "upi", "card"];
const PRESETS: Exclude<PeriodPreset, "custom">[] = ["month", "lastMonth", "week", "year", "lastYear", "fiveYears", "tenYears", "all"];
const START_DAYS = [1, 1, 1, 7, 15, 28];
const TOP_LIMIT = 5;

/** Deterministic PRNG, so a failure can be replayed from its seed. */
function random(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

interface History {
  expenses: Expense[];
  categories: Category[];
  monthStartDay: number;
}

function history(seed: number): History {
  const rnd = random(seed);
  const pick = <T>(list: T[]): T => list[Math.floor(rnd() * list.length)];

  const categories: Category[] = Array.from({ length: 1 + Math.floor(rnd() * 5) }, (_, i) => ({
    id: `cat${i}`, name: `Category ${i}`, icon: "tag", color: "slate",
    monthlyBudget: pick([0, 0, 2000]), sortOrder: i, createdAt: i, updatedAt: i,
  }));
  // Some expenses point at a category that has since been deleted.
  const categoryIds = [...categories.map((c) => c.id), "gone", ""];

  const expenses: Expense[] = Array.from({ length: Math.floor(rnd() * 90) }, (_, i) => ({
    id: `e${i}`,
    date: addDays(TODAY, -Math.floor(rnd() ** 2 * 1500)),
    amount: pick([10, 20, 37.5, 99.99, 250, 1200, 0.01]),
    categoryId: pick(categoryIds),
    note: "",
    method: pick(METHODS),
    createdAt: i,
    updatedAt: i,
  }));

  return { expenses, categories, monthStartDay: pick(START_DAYS) };
}

const sum = (values: number[]) => round2(values.reduce((s, v) => s + v, 0));

function checkPeriod({ expenses, categories, monthStartDay }: History, range: DateRange): void {
  const within = inRange(expenses, range);
  const summary = summarise(within, range, TODAY);
  const total = totalOf(within);

  expect(summary.total).toBeCloseTo(total, 2);
  expect(summary.count).toBe(within.length);

  // Nothing is invented and nothing is dropped: every view sums back to the same figure.
  const slices = byCategory(within, categories);
  expect(sum(slices.map((s) => s.amount))).toBeCloseTo(total, 2);
  expect(slices.reduce((n, s) => n + s.count, 0)).toBe(within.length);
  if (total > 0) expect(sum(slices.map((s) => s.share))).toBeCloseTo(100, 1);
  // Expenses whose category is gone land in one slice rather than vanishing.
  const orphans = within.filter((e) => !categories.some((c) => c.id === e.categoryId));
  if (orphans.length) {
    const slice = slices.find((s) => s.categoryId === UNCATEGORISED_ID);
    expect(slice?.amount).toBeCloseTo(totalOf(orphans), 2);
  }
  expect([...slices].sort((a, b) => b.amount - a.amount).map((s) => s.amount)).toEqual(slices.map((s) => s.amount));

  const days = byDay(within, range);
  expect(sum(days.map((d) => d.amount))).toBeCloseTo(total, 2);
  expect(days.reduce((n, d) => n + d.count, 0)).toBe(within.length);
  if (days.length) {
    expect(days.length).toBe(daysBetween(days[0].date, days[days.length - 1].date));
    days.forEach((d, i) => { if (i) expect(d.date).toBe(addDays(days[i - 1].date, 1)); });
  }
  if (range.from && range.to) expect(days.length).toBe(daysBetween(range.from, range.to));

  // Every zoom level of the trend adds up to the same total, and the buckets touch end to end.
  (["day", "month", "year"] as const).forEach((granularity) => {
    const points = trend(within, range, granularity, monthStartDay);
    expect(sum(points.map((p) => p.amount))).toBeCloseTo(total, 2);
    expect(points.reduce((n, p) => n + p.count, 0)).toBe(within.length);
    points.forEach((p, i) => { if (i) expect(p.from).toBe(addDays(points[i - 1].to, 1)); });
  });
  expect(["day", "month", "year"]).toContain(granularityFor(within, range));

  // Days elapsed and left split the period exactly, and the projection never undershoots.
  expect(summary.daysElapsed + summary.daysLeft).toBe(summary.daysTotal);
  expect(summary.daysElapsed).toBeLessThanOrEqual(summary.daysTotal);
  expect(summary.projected).toBeGreaterThanOrEqual(total - CENT);
  // dailyAverage is rounded to paise, so it can only drift by half a paisa per day.
  if (summary.daysElapsed) {
    expect(Math.abs(summary.dailyAverage * summary.daysElapsed - total)).toBeLessThanOrEqual(CENT * summary.daysElapsed + CENT);
  }

  // A budget's numbers agree with each other.
  const BUDGET = 2000;
  const budget = budgetStatus(total, BUDGET, summary.daysTotal, summary.daysElapsed);
  expect(budget.left).toBeCloseTo(BUDGET - total, 2);
  expect(budget.overspent).toBe(budget.left < 0);
  expect(budget.perDayLeft * summary.daysLeft).toBeLessThanOrEqual(Math.max(0, budget.left) + CENT * summary.daysLeft + CENT);
  // The allowance spread over the period is the budget, and the pace numbers agree with
  // it — both are rounded to paise, so they can only drift half a paisa per day.
  expect(Math.abs(budget.dailyAllowance * summary.daysTotal - BUDGET)).toBeLessThanOrEqual(CENT * summary.daysTotal + CENT);
  expect(budget.expectedByNow).toBeCloseTo(budget.dailyAllowance * summary.daysElapsed, 2);
  expect(budget.aheadOfPace).toBeCloseTo(total - budget.expectedByNow, 2);
  if (summary.daysElapsed) {
    expect(Math.abs(budget.paceSoFar * summary.daysElapsed - total)).toBeLessThanOrEqual(CENT * summary.daysElapsed + CENT);
  }
  // The warning only fires once the budget is actually in trouble.
  expect(budget.severity === "ok").toBe(budget.usedShare < 90);
  expect(["over", "farOver"].includes(budget.severity)).toBe(budget.usedShare > 100);
  expect(budget.severity === "farOver").toBe(budget.usedShare > 150);

  const top = biggestExpenses(within, TOP_LIMIT);
  expect(top.length).toBe(Math.min(TOP_LIMIT, within.length));
  top.forEach((e, i) => { if (i) expect(e.amount).toBeLessThanOrEqual(top[i - 1].amount); });
  top.forEach((e) => expect(within).toContain(e));

  const busiest = busiestDays(days, TOP_LIMIT);
  busiest.forEach((d) => expect(d.count).toBeGreaterThan(0));
  busiest.forEach((d, i) => { if (i) expect(d.amount).toBeLessThanOrEqual(busiest[i - 1].amount); });
}

describe("insights invariants", () => {
  const seeds = Array.from({ length: 200 }, (_, i) => i + 1);

  it.each(seeds)("hold for spending history %i", (seed) => {
    const data = history(seed);
    PRESETS.forEach((preset) => checkPeriod(data, presetRange(preset, TODAY, data.monthStartDay)));

    // A custom range that deliberately cuts across cycle and year boundaries.
    checkPeriod(data, { from: addDays(TODAY, -400), to: addDays(TODAY, -37) });
  });

  it.each(seeds)("month and year series tile the past for history %i", (seed) => {
    const { expenses, monthStartDay } = history(seed);
    const months = monthSeries(expenses, TODAY, monthStartDay, 12);
    const cycles = recentCycles(TODAY, monthStartDay, 12);

    expect(months.map((m) => m.from)).toEqual(cycles.map((c) => c.from));
    months.forEach((m, i) => { if (i) expect(m.from).toBe(addDays(months[i - 1].to, 1)); });
    // The twelve months add up to exactly what was spent in the window they cover.
    expect(sum(months.map((m) => m.amount))).toBeCloseTo(totalOf(inRange(expenses, { from: months[0].from, to: months[11].to })), 2);

    const years = yearSeries(expenses, TODAY, monthStartDay, 3);
    expect(years.map((y) => y.from)).toEqual(recentYears(TODAY, monthStartDay, 3).map((y) => y.from));
    expect(sum(years.map((y) => y.amount))).toBeCloseTo(totalOf(inRange(expenses, { from: years[0].from, to: years[2].to })), 2);

    // A year is the twelve cycles inside it, no more and no less.
    const year = yearContaining(TODAY, monthStartDay);
    const inYear = recentCycles(year.to, monthStartDay, 12);
    expect(sum(inYear.map((c) => totalOf(inRange(expenses, c))))).toBeCloseTo(totalOf(inRange(expenses, year)), 2);

    const covered = yearsOfHistory(expenses, TODAY, monthStartDay);
    expect(covered).toBeGreaterThanOrEqual(expenses.length ? 1 : 0);
    if (expenses.length) {
      const oldest = expenses.reduce((min, e) => (e.date < min ? e.date : min), expenses[0].date);
      expect(recentYears(TODAY, monthStartDay, covered)[0].from).toBe(yearContaining(oldest, monthStartDay).from);
    }
  });

  it.each(seeds.slice(0, 60))("compare a period against the one before it for history %i", (seed) => {
    const { expenses, monthStartDay } = history(seed);
    const range = presetRange("month", TODAY, monthStartDay);
    const before = previousRange(range, "month", TODAY, monthStartDay);

    expect(before).toEqual(shiftCycle(cycleContaining(TODAY, monthStartDay), monthStartDay, -1));
    const current = totalOf(inRange(expenses, range));
    const previous = totalOf(inRange(expenses, before!));
    const change = changeVs(current, previous);
    expect(change.amount).toBeCloseTo(current - previous, 2);
    expect(change.percent === null).toBe(previous === 0);
    // The percentage is rounded to two places, so it reproduces the total to within that.
    if (previous) expect(Math.abs(previous * (1 + change.percent! / 100) - current)).toBeLessThanOrEqual(previous * 0.0001 + CENT);
  });
});
