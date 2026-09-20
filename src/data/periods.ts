/* The windows the app can look at money through, from a single month to a decade. */
import { addDays } from "../lib/dates";
import { cycleContaining, daysBetween, recentYears, shiftCycle, shiftYear, yearContaining } from "./months";

export interface DateRange {
  from: string;
  to: string;
}

export type PeriodPreset =
  | "month" | "lastMonth" | "week"
  | "year" | "lastYear" | "fiveYears" | "tenYears"
  | "all" | "custom";

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  month: "This month",
  lastMonth: "Last month",
  week: "Last 7 days",
  year: "This year",
  lastYear: "Last year",
  fiveYears: "5 years",
  tenYears: "10 years",
  all: "All time",
  custom: "Custom",
};

/** One list for every screen, so a drill-through from Insights lands on the same window. */
export const PERIOD_PRESETS: PeriodPreset[] = ["month", "lastMonth", "week", "year", "lastYear", "fiveYears", "tenYears", "all", "custom"];

const YEARS_BACK: Partial<Record<PeriodPreset, number>> = { fiveYears: 5, tenYears: 10 };

export function presetRange(preset: Exclude<PeriodPreset, "custom">, today: string, monthStartDay: number): DateRange {
  const years = YEARS_BACK[preset];
  if (years) {
    const spans = recentYears(today, monthStartDay, years);
    return { from: spans[0].from, to: spans[spans.length - 1].to };
  }
  switch (preset) {
    case "month":
      return cycleContaining(today, monthStartDay);
    case "lastMonth":
      return shiftCycle(cycleContaining(today, monthStartDay), monthStartDay, -1);
    case "week":
      return { from: addDays(today, -6), to: today };
    case "year":
      return yearContaining(today, monthStartDay);
    case "lastYear":
      return shiftYear(yearContaining(today, monthStartDay), monthStartDay, -1);
    case "all":
      return { from: "", to: "" };
    default:
      return cycleContaining(today, monthStartDay);
  }
}

export function isPeriodPreset(value: string): value is PeriodPreset {
  return value in PERIOD_LABELS;
}

/** True when the period is exactly one monthly cycle, which unlocks the budget and the heat map. */
export function isSingleCycle(range: DateRange, monthStartDay: number): boolean {
  if (!range.from || !range.to) return false;
  const cycle = cycleContaining(range.from, monthStartDay);
  return cycle.from === range.from && cycle.to === range.to;
}

/** The window this period is measured against: the cycle, year or equal stretch before it. */
export function previousRange(range: DateRange, preset: PeriodPreset, today: string, monthStartDay: number): DateRange | null {
  const cycle = () => cycleContaining(today, monthStartDay);
  const year = () => yearContaining(today, monthStartDay);
  switch (preset) {
    case "month":
      return shiftCycle(cycle(), monthStartDay, -1);
    case "lastMonth":
      return shiftCycle(cycle(), monthStartDay, -2);
    case "year":
      return shiftYear(year(), monthStartDay, -1);
    case "lastYear":
      return shiftYear(year(), monthStartDay, -2);
    case "all":
      return null;
    default:
      if (!range.from || !range.to) return null;
      return { from: addDays(range.from, -daysBetween(range.from, range.to)), to: addDays(range.from, -1) };
  }
}

/** "vs last month" — what the comparison line should call the window behind it. */
export const PREVIOUS_LABELS: Partial<Record<PeriodPreset, string>> = {
  month: "last month",
  lastMonth: "the month before",
  year: "last year",
  lastYear: "the year before",
};
