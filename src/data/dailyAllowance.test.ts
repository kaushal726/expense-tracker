import { describe, expect, it } from "vitest";
import { dailyAllowance, dailyAllowanceOf } from "./dailyAllowance";
import { emptyDB } from "./seed";
import { APP_SETTINGS_ID, type DB, type Expense } from "./types";

describe("today's allowance", () => {
  it("spreads what is left over the days that are left, today included", () => {
    expect(dailyAllowance(12000, 3000, 0, 10)).toMatchObject({ limit: 900, left: 900, usedShare: 0 });
  });

  it("holds the limit still while today is spent against it", () => {
    const morning = dailyAllowance(12000, 3000, 0, 10);
    const evening = dailyAllowance(12000, 3000, 400, 10);
    expect(evening.limit).toBe(morning.limit);
    expect(evening).toMatchObject({ spent: 400, left: 500, overspent: false });
    expect(evening.usedShare).toBeCloseTo(44.44, 1);
  });

  it("tightens tomorrow after a heavy day", () => {
    expect(dailyAllowance(12000, 3000, 0, 10).limit).toBe(900);
    expect(dailyAllowance(12000, 5000, 0, 9).limit).toBeCloseTo(777.78, 2);
  });

  it("reports today as over once it passes its limit", () => {
    expect(dailyAllowance(12000, 3000, 1200, 10)).toMatchObject({ left: -300, overspent: true });
  });

  it("allows nothing once the month's budget is gone", () => {
    expect(dailyAllowance(12000, 13000, 0, 10)).toMatchObject({ limit: 0, left: 0, usedShare: 0 });
  });

  it("is switched off with no budget, and on the day after the cycle ends", () => {
    expect(dailyAllowance(0, 0, 500, 10)).toMatchObject({ limit: 0, usedShare: 0 });
    expect(dailyAllowance(12000, 3000, 0, 0).limit).toBe(0);
  });
});

describe("today's allowance from the data", () => {
  const expense = (id: string, date: string, amount: number): Expense =>
    ({ id, date, amount, categoryId: "c1", note: "", method: "upi", createdAt: 0, updatedAt: 0 });

  function db(expenses: Expense[], monthlyBudget = 31000): DB {
    return {
      ...emptyDB(),
      expenses,
      settings: [{ id: APP_SETTINGS_ID, monthlyBudget, monthStartDay: 1, currency: "₹", seededAt: 0, updatedAt: 0 }],
    };
  }

  it("counts only the cycle today falls in, and keeps today out of what came before", () => {
    // 31 days in October, so 21 are left on the 11th.
    const allowance = dailyAllowanceOf(db([
      expense("a", "2026-09-30", 5000),   // the cycle before
      expense("b", "2026-10-02", 1000),
      expense("c", "2026-10-11", 400),    // today
    ]), "2026-10-11");
    expect(allowance.limit).toBeCloseTo((31000 - 1000) / 21, 2);
    expect(allowance.spent).toBe(400);
  });

  it("has nothing to say without a budget", () => {
    expect(dailyAllowanceOf(db([expense("a", "2026-10-11", 400)], 0), "2026-10-11")).toMatchObject({ budget: 0, limit: 0 });
  });

  it("gives the whole of what is left to the last day of the month", () => {
    const allowance = dailyAllowanceOf(db([expense("a", "2026-10-02", 1000)]), "2026-10-31");
    expect(allowance.daysLeft).toBe(1);
    expect(allowance.limit).toBe(30000);
  });
});
