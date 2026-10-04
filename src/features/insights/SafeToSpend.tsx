/* What each category still allows for the days that are left — the question a budget is
 * set to answer, broken down far enough to act on.
 */
import type { CSSProperties } from "react";
import { colorVars } from "../../data/categoryColors";
import { categoryIcon } from "../../data/categoryIcons";
import type { CategoryAllowance } from "../../data/insights";
import { cx } from "../../lib/cx";
import { formatMoney, plural } from "../../lib/format";
import styles from "./insights.module.css";

interface SafeToSpendProps {
  allowances: CategoryAllowance[];
  daysLeft: number;
  /** True when at least one category is measured against a budget of its own. */
  anyOwnBudget: boolean;
}

export function SafeToSpend({ allowances, daysLeft, anyOwnBudget }: SafeToSpendProps) {
  if (!allowances.length) return null;

  return (
    <div className={styles.allowances}>
      {allowances.map((item) => {
        const Icon = categoryIcon(item.icon);
        const { ink, soft } = colorVars(item.color);
        return (
          <div key={item.categoryId || item.name} className={styles.allowance} style={{ "--row-ink": ink, "--row-soft": soft } as CSSProperties}>
            <span className={styles.allowanceIcon} aria-hidden><Icon /></span>
            <span className={styles.allowanceText}>
              <span className={styles.allowanceName}>
                {item.name}
                {item.ownBudget && <small className={styles.allowanceOwn}>own budget</small>}
              </span>
              <span className={styles.allowanceSpent}>{formatMoney(item.spent)} spent</span>
            </span>
            <span className={styles.allowanceRight}>
              <b className={cx(item.overspent && styles.allowanceOver)}>
                {item.overspent ? `${formatMoney(-item.left)} over` : `${formatMoney(item.perDay)} a day`}
              </b>
              {!item.overspent && <small>{formatMoney(item.left)} left</small>}
            </span>
          </div>
        );
      })}
      <p className={styles.patternCaption}>
        Over {plural(daysLeft, "day")}.
        {anyOwnBudget
          ? " Categories with a budget of their own are measured against it; the rest share what the month still allows, in the proportion you have been using them."
          : " Each category gets the share of what the month still allows that matches how you have been using it. Give one its own budget in More → Categories for an exact figure."}
      </p>
    </div>
  );
}
