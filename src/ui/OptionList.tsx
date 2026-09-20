/* One-choice list: a tick beside the chosen row, optionally with a count or a note. */
import { FiCheck } from "react-icons/fi";
import styles from "./optionList.module.css";

export interface Option {
  value: string;
  label: string;
  /** Second line, e.g. what a report contains. */
  detail?: string;
  /** How many rows this choice would leave, when the screen can say. */
  count?: number;
}

interface OptionListProps {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

export function OptionList({ label, options, value, onChange }: OptionListProps) {
  return (
    <div className={styles.options} role="listbox" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="option"
          aria-selected={o.value === value}
          className={styles.option}
          onClick={() => onChange(o.value)}
        >
          <span className={styles.text}>
            {o.label}
            {o.detail && <small>{o.detail}</small>}
          </span>
          {o.count !== undefined && <span className={styles.count}>{o.count}</span>}
          {o.value === value && <FiCheck aria-hidden />}
        </button>
      ))}
    </div>
  );
}
