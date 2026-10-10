/* A payment spread over months: the split has to add back up to what was paid, land in
 * consecutive cycles, and leave an ordinary expense completely alone.
 */
import { describe, expect, it } from "vitest";
import { round2 } from "../lib/format";
import { cycleContaining, shiftCycle } from "./months";
import {
  carriedInto, clampSpreadMonths, committedAhead, costsIn, cycleCostSplit, dayCostOf,
  isSpread, MAX_SPREAD_MONTHS, NO_SPREAD, perCycleCostOf, sharesOf, spreadEndsAt,
  spreadMonthsOf,
} from "./spread";
import type { Expense } from "./types";

const START = 1;

function expense(fields: Partial<Expense> = {}): Expense {
  return {
    id: "e1", date: "2026-10-05", amount: 3000, categoryId: "bills", note: "Recharge",
    method: "upi", spreadMonths: NO_SPREAD, createdAt: 1, updatedAt: 1, ...fields,
  };
}

const sum = (values: number[]) => round2(values.reduce((total, v) => total + v, 0));
const total = (expenses: Expense[]) => sum(expenses.map((e) => e.amount));

describe("how many months", () => {
  it("reads a missing or unusable count as a plain one-month expense", () => {
    expect(spreadMonthsOf(expense({ spreadMonths: undefined as unknown as number }))).toBe(NO_SPREAD);
    expect(spreadMonthsOf(expense({ spreadMonths: 0 }))).toBe(NO_SPREAD);
    expect(spreadMonthsOf(expense({ spreadMonths: -4 }))).toBe(NO_SPREAD);
    expect(spreadMonthsOf(expense({ spreadMonths: NaN }))).toBe(NO_SPREAD);
    expect(isSpread(expense())).toBe(false);
  });

  it("keeps a count inside what the maths can carry", () => {
    expect(clampSpreadMonths(1e9)).toBe(MAX_SPREAD_MONTHS);
    expect(clampSpreadMonths(6.7)).toBe(6);
    expect(clampSpreadMonths(12)).toBe(12);
  });
});

describe("splitting a payment", () => {
  it("gives every cycle an equal share", () => {
    const shares = sharesOf(expense({ spreadMonths: 6 }), START);
    expect(shares).toHaveLength(6);
    expect(shares.map((s) => s.amount)).toEqual([500, 500, 500, 500, 500, 500]);
    expect(perCycleCostOf(expense({ spreadMonths: 6 }))).toBe(500);
  });

  it("adds back up to what was paid, however badly it divides", () => {
    const cases = [
      { amount: 3000, spreadMonths: 7 },
      { amount: 99.99, spreadMonths: 12 },
      { amount: 0.01, spreadMonths: 6 },
      { amount: 1249.5, spreadMonths: 11 },
      { amount: 100, spreadMonths: 3 },
      { amount: 7, spreadMonths: MAX_SPREAD_MONTHS },
    ];
    cases.forEach(({ amount, spreadMonths }) => {
      const shares = sharesOf(expense({ amount, spreadMonths }), START);
      expect(sum(shares.map((s) => s.amount))).toBe(amount);
      expect(shares).toHaveLength(spreadMonths);
    });
  });

  it("files the first share on the day it was paid and the rest on their own cycles", () => {
    const shares = sharesOf(expense({ spreadMonths: 3 }), START);
    expect(shares.map((s) => s.date)).toEqual(["2026-10-05", "2026-11-01", "2026-12-01"]);
  });

  it("covers consecutive cycles with no gap and no repeat", () => {
    const shares = sharesOf(expense({ spreadMonths: 12 }), 15);
    shares.forEach((share, i) => {
      if (i === 0) return expect(share.cycle.from).toBe(cycleContaining("2026-10-05", 15).from);
      expect(share.cycle.from).toBe(shiftCycle(shares[i - 1].cycle, 15, 1).from);
    });
    expect(spreadEndsAt(expense({ spreadMonths: 12 }), 15).from).toBe(shares[11].cycle.from);
  });

  it("starts from the cycle the payment falls in, not the calendar month", () => {
    // Paid 5 October with a cycle that starts on the 15th: that is still September's.
    const shares = sharesOf(expense({ spreadMonths: 2 }), 15);
    expect(shares[0].cycle.from).toBe("2026-09-15");
    expect(shares[1].date).toBe("2026-10-15");
  });

  it("leaves a one-month expense as a single share of the whole amount", () => {
    expect(sharesOf(expense(), START)).toMatchObject([{ amount: 3000, date: "2026-10-05", index: 1, of: 1 }]);
  });
});

describe("what a window costs", () => {
  const october = cycleContaining("2026-10-05", START);
  const recharge = expense({ spreadMonths: 6 });

  it("charges the cycle it was paid in only its own share", () => {
    expect(total(costsIn([recharge], october, START))).toBe(500);
  });

  it("keeps charging the cycles after it", () => {
    const december = shiftCycle(october, START, 2);
    const costs = costsIn([recharge], december, START);
    expect(total(costs)).toBe(500);
    expect(costs[0].date).toBe(december.from);
  });

  it("charges nothing once the payment has run out", () => {
    expect(costsIn([recharge], shiftCycle(october, START, 6), START)).toEqual([]);
  });

  it("adds up to the whole payment across every cycle it covers", () => {
    const window = { from: october.from, to: shiftCycle(october, START, 5).to };
    expect(total(costsIn([recharge], window, START))).toBe(3000);
  });

  it("hands an ordinary expense straight back, same object and all", () => {
    const plain = expense();
    const costs = costsIn([plain], october, START);
    expect(costs).toHaveLength(1);
    expect(costs[0]).toBe(plain);
  });

  it("counts an open window as every cycle, future ones included", () => {
    expect(total(costsIn([recharge], { from: "", to: "" }, START))).toBe(3000);
  });

  it("can be narrowed again without splitting a share twice", () => {
    const year = { from: october.from, to: shiftCycle(october, START, 11).to };
    const once = costsIn([recharge], october, START);
    const twice = costsIn(costsIn([recharge], year, START), october, START);
    expect(total(twice)).toBe(total(once));
    expect(twice).toHaveLength(once.length);
  });

  it("splits by the cycles the start day actually makes", () => {
    const sepCycle = cycleContaining("2026-10-05", 15);
    expect(total(costsIn([expense({ spreadMonths: 6 })], sepCycle, 15))).toBe(500);
    expect(total(costsIn([expense({ spreadMonths: 6 })], cycleContaining("2026-10-20", 15), 15))).toBe(500);
  });
});

describe("a day's share of the month", () => {
  it("counts only what the payment costs this cycle, not what left the pocket", () => {
    const day = [expense({ spreadMonths: 6 }), expense({ id: "e2", amount: 220, spreadMonths: NO_SPREAD })];
    expect(dayCostOf(day, "2026-10-05")).toBe(720);
  });

  it("is the day's total when nothing on it was spread", () => {
    const day = [expense({ spreadMonths: NO_SPREAD }), expense({ id: "e2", amount: 220 })];
    expect(dayCostOf(day, "2026-10-05")).toBe(3220);
  });

  it("ignores the other days", () => {
    expect(dayCostOf([expense()], "2026-10-06")).toBe(0);
  });
});

describe("either side of today", () => {
  const october = cycleContaining("2026-10-05", START);

  it("counts a payment made today as today's, at its monthly cost", () => {
    const split = cycleCostSplit([expense({ spreadMonths: 6 })], october, "2026-10-05", START);
    expect(split).toEqual({ before: 0, today: 500 });
  });

  it("counts cost carried in from an earlier payment as already owed", () => {
    const paidInAugust = expense({ date: "2026-08-20", spreadMonths: 6 });
    const split = cycleCostSplit([paidInAugust], october, "2026-10-05", START);
    expect(split).toEqual({ before: 500, today: 0 });
  });

  it("still counts carried-in cost as owed on the first day of the cycle", () => {
    // The share is filed on the 1st, but it was not spent on the 1st.
    const paidInAugust = expense({ date: "2026-08-20", spreadMonths: 6 });
    expect(cycleCostSplit([paidInAugust], october, october.from, START)).toEqual({ before: 500, today: 0 });
  });

  it("leaves an ordinary day exactly as it was", () => {
    const split = cycleCostSplit([expense({ spreadMonths: NO_SPREAD })], october, "2026-10-05", START);
    expect(split).toEqual({ before: 0, today: 3000 });
  });
});

describe("what crosses the edges of a period", () => {
  const october = cycleContaining("2026-10-05", START);

  it("reports the cost carried in from payments made before it", () => {
    const paidInAugust = expense({ date: "2026-08-20", spreadMonths: 6 });
    expect(carriedInto([paidInAugust, expense()], october, START)).toBe(500);
  });

  it("carries nothing into a window with no start", () => {
    expect(carriedInto([expense({ date: "2026-08-20", spreadMonths: 6 })], { from: "", to: "" }, START)).toBe(0);
  });

  it("reports what this period has already bought for later", () => {
    expect(committedAhead([expense({ spreadMonths: 6 })], october, START)).toBe(2500);
  });

  it("commits nothing ahead when the payment covers one month", () => {
    expect(committedAhead([expense()], october, START)).toBe(0);
  });
});
