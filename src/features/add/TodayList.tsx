import { FiSunrise } from "react-icons/fi";
import type { Category, Expense } from "../../data/types";
import { formatMoney, plural } from "../../lib/format";
import { EmptyState } from "../../ui/feedback";
import { SectionTitle } from "../../ui/layout";
import { ExpenseRow } from "../expenses/ExpenseRow";
import styles from "./add.module.css";

interface TodayListProps {
  expenses: Expense[];
  categoriesById: Map<string, Category>;
  total: number;
  onOpen: (expense: Expense) => void;
  onRepeat: (expense: Expense) => void;
}

export function TodayList({ expenses, categoriesById, total, onOpen, onRepeat }: TodayListProps) {
  return (
    <section className={styles.today}>
      <SectionTitle right={expenses.length ? <span className={styles.todayTotal}>{formatMoney(total)}</span> : undefined}>
        Today
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
          <p className={styles.todayHint}>{plural(expenses.length, "expense")} today · press and hold one to repeat it</p>
        </>
      ) : (
        <EmptyState icon={<FiSunrise />} title="Nothing spent yet today" message="Punch in an amount above and it lands here." />
      )}
    </section>
  );
}
