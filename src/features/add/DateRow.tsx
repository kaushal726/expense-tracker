import { FiCalendar } from "react-icons/fi";
import { addDays, formatDate, todayISO } from "../../lib/dates";
import { cx } from "../../lib/cx";
import styles from "./add.module.css";

interface DateRowProps {
  value: string;
  onChange: (iso: string) => void;
}

/** Today and Yesterday are one tap; anything else opens the phone's date picker. */
export function DateRow({ value, onChange }: DateRowProps) {
  const today = todayISO();
  const yesterday = addDays(today, -1);
  const isOther = value !== today && value !== yesterday;

  return (
    <div className={styles.dateRow} role="group" aria-label="Date">
      <button type="button" className={styles.dateChip} aria-pressed={value === today} onClick={() => onChange(today)}>Today</button>
      <button type="button" className={styles.dateChip} aria-pressed={value === yesterday} onClick={() => onChange(yesterday)}>Yesterday</button>
      <label className={cx(styles.dateChip, styles.datePick)} data-active={isOther || undefined}>
        <FiCalendar aria-hidden />
        <span>{isOther ? formatDate(value, { day: "numeric", month: "short" }) : "Pick"}</span>
        <input
          type="date"
          className={styles.dateInput}
          value={value}
          max={today}
          aria-label="Pick a date"
          onChange={(e) => onChange(e.target.value || today)}
        />
      </label>
    </div>
  );
}
