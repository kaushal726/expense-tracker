import { FiAlertTriangle } from "react-icons/fi";
import type { BudgetStatus } from "../../data/insights";
import { cx } from "../../lib/cx";
import { formatMoney, formatShare, plural } from "../../lib/format";
import { Panel } from "../../ui/layout";
import { MeterBar } from "../../ui/MeterBar";
import styles from "./insights.module.css";

interface BudgetCardProps {
  status: BudgetStatus;
  daysLeft: number;
  /** Last month's daily rate, for "am I doing better than last time". */
  lastMonthPerDay: number;
}

const TONE_CLASS: Record<BudgetStatus["severity"], string | false> = {
  ok: false,
  close: styles.budgetClose,
  over: styles.budgetOver,
  farOver: styles.budgetFarOver,
};

/** Why a budget is worth setting: what a day allows, and whether today is already past it. */
export function BudgetCard({ status, daysLeft, lastMonthPerDay }: BudgetCardProps) {
  const runningHot = status.aheadOfPace > 0;

  return (
    <Panel padded className={cx(styles.budget, TONE_CLASS[status.severity])}>
      {status.severity !== "ok" && (
        <p className={styles.budgetAlert}>
          <FiAlertTriangle aria-hidden />
          {status.severity === "close"
            ? <span>Nearly out — {formatShare(status.usedShare)} of the budget gone</span>
            : <span><b>Over budget</b> · {formatShare(status.usedShare)} of it spent, {formatMoney(-status.left)} past the line</span>}
        </p>
      )}

      <div className={styles.budgetTop}>
        <span className={styles.budgetSpent}>{formatMoney(status.spent)}</span>
        <span className={styles.budgetOf}>of {formatMoney(status.budget)}</span>
      </div>
      <MeterBar share={status.usedShare} label="Budget used" />
      <p className={styles.budgetLine}>
        {status.overspent
          ? <><b>{formatMoney(-status.left)} over</b> · nothing left for the {plural(daysLeft, "day")} to go</>
          : <><b>{formatMoney(status.left)} left</b> · {formatShare(status.usedShare)} used</>}
      </p>

      <dl className={styles.facts}>
        <div>
          <dt>A day, on budget</dt>
          <dd>{formatMoney(status.dailyAllowance)}</dd>
        </div>
        <div>
          <dt>You are spending</dt>
          <dd>{formatMoney(status.paceSoFar)} a day</dd>
        </div>
        <div>
          <dt>Safe from here</dt>
          <dd>{daysLeft > 0 ? `${formatMoney(status.perDayLeft)} a day` : "—"}</dd>
        </div>
        <div>
          <dt>{runningHot ? "Spent extra so far" : "Under pace so far"}</dt>
          <dd className={runningHot ? styles.budgetHot : styles.budgetCool}>{formatMoney(Math.abs(status.aheadOfPace))}</dd>
        </div>
      </dl>

      {lastMonthPerDay > 0 && (
        <p className={styles.budgetHint}>Last month you averaged {formatMoney(lastMonthPerDay)} a day.</p>
      )}
    </Panel>
  );
}
