import { FiSunrise } from "react-icons/fi";
import type { Category, Expense } from "../../data/types";
import { formatDayLabel } from "../../lib/dates";
import { formatMoney, plural } from "../../lib/format";
import { EmptyState } from "../../ui/feedback";
import { SectionTitle } from "../../ui/layout";
import { ExpenseRow } from "../expenses/ExpenseRow";
import styles from "./add.module.css";

interface DayListProps {
  /** The day the pad is adding to, so a saved expense always shows up below it. */
  date: string;
  expenses: Expense[];
  total: number;
  categoriesById: Map<string, Category>;
  onOpen: (expense: Expense) => void;
  onRepeat: (expense: Expense) => void;
}

export function DayList({ date, expenses, total, categoriesById, onOpen, onRepeat }: DayListProps) {
  return (
    <section className={styles.today}>
      <SectionTitle right={expenses.length ? <span className={styles.dayTotal}>{formatMoney(total)}</span> : undefined}>
        {formatDayLabel(date)}
      </SectionTitle>
      {expenses.length ? (
        <>
          <div className={styles.todayList}>
            {expenses.map((expense) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                category={categoriesById.get(expense.categoryId)}
                onOpen={() => onOpen(expense)}
                onRepeat={() => onRepeat(expense)}
              />
            ))}
          </div>
          <p className={styles.todayHint}>{plural(expenses.length, "expense")} · press and hold one to repeat it on today</p>
        </>
      ) : (
        <EmptyState icon={<FiSunrise />} title="Nothing spent on this day" message="Whatever you add above shows up here, newest first." />
      )}
    </section>
  );
}
