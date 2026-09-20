import { useState, type CSSProperties } from "react";
import type { TrendPoint } from "../../data/insights";
import { formatDate } from "../../lib/dates";
import { cx } from "../../lib/cx";
import { formatMoney } from "../../lib/format";
import styles from "./insights.module.css";

interface TrendChartProps {
  points: TrendPoint[];
  /** Drawn as a dashed line across the bars. */
  average?: number;
  label: string;
  emptyText: string;
}

/** Roughly this many labels fit under the bars on a phone. */
const MAX_AXIS_LABELS = 8;
/** So a small-but-real amount never looks like nothing. */
const MIN_BAR_PERCENT = 3;

function captionOf(point: TrendPoint): string {
  const from = formatDate(point.from, { day: "numeric", month: "short", year: "numeric" });
  if (point.from === point.to) return from;
  return `${formatDate(point.from, { day: "numeric", month: "short" })} – ${formatDate(point.to, { day: "numeric", month: "short", year: "numeric" })}`;
}

export function TrendChart({ points, average = 0, label, emptyText }: TrendChartProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  if (!points.length) return <p className={styles.note}>{emptyText}</p>;

  const max = Math.max(...points.map((p) => p.amount), average, 1);
  const labelStep = Math.ceil(points.length / MAX_AXIS_LABELS);
  const selected = points.find((p) => p.key === selectedKey) ?? null;
  const peak = points.reduce((best, p) => (p.amount > best.amount ? p : best), points[0]);

  return (
    <div className={styles.chart}>
      <div className={styles.plot} role="group" aria-label={label}>
        {average > 0 && (
          <div className={styles.averageLine} style={{ bottom: `${(average / max) * 100}%` }} aria-hidden>
            <span className={styles.averageTag}>avg {formatMoney(average)}</span>
          </div>
        )}
        <div className={styles.bars}>
          {points.map((point) => (
            <button
              key={point.key}
              type="button"
              className={cx(styles.bar, point.key === selectedKey && styles.barSelected)}
              style={{ "--height": `${point.amount ? Math.max(MIN_BAR_PERCENT, (point.amount / max) * 100) : 0}%` } as CSSProperties}
              aria-label={`${point.label}: ${formatMoney(point.amount)}`}
              aria-pressed={point.key === selectedKey}
              onClick={() => setSelectedKey((key) => (key === point.key ? null : point.key))}
            >
              <span className={styles.barFill} />
            </button>
          ))}
        </div>
      </div>
      <div className={styles.axis} aria-hidden>
        {points.map((point, i) => (
          <span key={point.key} className={styles.axisLabel}>{i % labelStep === 0 ? point.label : ""}</span>
        ))}
      </div>
      <p className={styles.caption}>
        {selected
          ? <><b>{formatMoney(selected.amount)}</b> · {captionOf(selected)}</>
          : <>Highest: <b>{formatMoney(peak.amount)}</b> · {captionOf(peak)}</>}
      </p>
    </div>
  );
}
