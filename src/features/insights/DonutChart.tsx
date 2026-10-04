/* The category split as a ring: the one picture that answers "where does it go" before
 * any number is read. The bar list under it is the legend, so this carries no labels.
 */
import { colorVars } from "../../data/categoryColors";
import type { CategorySlice } from "../../data/insights";
import { formatMoney, formatShare } from "../../lib/format";
import styles from "./insights.module.css";

const SIZE = 168;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** A hair of background between segments, so neighbouring colours stay apart. */
const GAP = 2;

interface DonutChartProps {
  slices: CategorySlice[];
  total: number;
  /** Sits in the hole, under the total. */
  caption: string;
}

export function DonutChart({ slices, total, caption }: DonutChartProps) {
  if (!total) return null;
  let offset = 0;

  return (
    <div className={styles.donut}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.donutRing} role="img" aria-label={`Spending by category, ${formatMoney(total)} in total`}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--track)" strokeWidth={STROKE} />
        {slices.map((slice) => {
          const length = (slice.amount / total) * CIRCUMFERENCE;
          const dash = Math.max(0, length - GAP);
          const segment = (
            <circle
              key={slice.categoryId || slice.name}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={colorVars(slice.color).ink}
              strokeWidth={STROKE}
              strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
              strokeDashoffset={-offset}
            >
              <title>{`${slice.name}: ${formatMoney(slice.amount)} · ${formatShare(slice.share)}`}</title>
            </circle>
          );
          offset += length;
          return segment;
        })}
      </svg>
      <div className={styles.donutHole}>
        <span className={styles.donutTotal}>{formatMoney(total)}</span>
        <span className={styles.donutCaption}>{caption}</span>
      </div>
    </div>
  );
}
