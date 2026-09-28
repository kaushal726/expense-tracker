/* JSON backup export and restore. A restored file is normalised on the way in, so a
 * hand-edited backup can't put a half-formed record into the store (or the Sheet).
 */
import { round2 } from "../lib/format";
import { DEFAULT_CATEGORY_COLOR } from "./categoryColors";
import { DEFAULT_CATEGORY_ICON } from "./categoryIcons";
import { DEFAULT_METHOD } from "./methods";
import { DEFAULT_CURRENCY } from "./seed";
import { clampMonthStartDay } from "./settings";
import { APP_SETTINGS_ID, type AppSettings, type Category, type DB, type Expense, type SpendMethod } from "./types";

const APP_ID = "spendly";
const BACKUP_VERSION = 1;
const METHODS: SpendMethod[] = ["cash", "upi", "card"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export interface BackupFile {
  app: typeof APP_ID;
  version: number;
  exportedAt: string;
  data: DB;
}

export class InvalidBackupError extends Error {}

export function createBackup(db: DB): BackupFile {
  return { app: APP_ID, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data: db };
}

type Loose = Record<string, unknown>;

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const list = (v: unknown): Loose[] => (Array.isArray(v) ? (v as Loose[]) : []);

function toExpense(raw: Loose): Expense | null {
  const id = str(raw.id);
  const date = str(raw.date);
  if (!id || !ISO_DATE.test(date)) return null;
  const method = str(raw.method) as SpendMethod;
  return {
    id,
    date,
    amount: round2(num(raw.amount)),
    categoryId: str(raw.categoryId),
    note: str(raw.note),
    method: METHODS.includes(method) ? method : DEFAULT_METHOD,
    createdAt: num(raw.createdAt),
    updatedAt: num(raw.updatedAt),
  };
}

function toCategory(raw: Loose): Category | null {
  const id = str(raw.id);
  if (!id) return null;
  return {
    id,
    name: str(raw.name).trim() || "Category",
    icon: str(raw.icon) || DEFAULT_CATEGORY_ICON,
    color: str(raw.color) || DEFAULT_CATEGORY_COLOR,
    monthlyBudget: Math.max(0, round2(num(raw.monthlyBudget))),
    sortOrder: Math.max(0, Math.round(num(raw.sortOrder))),
    createdAt: num(raw.createdAt),
    updatedAt: num(raw.updatedAt),
  };
}

function toSettings(raw: Loose | undefined): AppSettings[] {
  if (!raw) return [];
  return [{
    id: APP_SETTINGS_ID,
    monthlyBudget: Math.max(0, round2(num(raw.monthlyBudget))),
    monthStartDay: clampMonthStartDay(num(raw.monthStartDay)),
    currency: str(raw.currency) || DEFAULT_CURRENCY,
    seededAt: num(raw.seededAt),
    updatedAt: num(raw.updatedAt),
  }];
}

export function parseBackup(text: string): DB {
  let raw: Loose;
  try {
    raw = JSON.parse(text) as Loose;
  } catch {
    throw new InvalidBackupError("Could not read that file");
  }
  const data = raw?.app === APP_ID && raw.data && typeof raw.data === "object" ? (raw.data as Loose) : null;
  if (!data) throw new InvalidBackupError("That file doesn't look like a valid backup");

  return {
    expenses: list(data.expenses).map(toExpense).filter((e): e is Expense => e !== null),
    categories: list(data.categories).map(toCategory).filter((c): c is Category => c !== null),
    settings: toSettings(list(data.settings)[0]),
  };
}
