/* What today allows.
 *
 * Not the budget spread evenly over the whole month, but what is *left* of it spread over
 * the days that are left — so overspending on Monday tightens Tuesday, and an easy week
 * loosens the rest. Today's limit is fixed at the start of the day: spending today eats
 * into what is left of it rather than moving the line underfoot.
 */
import { cycleContaining, daysBetween } from "./months";
import { settingsOf } from "./settings";
import { round2 } from "../lib/format";
import type { DB } from "./types";

export interface DailyAllowance {
  /** The month's budget; 0 when none is set, which switches the whole idea off. */
  budget: number;
  /** What today allows. */
  limit: number;
  spent: number;
  /** Negative once today has gone over. */
  left: number;
  /** Percent of today's limit used; can go past 100. */
  usedShare: number;
  overspent: boolean;
  /** Days to the end of the cycle, today included. */
  daysLeft: number;
}

export function dailyAllowance(budget: number, spentBeforeToday: number, spentToday: number, daysLeft: number): DailyAllowance {
  // A month already spent leaves nothing for today, which is the honest answer.
  const remaining = Math.max(0, round2(budget - spentBeforeToday));
  const limit = budget > 0 && daysLeft > 0 ? round2(remaining / daysLeft) : 0;
  const left = round2(limit - spentToday);
  return {
    budget,
    limit,
    spent: round2(spentToday),
    left,
    usedShare: limit ? round2((spentToday / limit) * 100) : 0,
    overspent: left < 0,
    daysLeft,
  };
}

const sum = (amounts: number[]) => round2(amounts.reduce((total, n) => total + (Number(n) || 0), 0));

/** Today's allowance from the live data, for the cycle today falls in. */
export function dailyAllowanceOf(db: DB, today: string): DailyAllowance {
  const { monthlyBudget, monthStartDay } = settingsOf(db);
  const cycle = cycleContaining(today, monthStartDay);
  const inCycle = db.expenses.filter((e) => e.date >= cycle.from && e.date <= cycle.to);
  const spentToday = sum(inCycle.filter((e) => e.date === today).map((e) => e.amount));
  const spentBefore = round2(sum(inCycle.map((e) => e.amount)) - spentToday);
  return dailyAllowance(monthlyBudget, spentBefore, spentToday, Math.max(0, daysBetween(today, cycle.to)));
}
