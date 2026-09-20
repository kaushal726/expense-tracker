import { DEFAULT_CURRENCY, DEFAULT_MONTH_START_DAY, DEFAULT_SETTINGS } from "./seed";
import type { AppSettings, DB } from "./types";

/** Days 29–31 don't exist in every month, so a cycle can only start on 1–28. */
export const MIN_MONTH_START_DAY = 1;
export const MAX_MONTH_START_DAY = 28;

export function clampMonthStartDay(day: number): number {
  if (!Number.isFinite(day)) return DEFAULT_MONTH_START_DAY;
  return Math.min(MAX_MONTH_START_DAY, Math.max(MIN_MONTH_START_DAY, Math.round(day)));
}

/** The saved settings, with anything missing or out of range filled in. */
export function settingsOf(db: DB): AppSettings {
  const saved = db.settings[0];
  if (!saved) return DEFAULT_SETTINGS;
  return {
    ...saved,
    monthlyBudget: Math.max(0, Number(saved.monthlyBudget) || 0),
    monthStartDay: clampMonthStartDay(Number(saved.monthStartDay)),
    currency: saved.currency || DEFAULT_CURRENCY,
  };
}
