import type { CSSProperties } from "react";
import type { BudgetStatus } from "../../data/insights";
import { cx } from "../../lib/cx";
import { formatMoney, formatShare, plural } from "../../lib/format";
import { Panel } from "../../ui/layout";
import styles from "./insights.module.css";

interface BudgetCardProps {
  status: BudgetStatus;
  daysLeft: number;
}

/** The whole point of a budget: how much is left, and what that is per day from here. */
export function BudgetCard({ status, daysLeft }: BudgetCardProps) {
  const filled = Math.min(100, status.usedShare);
  return (
    <Panel padded className={cx(styles.budget, status.overspent && styles.budgetOver)}>
      <div className={styles.budgetTop}>
        <span className={styles.budgetSpent}>{formatMoney(status.spent)}</span>
        <span className={styles.budgetOf}>of {formatMoney(status.budget)}</span>
      </div>
      <div className={styles.budgetTrack}>
        <div className={styles.budgetFill} style={{ "--filled": `${filled}%` } as CSSProperties} />
      </div>
      <p className={styles.budgetLine}>
        {status.overspent
          ? <><b>{formatMoney(-status.left)} over</b> · {formatShare(status.usedShare)} of the budget used</>
          : <><b>{formatMoney(status.left)} left</b> · {formatShare(status.usedShare)} used</>}
      </p>
      {!status.overspent && daysLeft > 0 && (
        <p className={styles.budgetHint}>{formatMoney(status.perDayLeft)} a day for the {plural(daysLeft, "day")} left</p>
      )}
    </Panel>
  );
}
