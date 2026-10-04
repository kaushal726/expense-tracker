/* The running total against an even spend of the budget — the chart that answers "am I
 * ahead or behind" without any arithmetic. Where the line is above the dashed one, the
 * month is running hot.
 */
import type { CumulativePoint } from "../../data/insights";
import { formatDate } from "../../lib/dates";
import { formatMoney, round2 } from "../../lib/format";
import styles from "./insights.module.css";

const WIDTH = 320;
const HEIGHT = 120;

interface PaceChartProps {
  points: CumulativePoint[];
  /** The month's budget, drawn as the even pace. 0 hides the pace line. */
  budget: number;
  /** Days in the whole period, so the pace line reaches the budget at the end. */
  daysTotal: number;
}

const x = (index: number, count: number) => (count < 2 ? 0 : (index / (count - 1)) * WIDTH);

export function PaceChart({ points, budget, daysTotal }: PaceChartProps) {
  if (points.length < 2) return null;
  const spent = points[points.length - 1].total;
  // The even pace measured at the same day the line reaches, not at the end of the month.
  const paceEnd = budget ? round2((budget / daysTotal) * points.length) : 0;
  // Headroom over whichever of the two is higher, so neither is pinned to the top edge.
  const ceiling = Math.max(spent, paceEnd, 1) * 1.15;
  const y = (value: number) => HEIGHT - (value / ceiling) * HEIGHT;

  const line = points.map((point, i) => `${x(i, points.length)},${y(point.total)}`).join(" ");
  const area = `0,${HEIGHT} ${line} ${x(points.length - 1, points.length)},${HEIGHT}`;
  const ahead = budget > 0 && spent > paceEnd;

  return (
    <div className={styles.pace}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className={styles.paceSvg} role="img"
        aria-label={`Spent ${formatMoney(spent)} so far${budget ? `, against ${formatMoney(paceEnd)} at an even pace` : ""}`}>
        <polygon points={area} className={ahead ? styles.paceAreaHot : styles.paceArea} />
        <polyline points={line} fill="none" className={ahead ? styles.paceLineHot : styles.paceLine} />
        {budget > 0 && <line x1="0" y1={y(0)} x2={x(points.length - 1, points.length)} y2={y(paceEnd)} className={styles.paceGuide} />}
      </svg>
      <p className={styles.paceCaption}>
        <b>{formatMoney(spent)}</b> by {formatDate(points[points.length - 1].date, { day: "numeric", month: "short" })}
        {budget > 0 && <> · an even pace would be <b>{formatMoney(paceEnd)}</b></>}
      </p>
    </div>
  );
}
