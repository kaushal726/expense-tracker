/* The category chips on the Add screen, ordered so the ones you actually use come first. */
import { addDays } from "../lib/dates";
import type { Category, Expense } from "./types";

/** How far back "recently used" reaches. */
export const REPEAT_WINDOW_DAYS = 60;

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
