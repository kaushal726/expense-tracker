import type { CSSProperties } from "react";
import type { DayPoint } from "../../data/insights";
import { formatDate, parseISODate } from "../../lib/dates";
import { formatMoney } from "../../lib/format";
import styles from "./insights.module.css";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
/** How dark a square can get, so even the biggest day keeps its label readable. */
const MAX_INTENSITY = 0.92;
const MIN_INTENSITY = 0.14;
/** Past this tint the square is dark enough that the day number has to flip. */
const INK_FLIP_AT = 0.5;

function intensityOf(amount: number, max: number): number {
  return max && amount ? MIN_INTENSITY + (amount / max) * (MAX_INTENSITY - MIN_INTENSITY) : 0;
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

  return (
    <div className={styles.heat}>
      <div className={styles.heatHead} aria-hidden>
        {WEEKDAYS.map((day, i) => <span key={i}>{day}</span>)}
      </div>
      <div className={styles.heatGrid}>
        {Array.from({ length: lead }, (_, i) => <span key={`pad-${i}`} className={styles.heatPad} aria-hidden />)}
        {points.map((point) => {
          const intensity = intensityOf(point.amount, max);
          return (
            <span
              key={point.date}
              className={styles.heatCell}
              style={{ "--intensity": intensity, "--day-ink": intensity > INK_FLIP_AT ? "var(--on-primary)" : "var(--ink-3)" } as CSSProperties}
              title={`${formatDate(point.date)} · ${formatMoney(point.amount)}`}
            >
              <span className={styles.heatDay}>{Number(point.date.slice(8))}</span>
            </span>
          );
        })}
      </div>
      <p className={styles.heatLegend} aria-hidden>
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((step) => (
          <span key={step} className={styles.heatKey} style={{ "--intensity": step ? MIN_INTENSITY + step * (MAX_INTENSITY - MIN_INTENSITY) : 0 } as CSSProperties} />
        ))}
        <span>More</span>
      </p>
    </div>
  );
}
