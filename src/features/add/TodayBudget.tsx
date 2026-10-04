/* The one line that decides the day: what today allows, and how much of it is gone. It
 * sits under Save so it is read on the way out of every entry.
 */
import { FiArrowRight } from "react-icons/fi";
import type { DailyAllowance } from "../../data/dailyAllowance";
import { cx } from "../../lib/cx";
import { formatMoney, plural } from "../../lib/format";
import { MeterBar } from "../../ui/MeterBar";
import styles from "./add.module.css";

interface TodayBudgetProps {
  allowance: DailyAllowance;
  monthSpent: number;
  /** Insights, where the month's own picture is. */
  href: string;
}

export function TodayBudget({ allowance, monthSpent, href }: TodayBudgetProps) {
  const noBudget = allowance.budget === 0;

  return (
    <a className={styles.todayBudget} href={href}>
      {noBudget ? (
        <>
          <span className={styles.todayBudgetTop}>
            <span className={styles.todayBudgetLabel}>Spent today</span>
            <b className={styles.todayBudgetLimit}>{formatMoney(allowance.spent)}</b>
          </span>
          <span className={styles.todayBudgetHint}>
            Set a monthly budget and this becomes a daily limit you can keep to.
          </span>
        </>
      ) : (
        <>
          <span className={styles.todayBudgetTop}>
            <span className={styles.todayBudgetLabel}>Today&apos;s limit</span>
            <b className={styles.todayBudgetLimit}>{formatMoney(allowance.limit)}</b>
          </span>
          <MeterBar share={allowance.usedShare} label="Today's limit used" size="sm" />
          <span className={cx(styles.todayBudgetLine, allowance.overspent && styles.todayBudgetOver)}>
            {formatMoney(allowance.spent)} spent ·{" "}
            {allowance.overspent
              ? <b>{formatMoney(-allowance.left)} over today</b>
              : <b>{formatMoney(allowance.left)} left today</b>}
          </span>
        </>
      )}

      <span className={styles.todayBudgetFoot}>
        <span>
          This month <b>{formatMoney(monthSpent)}</b>
          {!noBudget && <> of {formatMoney(allowance.budget)}</>}
          {allowance.daysLeft > 0 && <> · {plural(allowance.daysLeft, "day")} to go</>}
        </span>
        <FiArrowRight aria-hidden />
      </span>
    </a>
  );
}
