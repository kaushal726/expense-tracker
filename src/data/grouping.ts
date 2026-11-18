/* Expenses laid out day by day for the History screen. */
import { round2 } from "../lib/format";
import { paidOf, type CostEntry } from "./spread";

export interface DayGroup {
  date: string;
  entries: CostEntry[];
  /** What the day costs: a payment's share for a spread one, the whole of anything else. */
  total: number;
  /** What actually left the pocket that day, which differs from the total on a day a
   *  spread payment was made, or one that only holds a later month's share of one. */
  paid: number;
  /** Everything counted from the oldest day shown up to and including this one. */
  runningTotal: number;
}

/** Newest day first, newest entry first within a day. */
export function groupByDay(entries: CostEntry[]): DayGroup[] {
  const byDate = new Map<string, CostEntry[]>();
  entries.forEach((entry) => {
    const list = byDate.get(entry.date) ?? [];
    list.push(entry);
    byDate.set(entry.date, list);
  });

  let running = 0;
  const oldestFirst = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, list]) => {
      const total = round2(list.reduce((sum, e) => sum + e.cost, 0));
      const paid = round2(list.reduce((sum, e) => sum + paidOf(e), 0));
      running = round2(running + total);
      return { date, entries: [...list].sort((a, b) => b.expense.createdAt - a.expense.createdAt), total, paid, runningTotal: running };
    });

  return oldestFirst.reverse();
}
