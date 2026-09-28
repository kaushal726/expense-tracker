import { uid } from "../lib/ids";
import { APP_SETTINGS_ID, type AppSettings, type Category, type DB } from "./types";

export const DEFAULT_CURRENCY = "₹";
export const DEFAULT_MONTH_START_DAY = 1;

/** Used until the settings record exists (first run, before the starter categories land). */
export const DEFAULT_SETTINGS: AppSettings = {
  id: APP_SETTINGS_ID,
  monthlyBudget: 0,
  monthStartDay: DEFAULT_MONTH_START_DAY,
  currency: DEFAULT_CURRENCY,
  seededAt: 0,
  updatedAt: 0,
};

const STARTER_CATEGORIES: Pick<Category, "name" | "icon" | "color">[] = [
  { name: "Food", icon: "coffee", color: "amber" },
  { name: "Travel", icon: "navigation", color: "blue" },
  { name: "Groceries", icon: "cart", color: "green" },
  { name: "Bills", icon: "zap", color: "violet" },
  { name: "Health", icon: "heart", color: "rose" },
  { name: "Shopping", icon: "bag", color: "teal" },
  { name: "Other", icon: "more", color: "slate" },
];

/** Written once, on first run only — a category deleted later never comes back. */
export function starterCategories(now: number): Category[] {
  return STARTER_CATEGORIES.map((c, i) => ({ ...c, id: uid(), monthlyBudget: 0, sortOrder: i, createdAt: now + i, updatedAt: now + i }));
}

export function emptyDB(): DB {
  return { expenses: [], categories: [], settings: [] };
}
