import { describe, expect, it } from "vitest";
import { APP_SETTINGS_ID, type AppSettings, type Category, type Expense } from "../data/types";
import { fromRow, isDeletedRow, toRow, type SchemaContext } from "./sheetSchema";

const ctx: SchemaContext = { categoryName: (id) => (id === "c1" ? "Food" : "") };

const expense: Expense = { id: "e1", date: "2026-09-20", amount: 120.5, categoryId: "c1", note: "Chai", method: "upi", spreadMonths: 1, createdAt: 1, updatedAt: 2 };
const category: Category = { id: "c1", name: "Food", icon: "coffee", color: "amber", monthlyBudget: 3000, sortOrder: 2, createdAt: 1, updatedAt: 2 };
const settings: AppSettings = { id: APP_SETTINGS_ID, monthlyBudget: 20000, monthStartDay: 5, currency: "₹", seededAt: 1, updatedAt: 2 };

describe("sheet rows", () => {
  it("puts the readable columns first and adds the display ones", () => {
    const row = toRow("expenses", expense, ctx);
    expect(Object.keys(row).slice(0, 3)).toEqual(["id", "date", "category"]);
    expect(row.category).toBe("Food");
    expect(row.updatedOn).not.toBe("");
  });

  it("reads every record back exactly as it went out", () => {
    expect(fromRow("expenses", toRow("expenses", expense, ctx))).toEqual(expense);
    expect(fromRow("categories", toRow("categories", category, ctx))).toEqual(category);
    expect(fromRow("settings", toRow("settings", settings, ctx))).toEqual(settings);
  });

  it("ignores the display columns when a row comes back edited", () => {
    const row = { ...toRow("expenses", expense, ctx), category: "Someone typed this" };
    expect(fromRow("expenses", row)).toEqual(expense);
  });

  it("fills in the defaults for a row typed straight into the Sheet", () => {
    expect(fromRow("expenses", { id: "e9", date: "2026-09-21", amount: 40 })).toEqual({ id: "e9", date: "2026-09-21", amount: 40, categoryId: "", note: "", method: "upi", spreadMonths: 1, createdAt: 0, updatedAt: 0 });
    expect(fromRow("categories", { id: "c9", name: "Petrol" })).toMatchObject({ icon: "tag", color: "slate", monthlyBudget: 0, sortOrder: 0 });
  });

  it("recognises a tombstone however the Sheet spells it", () => {
    expect(isDeletedRow({ id: "e1", deleted: true })).toBe(true);
    expect(isDeletedRow({ id: "e1", deleted: "TRUE" })).toBe(true);
    expect(isDeletedRow({ id: "e1", deleted: "" })).toBe(false);
    expect(isDeletedRow({ id: "e1" })).toBe(false);
  });
});
