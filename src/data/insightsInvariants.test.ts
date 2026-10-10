/* Property tests for the money maths: hundreds of generated spending histories, each
 * checked against the promise Insights makes — the headline total, the category
 * breakdown and the trend are three views of one sum, nothing is dropped, and the month
 * boundaries follow the configured start day whatever it is set to.
 */
import { describe, expect, it } from "vitest";
import { addDays } from "../lib/dates";
import { round2 } from "../lib/format";
import {
  biggestExpenses, budgetStatus, busiestDays, byCategory, byDay, changeVs, countOf, granularityFor,
  byMethod, byWeekday, cumulativeSeries, inRange, meanOfUsed, monthSeries, safeToSpend, summarise,
  totalOf, trend, trimLeadingEmpty, UNCATEGORISED_ID, withPrevious, yearSeries, yearsOfHistory,
} from "./insights";
import { carriedInto, costsIn, dayCostsIn, sharesOf } from "./spread";
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
    // Mostly ordinary expenses, with the occasional recharge or yearly subscription.
    spreadMonths: pick([1, 1, 1, 1, 1, 3, 6, 12]),
    createdAt: i,
    updatedAt: i,
  }));

  return { expenses, categories, monthStartDay: pick(START_DAYS) };
}

const sum = (values: number[]) => round2(values.reduce((s, v) => s + v, 0));

function checkPeriod({ expenses, categories, monthStartDay }: History, range: DateRange): void {
  /* What the period costs, which is what every screen hands these functions: a payment
   * spread over months arrives as one share per cycle it covers. */
  const within = costsIn(expenses, range, monthStartDay);
  const summary = summarise(within, range, TODAY);
  const total = totalOf(within);

  expect(summary.total).toBeCloseTo(total, 2);
  // A payment counts once however many cycles it reaches into.
  expect(summary.count).toBe(countOf(within));
  expect(summary.count).toBeLessThanOrEqual(within.length);

  // Nothing is invented and nothing is dropped: every view sums back to the same figure.
  const slices = byCategory(within, categories);
  expect(sum(slices.map((s) => s.amount))).toBeCloseTo(total, 2);
  expect(slices.reduce((n, s) => n + s.count, 0)).toBe(countOf(within));
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
    points.forEach((p, i) => {
      if (i) expect(p.from).toBe(addDays(points[i - 1].to, 1));
      // Each bucket holds exactly what falls inside it. A year-wide bucket can hold
      // several cycles of one spread payment, and counts it as the one payment it is.
      const inBucket = within.filter((e) => e.date >= p.from && e.date <= p.to);
      expect(p.amount).toBeCloseTo(totalOf(inBucket), 2);
      expect(p.count).toBe(countOf(inBucket));
    });
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
    const window = { from: months[0].from, to: months[11].to };
    expect(sum(months.map((m) => m.amount))).toBeCloseTo(totalOf(costsIn(expenses, window, monthStartDay)), 2);

    const years = yearSeries(expenses, TODAY, monthStartDay, 3);
    expect(years.map((y) => y.from)).toEqual(recentYears(TODAY, monthStartDay, 3).map((y) => y.from));
    expect(sum(years.map((y) => y.amount))).toBeCloseTo(totalOf(costsIn(expenses, { from: years[0].from, to: years[2].to }, monthStartDay)), 2);

    // A year is the twelve cycles inside it, no more and no less.
    const year = yearContaining(TODAY, monthStartDay);
    const inYear = recentCycles(year.to, monthStartDay, 12);
    expect(sum(inYear.map((c) => totalOf(costsIn(expenses, c, monthStartDay))))).toBeCloseTo(totalOf(costsIn(expenses, year, monthStartDay)), 2);

    const covered = yearsOfHistory(expenses, TODAY, monthStartDay);
    expect(covered).toBeGreaterThanOrEqual(expenses.length ? 1 : 0);
    if (expenses.length) {
      const oldest = expenses.reduce((min, e) => (e.date < min ? e.date : min), expenses[0].date);
      expect(recentYears(TODAY, monthStartDay, covered)[0].from).toBe(yearContaining(oldest, monthStartDay).from);
    }
  });

  it.each(seeds)("charge every payment exactly once, however it is spread, for history %i", (seed) => {
    const { expenses, monthStartDay } = history(seed);

    // Over all of time, what a period costs and what was paid are the same money.
    expect(totalOf(costsIn(expenses, { from: "", to: "" }, monthStartDay))).toBeCloseTo(totalOf(expenses), 2);

    // And with nothing spread, the cost view *is* the ledger — entry for entry, so an app
    // that never reaches for this behaves exactly as it did before.
    const plain = expenses.map((e) => ({ ...e, spreadMonths: 1 }));
    PRESETS.forEach((preset) => {
      const range = presetRange(preset, TODAY, monthStartDay);
      expect(costsIn(plain, range, monthStartDay)).toEqual(inRange(plain, range));
    });

    // A cycle costs what its own days saw, plus what earlier payments carried into it —
    // the split the summary card states in words and the pace chart opens from.
    const thisCycle = cycleContaining(TODAY, monthStartDay);
    expect(round2(totalOf(dayCostsIn(expenses, thisCycle)) + carriedInto(expenses, thisCycle, monthStartDay)))
      .toBeCloseTo(totalOf(costsIn(expenses, thisCycle, monthStartDay)), 2);

    if (!expenses.length) return;
    // And the cycles the payments reach tile that money: no cycle charged twice, none missed.
    const dates = expenses.map((e) => e.date).sort();
    const reach = expenses.map((e) => sharesOf(e, monthStartDay).at(-1)!.cycle.to).sort();
    const last = reach[reach.length - 1];
    let charged = 0;
    for (let cycle = cycleContaining(dates[0], monthStartDay); cycle.from <= last; cycle = shiftCycle(cycle, monthStartDay, 1)) {
      charged = round2(charged + totalOf(costsIn(expenses, cycle, monthStartDay)));
    }
    expect(charged).toBeCloseTo(totalOf(expenses), 2);
  });

  it.each(seeds.slice(0, 60))("compare a period against the one before it for history %i", (seed) => {
    const { expenses, monthStartDay } = history(seed);
    const range = presetRange("month", TODAY, monthStartDay);
    const before = previousRange(range, "month", TODAY, monthStartDay);

    expect(before).toEqual(shiftCycle(cycleContaining(TODAY, monthStartDay), monthStartDay, -1));
    const current = totalOf(costsIn(expenses, range, monthStartDay));
    const previous = totalOf(costsIn(expenses, before!, monthStartDay));
    const change = changeVs(current, previous);
    expect(change.amount).toBeCloseTo(current - previous, 2);
    expect(change.percent === null).toBe(previous === 0);
    // The percentage is rounded to two places, so it reproduces the total to within that.
    if (previous) expect(Math.abs(previous * (1 + change.percent! / 100) - current)).toBeLessThanOrEqual(previous * 0.0001 + CENT);
  });
});

describe("category movement", () => {
  const slice = (categoryId: string, amount: number) =>
    ({ categoryId, name: categoryId, icon: "tag", color: "slate", amount, count: 1, share: 0 });

  it("pairs a category with what it cost before", () => {
    const moved = withPrevious([slice("food", 500), slice("travel", 100)], [slice("food", 300), slice("travel", 400)]);
    expect(moved.map((m) => [m.categoryId, m.previous, m.change])).toEqual([["food", 300, 200], ["travel", 400, -300]]);
  });

  it("treats a category that is new this period as all growth", () => {
    expect(withPrevious([slice("petrol", 2000)], [])).toMatchObject([{ previous: 0, change: 2000 }]);
  });

  it("keeps the slice it was given untouched", () => {
    const original = slice("food", 500);
    const [moved] = withPrevious([original], [slice("food", 500)]);
    expect(moved).toMatchObject({ ...original, previous: 500, change: 0 });
  });
});

describe("comparison series", () => {
  const point = (key: string, amount: number) => ({ key, label: key, from: "2026-01-01", to: "2026-01-31", amount, count: amount ? 1 : 0 });

  it("drops the blank run at the front", () => {
    const series = [point("a", 0), point("b", 0), point("c", 500), point("d", 700)];
    expect(trimLeadingEmpty(series, 2).map((p) => p.key)).toEqual(["c", "d"]);
  });

  it("keeps a minimum number of bars so the chart still reads as one", () => {
    const series = [point("a", 0), point("b", 0), point("c", 0), point("d", 900)];
    expect(trimLeadingEmpty(series, 3).map((p) => p.key)).toEqual(["b", "c", "d"]);
  });

  it("leaves a series that starts with something alone", () => {
    const series = [point("a", 100), point("b", 0)];
    expect(trimLeadingEmpty(series, 2)).toEqual(series);
  });

  it("falls back to the tail when nothing was ever spent", () => {
    const series = [point("a", 0), point("b", 0), point("c", 0)];
    expect(trimLeadingEmpty(series, 2).map((p) => p.key)).toEqual(["b", "c"]);
  });

  it("averages only the buckets that had something in them", () => {
    expect(meanOfUsed([point("a", 0), point("b", 300), point("c", 500)])).toBe(400);
    expect(meanOfUsed([point("a", 0)])).toBe(0);
    expect(meanOfUsed([])).toBe(0);
  });
});

describe("pace, patterns and allowances", () => {
  const day = (date: string, amount: number, count = amount ? 1 : 0) => ({ date, amount, count });
  const slice = (categoryId: string, amount: number, share: number) =>
    ({ categoryId, name: categoryId, icon: "tag", color: "slate", amount, count: 1, share });
  const category = (id: string, monthlyBudget: number): Category =>
    ({ id, name: id, icon: "tag", color: "slate", monthlyBudget, sortOrder: 0, createdAt: 0, updatedAt: 0 });

  it("runs the total forward day by day", () => {
    const series = cumulativeSeries([day("2026-09-01", 100), day("2026-09-02", 0), day("2026-09-03", 50)]);
    expect(series.map((p) => p.total)).toEqual([100, 100, 150]);
    expect(cumulativeSeries([])).toEqual([]);
  });

  it("ends the running total on the period's total", () => {
    const days = [day("2026-09-01", 10.1), day("2026-09-02", 20.2), day("2026-09-03", 0.7)];
    const series = cumulativeSeries(days);
    expect(series[series.length - 1].total).toBeCloseTo(sum(days.map((d) => d.amount)), 2);
  });

  it("buckets by weekday and averages over how often that day came round", () => {
    // 2026-09-07 is a Monday.
    const week = byWeekday([day("2026-09-07", 100), day("2026-09-14", 300), day("2026-09-08", 50)]);
    expect(week[0]).toMatchObject({ label: "Mon", amount: 400, days: 2, average: 200 });
    expect(week[1]).toMatchObject({ label: "Tue", amount: 50, days: 1, average: 50 });
    expect(week[6]).toMatchObject({ label: "Sun", amount: 0, days: 0, average: 0 });
  });

  it("splits by how it was paid, dropping the methods never used", () => {
    const paid = (id: string, amount: number, method: SpendMethod): Expense =>
      ({ id, date: "2026-09-01", amount, categoryId: "c", note: "", method, spreadMonths: 1, createdAt: 0, updatedAt: 0 });
    const split = byMethod([paid("a", 300, "upi"), paid("b", 100, "cash"), paid("c", 100, "upi")]);
    expect(split.map((s) => [s.method, s.amount, s.share])).toEqual([["upi", 400, 80], ["cash", 100, 20]]);
    expect(byMethod([])).toEqual([]);
  });

  it("measures a category against its own budget when it has one", () => {
    const [food] = safeToSpend([slice("food", 1200, 60)], [category("food", 2000)], 5000, 10);
    expect(food).toMatchObject({ left: 800, perDay: 80, ownBudget: true, overspent: false });
  });

  it("gives a category with no budget its share of what is left", () => {
    const [food] = safeToSpend([slice("food", 1200, 60)], [category("food", 0)], 5000, 10);
    expect(food).toMatchObject({ left: 3000, perDay: 300, ownBudget: false });
  });

  it("says nothing is safe once the month's budget is gone", () => {
    const [food] = safeToSpend([slice("food", 1200, 60)], [], -500, 10);
    expect(food).toMatchObject({ left: 0, perDay: 0 });
  });

  it("reports a category past its own budget as overspent, and offers nothing a day", () => {
    const [food] = safeToSpend([slice("food", 2500, 60)], [category("food", 2000)], 5000, 10);
    expect(food).toMatchObject({ left: -500, perDay: 0, overspent: true });
  });

  it("offers nothing a day once the period is over", () => {
    expect(safeToSpend([slice("food", 100, 100)], [], 5000, 0)[0].perDay).toBe(0);
  });
});
