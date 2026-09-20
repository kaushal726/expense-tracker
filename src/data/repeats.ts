/* The one-tap tiles on the Add screen: the category + amount combinations used most over
 * the last couple of months, so "Chai ₹20" is always a tap away. Ties break on the most
 * recent use, and a category that has since been deleted drops out.
 */
import { addDays } from "../lib/dates";
import type { Category, Expense } from "./types";

export const REPEAT_WINDOW_DAYS = 60;
export const REPEAT_TILE_LIMIT = 6;
/** Two of the same is a habit; one is a one-off. */
const MIN_USES = 2;

export interface RepeatTile {
  key: string;
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  amount: number;
  uses: number;
}

interface Tally {
  categoryId: string;
  amount: number;
  uses: number;
  lastUsed: string;
}

export function repeatTiles(expenses: Expense[], categories: Category[], today: string, limit = REPEAT_TILE_LIMIT): RepeatTile[] {
  const since = addDays(today, -REPEAT_WINDOW_DAYS);
  const byId = new Map(categories.map((c) => [c.id, c]));
  const tallies = new Map<string, Tally>();

  expenses.forEach((e) => {
    if (e.date < since || e.date > today || !byId.has(e.categoryId) || e.amount <= 0) return;
    const key = `${e.categoryId}:${e.amount}`;
    const tally = tallies.get(key) ?? { categoryId: e.categoryId, amount: e.amount, uses: 0, lastUsed: "" };
    tally.uses += 1;
    if (e.date > tally.lastUsed) tally.lastUsed = e.date;
    tallies.set(key, tally);
  });

  return [...tallies.entries()]
    .filter(([, t]) => t.uses >= MIN_USES)
    .sort(([, a], [, b]) => b.uses - a.uses || b.lastUsed.localeCompare(a.lastUsed) || a.amount - b.amount)
    .slice(0, limit)
    .map(([key, t]) => {
      const category = byId.get(t.categoryId);
      return {
        key,
        categoryId: t.categoryId,
        categoryName: category?.name ?? "",
        icon: category?.icon ?? "tag",
        color: category?.color ?? "slate",
        amount: t.amount,
        uses: t.uses,
      };
    });
}

/** Categories ordered by how often they were used recently, so the usual ones come first. */
export function categoriesByUse(expenses: Expense[], categories: Category[], today: string): Category[] {
  const since = addDays(today, -REPEAT_WINDOW_DAYS);
  const uses = new Map<string, number>();
  expenses.forEach((e) => {
    if (e.date < since || e.date > today) return;
    uses.set(e.categoryId, (uses.get(e.categoryId) ?? 0) + 1);
  });
  return [...categories].sort((a, b) => (uses.get(b.id) ?? 0) - (uses.get(a.id) ?? 0) || a.createdAt - b.createdAt);
}
