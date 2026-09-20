/* Expenses laid out day by day for the History screen. */
import { round2 } from "../lib/format";
import type { Expense } from "./types";

export interface DayGroup {
  date: string;
  expenses: Expense[];
  total: number;
  /** Everything spent from the oldest day shown up to and including this one. */
  runningTotal: number;
}

/** Newest day first, newest entry first within a day. */
export function groupByDay(expenses: Expense[]): DayGroup[] {
  const byDate = new Map<string, Expense[]>();
  expenses.forEach((e) => {
    const list = byDate.get(e.date) ?? [];
    list.push(e);
    byDate.set(e.date, list);
  });

  let running = 0;
  const oldestFirst = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, list]) => {
      const total = round2(list.reduce((sum, e) => sum + (Number(e.amount) || 0), 0));
      running = round2(running + total);
      return { date, expenses: [...list].sort((a, b) => b.createdAt - a.createdAt), total, runningTotal: running };
    });

  return oldestFirst.reverse();
}
