/* The whole period in one block: what went out, how that compares, and the two or three
 * numbers worth acting on. Everything below it on the screen is the detail behind this.
 */
import type { PeriodSummary } from "../../data/insights";
import { formatMoney, plural } from "../../lib/format";
import { Panel } from "../../ui/layout";
import { ChangeLine } from "./ChangeLine";
import styles from "./insights.module.css";

interface Fact {
  label: string;
  value: string;
}

interface PeriodSummaryCardProps {
  /** "September 2026", or whatever window is on screen. */
  label: string;
  summary: PeriodSummary;
  /** The same window before this one; null when there is nothing to compare with. */
  previous: number | null;
  previousLabel: string;
  facts: Fact[];
}

export function PeriodSummaryCard({ label, summary, previous, previousLabel, facts }: PeriodSummaryCardProps) {
  return (
    <Panel padded className={styles.summary}>
      <p className={styles.summaryLabel}>{label}</p>
      <p className={styles.summaryTotal}>{formatMoney(summary.total)}</p>
      <p className={styles.summaryCount}>
        {plural(summary.count, "expense")} over {plural(summary.daysElapsed, "day")}
      </p>
      {previous !== null && <ChangeLine current={summary.total} previous={previous} label={previousLabel} />}

      <dl className={styles.facts}>
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
