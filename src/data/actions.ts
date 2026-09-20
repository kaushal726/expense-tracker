/* Every change the UI can make to the data. Each one is a single commit(). */
import { round2 } from "../lib/format";
import { uid } from "../lib/ids";
import { removeById, upsertById } from "./listOps";
import { emptyDB } from "./seed";
import { settingsOf } from "./settings";
import { commit } from "./store";
import { APP_SETTINGS_ID, type AppSettings, type Category, type DB, type Expense } from "./types";

/* ---------- expenses ---------- */

export type ExpenseInput = Pick<Expense, "date" | "amount" | "categoryId" | "note" | "method">;

export function saveExpense(input: ExpenseInput, editingId: string | null): string {
  const id = editingId ?? uid();
  commit((db) => {
    const existing = db.expenses.find((e) => e.id === id);
    const now = Date.now();
    const expense: Expense = { id, ...input, amount: round2(input.amount), createdAt: existing?.createdAt ?? now, updatedAt: now };
    return { ...db, expenses: upsertById(db.expenses, expense) };
  });
  return id;
}

export function deleteExpense(id: string): void {
  commit((db) => ({ ...db, expenses: removeById(db.expenses, id) }));
}

/** Copies an entry onto another day — the long-press "spent this again" shortcut. */
export function duplicateExpense(id: string, date: string): string | null {
  const newId = uid();
  let copied = false;
  commit((db) => {
    const source = db.expenses.find((e) => e.id === id);
    if (!source) return db;
    copied = true;
    const now = Date.now();
    return { ...db, expenses: [...db.expenses, { ...source, id: newId, date, createdAt: now, updatedAt: now }] };
  });
  return copied ? newId : null;
}

/* ---------- categories ---------- */

export type CategoryInput = Pick<Category, "name" | "icon" | "color" | "monthlyBudget">;

export function saveCategory(input: CategoryInput, editingId: string | null): string {
  const id = editingId ?? uid();
  commit((db) => {
    const existing = db.categories.find((c) => c.id === id);
    const now = Date.now();
    const category: Category = {
      id,
      ...input,
      name: input.name.trim(),
      monthlyBudget: Math.max(0, round2(input.monthlyBudget)),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    return { ...db, categories: upsertById(db.categories, category) };
  });
  return id;
}

export function categoryUsage(db: DB, categoryId: string): number {
  return db.expenses.filter((e) => e.categoryId === categoryId).length;
}

/** Past entries keep their amounts and show as Uncategorised, so no total ever changes. */
export function deleteCategory(id: string): void {
  commit((db) => ({ ...db, categories: removeById(db.categories, id) }));
}

/* ---------- settings ---------- */

export type SettingsPatch = Partial<Pick<AppSettings, "monthlyBudget" | "monthStartDay" | "currency">>;

export function saveSettings(patch: SettingsPatch): void {
  commit((db) => {
    const next: AppSettings = { ...settingsOf(db), ...patch, id: APP_SETTINGS_ID, updatedAt: Date.now() };
    return { ...db, settings: upsertById(db.settings, next) };
  });
}

/* ---------- whole-database operations ---------- */

/** Restore: replaces everything, but keeps the current settings if the backup has none. */
export function replaceAllData(data: DB): void {
  commit((db) => ({ ...data, settings: data.settings.length ? data.settings : db.settings }));
}

export function eraseAllData(): void {
  commit(() => emptyDB());
}
