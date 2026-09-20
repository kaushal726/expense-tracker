import { formatMoney } from "../../lib/format";
import { methodLabel } from "../../data/methods";
import type { Category, Expense } from "../../data/types";
import { UNCATEGORISED_NAME } from "../../data/insights";
import { CategoryBadge } from "../categories/CategoryBadge";
import { useLongPress } from "./useLongPress";
import styles from "./expenses.module.css";

interface ExpenseRowProps {
  expense: Expense;
  category: Category | undefined;
  onOpen: () => void;
  /** Press and hold to repeat the spend on today's date. */
  onRepeat: () => void;
}

export function ExpenseRow({ expense, category, onOpen, onRepeat }: ExpenseRowProps) {
  const longPress = useLongPress(onRepeat);
  const name = category?.name ?? UNCATEGORISED_NAME;
  const detail = expense.note.trim() || methodLabel(expense.method);

  return (
    <button type="button" className={styles.row} onClick={onOpen} {...longPress}>
      <CategoryBadge icon={category?.icon ?? "tag"} color={category?.color ?? "slate"} />
      <span className={styles.rowText}>
        <span className={styles.rowTitle}>{name}</span>
        <span className={styles.rowDetail}>{detail}</span>
      </span>
      <span className={styles.rowAmount}>{formatMoney(expense.amount)}</span>
    </button>
  );
}
