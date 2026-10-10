/* Maps app records <-> Google Sheet rows.
 *
 * Rows stay readable: one column per field, plus a display column (the category's name)
 * written for people reading the Sheet. A record is read back field by field from the
 * blank below, so a row typed straight into the Sheet — or one missing a column
 * altogether — still comes out as a complete record, and display columns, tombstone
 * markers and anything else in the row are ignored. Dates go over as yyyy-mm-dd and the
 * Apps Script writes them as real date cells.
 */
import { DEFAULT_CATEGORY_COLOR } from "../data/categoryColors";
import { DEFAULT_CATEGORY_ICON } from "../data/categoryIcons";
import { DEFAULT_METHOD } from "../data/methods";
import { DEFAULT_CURRENCY, DEFAULT_MONTH_START_DAY } from "../data/seed";
import { NO_SPREAD } from "../data/spread";
import type { AnyRecord, Collection, Expense } from "../data/types";

export type SheetValue = string | number | boolean;
export type SheetRow = Record<string, SheetValue>;

export interface SchemaContext {
  categoryName(id: string): string;
}

interface CollectionSpec {
  /** Fields placed right after `id`, so the Sheet reads naturally left to right. */
  leading: string[];
  /** Every field of the record, with the value to use when the cell is empty or missing.
   *  A number here also means "read this cell as a number". */
  blank: Record<string, SheetValue>;
  /** Written for people reading the Sheet; never read back. */
  display?: (record: AnyRecord, ctx: SchemaContext) => SheetRow;
}

const UPDATED_ON = "updatedOn";

function readableTime(ms: number): string {
  if (!ms) return "";
  return new Date(ms).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const SPECS: Record<Collection, CollectionSpec> = {
  expenses: {
    leading: ["date"],
    blank: { date: "", amount: 0, categoryId: "", note: "", method: DEFAULT_METHOD, spreadMonths: NO_SPREAD, createdAt: 0, updatedAt: 0 },
    display: (r, ctx) => ({ category: ctx.categoryName((r as Expense).categoryId) }),
  },
  categories: {
    leading: ["name"],
    blank: { name: "", icon: DEFAULT_CATEGORY_ICON, color: DEFAULT_CATEGORY_COLOR, monthlyBudget: 0, sortOrder: 0, createdAt: 0, updatedAt: 0 },
  },
  settings: {
    leading: [],
    blank: { monthlyBudget: 0, monthStartDay: DEFAULT_MONTH_START_DAY, currency: DEFAULT_CURRENCY, seededAt: 0, updatedAt: 0 },
  },
};

function toCell(value: unknown): SheetValue {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "string") return value;
  return JSON.stringify(value);
}

export function toRow(collection: Collection, record: AnyRecord, ctx: SchemaContext): SheetRow {
  const s = SPECS[collection];
  const source = record as unknown as Record<string, unknown>;
  const row: SheetRow = { id: record.id };
  s.leading.forEach((k) => { row[k] = toCell(source[k]); });
  Object.assign(row, s.display?.(record, ctx));
  Object.keys(source).forEach((k) => { if (!(k in row)) row[k] = toCell(source[k]); });
  row[UPDATED_ON] = readableTime(Number(source.updatedAt) || 0);
  return row;
}

export function fromRow<C extends Collection>(collection: C, row: SheetRow): AnyRecord {
  const record: Record<string, unknown> = { id: String(row.id) };
  Object.entries(SPECS[collection].blank).forEach(([field, fallback]) => {
    const cell = row[field];
    if (cell === undefined || cell === null || cell === "") return void (record[field] = fallback);
    record[field] = typeof fallback === "number" ? Number(cell) || 0 : String(cell);
  });
  return record as unknown as AnyRecord;
}

export function isDeletedRow(row: SheetRow): boolean {
  return row.deleted === true || String(row.deleted).toUpperCase() === "TRUE";
}
