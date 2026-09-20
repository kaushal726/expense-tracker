// Runs apps-script/Code.gs against the in-memory spreadsheet used by the dev mock.
process.env.TZ = "Asia/Kolkata";   // the script and the Sheet share one time zone
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";
import { FakeSpreadsheet } from "./fakeSpreadsheet.ts";
import { loadAppsScript, type AppsScript } from "./mockSheetApi.ts";

const CODE_PATH = fileURLToPath(new URL("../apps-script/Code.gs", import.meta.url));

let spreadsheet: FakeSpreadsheet;
let script: AppsScript;

const push = (changes: unknown[]) => JSON.parse(script.doPost({ postData: { contents: JSON.stringify({ action: "push", changes }) } }).text);
const pull = (since = 0) => JSON.parse(script.doGet({ parameter: { action: "pull", since: String(since) } }).text);
const category = (id: string, updatedAt: number, extra: Record<string, unknown> = {}) =>
  ({ collection: "categories", row: { id, name: id, monthlyBudget: 0, updatedAt, ...extra } });
const expense = (id: string, updatedAt: number, extra: Record<string, unknown> = {}) =>
  ({ collection: "expenses", row: { id, date: "2026-09-20", amount: 120, categoryId: "c1", updatedAt, ...extra } });

beforeEach(() => {
  spreadsheet = new FakeSpreadsheet();
  script = loadAppsScript(CODE_PATH, spreadsheet);
});

describe("Code.gs", () => {
  it("stores pushed rows and returns them on pull", () => {
    expect(push([category("a", 1), category("b", 2)])).toMatchObject({ ok: true, applied: 2 });
    const res = pull();
    expect(res.data.categories.map((r: { id: string }) => r.id)).toEqual(["a", "b"]);
    expect(spreadsheet.getSheetByName("Categories")!.cells[0].slice(0, 2)).toEqual(["id", "name"]);
  });

  it("keeps the newer copy and only returns rows changed since the cursor", () => {
    push([expense("a", 5, { amount: 50 })]);
    const { cursor } = pull();
    expect(push([expense("a", 4, { amount: 40 })]).applied).toBe(0);
    expect(pull(cursor).data.expenses).toEqual([]);
    push([expense("a", 6, { amount: 60 })]);
    expect(pull(cursor).data.expenses).toMatchObject([{ id: "a", amount: 60 }]);
  });

  it("marks deletions instead of removing rows", () => {
    push([category("a", 1)]);
    push([{ collection: "categories", row: { id: "a", updatedAt: 2, deleted: true } }]);
    expect(pull().data.categories).toMatchObject([{ id: "a", deleted: true, name: "a" }]);
  });

  it("doesn't create a tab just to delete rows it never had", () => {
    expect(push([{ collection: "expenses", row: { id: "x", updatedAt: 3, deleted: true } }])).toMatchObject({ ok: true, applied: 0 });
    expect(spreadsheet.getSheetByName("Expenses")).toBeNull();
  });

  it("keeps rows for a collection it doesn't know, and says which", () => {
    const res = push([category("a", 1), { collection: "widgets", row: { id: "w1", updatedAt: 1 } }]);
    expect(res).toMatchObject({ ok: true, applied: 1, skipped: ["widgets"] });
    expect(spreadsheet.getSheetByName("widgets")).toBeNull();
  });

  it("stores a yyyy-mm-dd field as a real date cell and reads the same day back", () => {
    push([expense("e1", 1)]);
    const sheet = spreadsheet.getSheetByName("Expenses")!;
    const dateCell = sheet.cells[1][sheet.cells[0].indexOf("date")];
    expect(Object.prototype.toString.call(dateCell)).toBe("[object Date]");   // built inside the script's vm realm
    expect(pull().data.expenses[0].date).toBe("2026-09-20");
  });

  it("converts date text written by older versions into real date cells", () => {
    push([expense("e1", 1)]);
    const sheet = spreadsheet.getSheetByName("Expenses")!;
    const column = sheet.cells[0].indexOf("date");
    sheet.getRange(2, column + 1).setValue("2026-09-20");   // as an older script would have left it
    expect(script.formatDateColumns()).toBe(1);
    expect(Object.prototype.toString.call(sheet.cells[1][column])).toBe("[object Date]");
    expect(pull().data.expenses[0].date).toBe("2026-09-20");
  });

  it("stamps a row edited by hand in the Sheet so devices pick it up", () => {
    push([expense("e1", 1)]);
    const sheet = spreadsheet.getSheetByName("Expenses")!;
    const { cursor } = pull();
    const range = sheet.getRange(2, sheet.cells[0].indexOf("amount") + 1);
    range.setValue(999);
    script.onEdit({ range });
    expect(pull(cursor).data.expenses).toMatchObject([{ id: "e1", amount: 999 }]);
  });

  it("rejects unknown actions", () => {
    expect(JSON.parse(script.doGet({ parameter: { action: "nope" } }).text)).toEqual({ ok: false, error: "Unknown action" });
  });
});
