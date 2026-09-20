export const COLLECTIONS = ["expenses", "categories", "settings"] as const;
export type Collection = (typeof COLLECTIONS)[number];

/** How the money left the pocket. */
export type SpendMethod = "cash" | "upi" | "card";

export interface Expense {
  id: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  amount: number;
  categoryId: string;
  note: string;
  method: SpendMethod;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  /** Key into CATEGORY_ICONS (src/data/categoryIcons.ts) — a react-icons `fi` icon. */
  icon: string;
  /** Key into CATEGORY_COLORS (src/data/categoryColors.ts) — a CSS colour token. */
  color: string;
  /** 0 means no budget for this category. */
  monthlyBudget: number;
  createdAt: number;
  updatedAt: number;
}

export const APP_SETTINGS_ID = "app";

export interface AppSettings {
  id: typeof APP_SETTINGS_ID;
  /** 0 means no monthly budget. */
  monthlyBudget: number;
  /** Day of the month a spending cycle starts on, 1–28. */
  monthStartDay: number;
  currency: string;
  /** When the starter categories were seeded; keeps deleted ones from coming back. */
  seededAt: number;
  updatedAt: number;
}

export interface DB {
  expenses: Expense[];
  categories: Category[];
  settings: AppSettings[];
}

export type RecordOf<C extends Collection> = DB[C][number];
export type AnyRecord = RecordOf<Collection>;
