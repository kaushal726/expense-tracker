import { describe, expect, it } from "vitest";
import { createBackup, InvalidBackupError, parseBackup } from "./backup";
import { emptyDB } from "./seed";
import { APP_SETTINGS_ID, type DB } from "./types";

function sample(): DB {
  return {
    expenses: [{ id: "e1", date: "2026-09-20", amount: 120.5, categoryId: "c1", note: "Chai", method: "upi", createdAt: 1, updatedAt: 2 }],
    categories: [{ id: "c1", name: "Food", icon: "coffee", color: "amber", monthlyBudget: 3000, createdAt: 1, updatedAt: 2 }],
    settings: [{ id: APP_SETTINGS_ID, monthlyBudget: 20000, monthStartDay: 5, currency: "₹", seededAt: 1, updatedAt: 2 }],
  };
}

const roundTrip = (db: DB) => parseBackup(JSON.stringify(createBackup(db)));

describe("backup", () => {
  it("survives a round trip unchanged", () => {
    expect(roundTrip(sample())).toEqual(sample());
    expect(roundTrip(emptyDB())).toEqual(emptyDB());
  });

  it("refuses anything that isn't one of ours", () => {
    expect(() => parseBackup("not json")).toThrow(InvalidBackupError);
    expect(() => parseBackup("{}")).toThrow(InvalidBackupError);
    expect(() => parseBackup(JSON.stringify({ app: "ledger-crm", data: {} }))).toThrow(InvalidBackupError);
  });

  it("drops entries with no id or no usable date", () => {
    const file = { app: "spendly", version: 1, exportedAt: "", data: { expenses: [{ id: "", date: "2026-09-20" }, { id: "e2", date: "not a date" }, { id: "e3", date: "2026-09-21" }] } };
    expect(parseBackup(JSON.stringify(file)).expenses.map((e) => e.id)).toEqual(["e3"]);
  });

  it("fills in what a hand-edited file left out", () => {
    const file = { app: "spendly", version: 1, exportedAt: "", data: {
      expenses: [{ id: "e1", date: "2026-09-20", amount: "90.456", method: "cheque" }],
      categories: [{ id: "c1" }],
      settings: [{ monthStartDay: 99, monthlyBudget: -5 }],
    } };
    const db = parseBackup(JSON.stringify(file));
    expect(db.expenses[0]).toMatchObject({ amount: 90.46, method: "upi", categoryId: "", note: "" });
    expect(db.categories[0]).toMatchObject({ name: "Category", icon: "tag", color: "slate", monthlyBudget: 0 });
    expect(db.settings[0]).toMatchObject({ id: APP_SETTINGS_ID, monthStartDay: 28, monthlyBudget: 0, currency: "₹" });
  });
});
