import type { DayPoint } from "../../data/insights";
import { formatDate, parseISODate, todayISO } from "../../lib/dates";
import { cx } from "../../lib/cx";
import { formatMoney } from "../../lib/format";
import styles from "./insights.module.css";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
/* Four steps read at a glance; a continuous tint just turns into mud. */
const LEVELS = 4;
const LEVEL_KEYS = [0, 1, 2, 3, 4];

/** 0 for a day with nothing on it, then 1–4 by how big the day was against the biggest. */
function levelOf(amount: number, max: number): number {
  if (!amount || !max) return 0;
  return Math.max(1, Math.ceil((amount / max) * LEVELS));
}

/** Monday-first offset, so the grid lines up with the weekday header. */
function weekdayOffset(iso: string): number {
  return (parseISODate(iso).getDay() + 6) % 7;
}

/** One square per day: the darker it is, the more went out that day. */
export function HeatMap({ points }: { points: DayPoint[] }) {
  if (!points.length) return null;
  const max = Math.max(...points.map((p) => p.amount));
  const lead = weekdayOffset(points[0].date);
  const today = todayISO();

  return (
    <div className={styles.heat}>
      <div className={styles.heatHead} aria-hidden>
        {WEEKDAYS.map((day, i) => <span key={i}>{day}</span>)}
      </div>
      <div className={styles.heatGrid}>
        {Array.from({ length: lead }, (_, i) => <span key={`pad-${i}`} className={styles.heatPad} aria-hidden />)}
        {points.map((point) => (
          <span
            key={point.date}
            className={cx(styles.heatCell, point.date === today && styles.heatToday)}
            data-level={levelOf(point.amount, max)}
            title={`${formatDate(point.date)} · ${formatMoney(point.amount)}`}
          >
            {Number(point.date.slice(8))}
          </span>
        ))}
      </div>
      <p className={styles.heatLegend}>
        <span>Nothing</span>
        {LEVEL_KEYS.map((level) => <span key={level} className={styles.heatKey} data-level={level} />)}
        <span>{formatMoney(max)}</span>
      </p>
    </div>
  );
}
