/* Which day the expense lands on. It sits at the top of the Add screen because it is
 * both the control and the answer to "what am I looking at" — and because a forgotten
 * expense from two days ago has to be one tap away.
 */
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { addDays, formatDayLabel, todayISO } from "../../lib/dates";
import { cx } from "../../lib/cx";
import styles from "./add.module.css";

interface DateSwitcherProps {
  value: string;
  onChange: (iso: string) => void;
}

export function DateSwitcher({ value, onChange }: DateSwitcherProps) {
  const today = todayISO();
  const onToday = value === today;

  return (
    <div className={styles.dateSwitcher} role="group" aria-label="Date of the expense">
      <button type="button" className={styles.dateStep} aria-label="Previous day" onClick={() => onChange(addDays(value, -1))}>
        <FiChevronLeft aria-hidden />
      </button>

      {/* The native picker covers the pill, so a tap anywhere on it opens the calendar. */}
      <label className={cx(styles.dateCurrent, !onToday && styles.dateOther)}>
        <FiCalendar aria-hidden />
        <span>{formatDayLabel(value)}</span>
        <input
          type="date"
          className={styles.dateInput}
          value={value}
          max={today}
          aria-label="Pick a date"
          onChange={(e) => onChange(e.target.value || today)}
        />
      </label>

      <button type="button" className={styles.dateStep} aria-label="Next day" disabled={onToday} onClick={() => onChange(addDays(value, 1))}>
        <FiChevronRight aria-hidden />
      </button>
    </div>
  );
}
