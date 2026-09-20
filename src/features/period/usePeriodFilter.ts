/* The period a screen is looking at, kept in the URL so a filtered view can be reloaded,
 * shared, and linked to from Insights.
 */
import { useMemo } from "react";
import { setQuery, type Route } from "../../app/router";
import { isPeriodPreset, presetRange, PERIOD_LABELS, type DateRange, type PeriodPreset } from "../../data/periods";
import { formatRange, todayISO } from "../../lib/dates";

export interface PeriodFilter {
  preset: PeriodPreset;
  range: DateRange;
  /** "This month" */
  label: string;
  /** "1 Sep 2026 – 30 Sep 2026" */
  rangeLabel: string;
  setPreset: (preset: PeriodPreset) => void;
  setRange: (range: DateRange) => void;
}

export function usePeriodFilter(route: Route, monthStartDay: number, presets: PeriodPreset[]): PeriodFilter {
  const today = todayISO();
  const raw = route.query.get("period") ?? "";
  const preset = isPeriodPreset(raw) && presets.includes(raw) ? raw : presets[0];
  const from = route.query.get("from") ?? "";
  const to = route.query.get("to") ?? "";

  const range = useMemo(
    () => (preset === "custom" ? { from, to } : presetRange(preset, today, monthStartDay)),
    [preset, from, to, today, monthStartDay],
  );

  return {
    preset,
    range,
    label: PERIOD_LABELS[preset],
    rangeLabel: formatRange(range),
    setPreset: (next) => setQuery(route, { period: next === presets[0] ? null : next, from: null, to: null }),
    setRange: (next) => setQuery(route, { period: "custom", from: next.from || null, to: next.to || null }),
  };
}
