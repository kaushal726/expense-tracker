import { FiSunrise } from "react-icons/fi";
import type { CostEntry } from "../../data/spread";
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
  entries: CostEntry[];
  /** What the day costs. */
  total: number;
  /** What left the pocket that day, shown beside the total only when it differs. */
  paid: number;
  categoriesById: Map<string, Category>;
  onOpen: (expense: Expense) => void;
  onRepeat: (expense: Expense) => void;
}

export function DayList({ date, entries, total, paid, categoriesById, onOpen, onRepeat }: DayListProps) {
  return (
    <section className={styles.today}>
      <SectionTitle
        right={entries.length ? (
          <span className={styles.dayTotal}>
            {paid !== total && <small className={styles.dayPaid}>{formatMoney(paid)} paid · </small>}
            {formatMoney(total)}
          </span>
        ) : undefined}
      >
        {formatDayLabel(date)}
      </SectionTitle>
      {entries.length ? (
        <>
          <div className={styles.todayList}>
            {entries.map((entry) => (
              <ExpenseRow
                key={`${entry.expense.id}-${entry.index}`}
                expense={entry.expense}
                category={categoriesById.get(entry.expense.categoryId)}
                onOpen={() => onOpen(entry.expense)}
                onRepeat={entry.index === 1 ? () => onRepeat(entry.expense) : undefined}
                instalment={entry.index > 1 ? entry : undefined}
              />
            ))}
          </div>
          <p className={styles.todayHint}>{plural(entries.length, "expense")} · press and hold one to repeat it on today</p>
        </>
      ) : (
        <EmptyState icon={<FiSunrise />} title="Nothing spent on this day" message="Whatever you add above shows up here, newest first." />
      )}
    </section>
  );
}
