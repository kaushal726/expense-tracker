/* Two small reads on habit rather than amount: which day of the week the money goes on,
 * and how it leaves the account.
 */
import type { CSSProperties } from "react";
import type { MethodSlice, WeekdayPoint } from "../../data/insights";
import { cx } from "../../lib/cx";
import { formatMoney, formatShare } from "../../lib/format";
import styles from "./insights.module.css";

/** Average spend per Monday, per Tuesday and so on, so a short month doesn't skew it. */
export function WeekdayChart({ points }: { points: WeekdayPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.average));
  const busiest = points.reduce((best, p) => (p.average > best.average ? p : best), points[0]);

  return (
    <div className={styles.weekday}>
      <div className={styles.weekdayBars}>
        {points.map((point) => (
          <div key={point.label} className={styles.weekdayCol}>
            <div
              className={cx(styles.weekdayBar, point.label === busiest.label && point.average > 0 && styles.weekdayPeak)}
              style={{ "--height": `${point.average ? Math.max(4, (point.average / max) * 100) : 0}%` } as CSSProperties}
              title={`${point.label}: ${formatMoney(point.average)} on an average ${point.label}`}
            />
            <span className={styles.weekdayLabel}>{point.label.slice(0, 1)}</span>
          </div>
        ))}
      </div>
      <p className={styles.patternCaption}>
        {busiest.average > 0
          ? <>Heaviest on a <b>{busiest.label}</b> — {formatMoney(busiest.average)} on an average one</>
          : "Not enough days yet"}
      </p>
    </div>
  );
}

/** One bar, split by how the money was paid. */
export function MethodSplit({ slices }: { slices: MethodSlice[] }) {
  if (!slices.length) return null;
  const TONE: Record<string, string> = { cash: "var(--cat-green)", upi: "var(--cat-blue)", card: "var(--cat-violet)" };

  return (
    <div className={styles.methods}>
      <div className={styles.methodBar}>
        {slices.map((slice) => (
          <span
            key={slice.method}
            className={styles.methodPart}
            style={{ width: `${slice.share}%`, background: TONE[slice.method] ?? "var(--cat-slate)" } as CSSProperties}
            title={`${slice.label}: ${formatMoney(slice.amount)}`}
          />
        ))}
      </div>
      <ul className={styles.methodLegend}>
        {slices.map((slice) => (
          <li key={slice.method}>
            <span className={styles.methodDot} style={{ background: TONE[slice.method] ?? "var(--cat-slate)" } as CSSProperties} />
            {slice.label}
            <b>{formatMoney(slice.amount)}</b>
            <small>{formatShare(slice.share)}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
