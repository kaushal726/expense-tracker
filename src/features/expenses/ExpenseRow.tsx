import type { CSSProperties } from "react";
import { colorVars } from "../../data/categoryColors";
import { categoryIcon } from "../../data/categoryIcons";
import { UNCATEGORISED_NAME } from "../../data/insights";
import { methodLabel } from "../../data/methods";
import { isSpread, perCycleCostOf, spreadMonthsOf, type CostEntry } from "../../data/spread";
import type { Category, Expense } from "../../data/types";
import { formatDate, formatTime, toISODate } from "../../lib/dates";
import { formatMoney } from "../../lib/format";
import { useLongPress } from "./useLongPress";
import styles from "./expenses.module.css";

interface ExpenseRowProps {
  expense: Expense;
  category: Category | undefined;
  onOpen: () => void;
  /** Press and hold to repeat the spend on today's date. Left out for a later month's
   *  share, which is not a spend of its own to repeat. */
  onRepeat?: () => void;
  /** Set when this row is one month's share of an earlier payment, rather than the payment. */
  instalment?: Pick<CostEntry, "index" | "of" | "cost">;
}

const NOTHING = () => {};

/* The time an expense was entered is only the time it was spent when the two are the
 * same day — a backdated entry would otherwise claim a time it never had. */
function timeOf(expense: Expense): string {
  return toISODate(new Date(expense.createdAt)) === expense.date ? formatTime(expense.createdAt) : "";
}

export function ExpenseRow({ expense, category, onOpen, onRepeat, instalment }: ExpenseRowProps) {
  const longPress = useLongPress(onRepeat ?? NOTHING);
  const name = category?.name ?? UNCATEGORISED_NAME;
  const note = expense.note.trim();
  const Icon = categoryIcon(category?.icon ?? "tag");
  const { ink, soft } = colorVars(category?.color ?? "slate");
  /* A payment that covers several months shows what left the pocket, with what it costs a
   * month under it — the figure every total on the other screens is built from. */
  const spread = isSpread(expense);
  /* The note is the specific thing, so it leads; the category only repeats itself
   * underneath when the note has already taken the headline. */
  const detail = [
    note && name,
    methodLabel(expense.method),
    instalment ? `paid ${formatDate(expense.date, { day: "numeric", month: "short" })}` : timeOf(expense),
  ].filter(Boolean);

  return (
    <button
      type="button"
      className={styles.row}
      style={{ "--row-ink": ink, "--row-soft": soft } as CSSProperties}
      onClick={onOpen}
      {...longPress}
    >
      <span className={styles.rowIcon} aria-hidden><Icon /></span>
      <span className={styles.rowText}>
        <span className={styles.rowTitle}>{note || name}</span>
        <span className={styles.rowDetail}>
          {detail.map((part, i) => (
            <span key={part} className={i === 0 && note ? styles.rowCategory : undefined}>{part}</span>
          ))}
        </span>
      </span>
      <span className={styles.rowAmount}>
        {formatMoney(instalment ? instalment.cost : expense.amount)}
        {instalment && <small className={styles.rowPerCycle}>{instalment.index} of {instalment.of}</small>}
        {spread && !instalment && (
          <small className={styles.rowPerCycle}>
            {formatMoney(perCycleCostOf(expense))} × {spreadMonthsOf(expense)}
          </small>
        )}
      </span>
    </button>
  );
}
