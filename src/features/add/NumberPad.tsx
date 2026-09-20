import { FiDelete } from "react-icons/fi";
import type { PadKey } from "./amountDraft";
import styles from "./add.module.css";

/** Bottom row keeps the decimal point and backspace either side of zero. */
const ROWS: PadKey[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["dot", "0", "back"],
];

const LABELS: Partial<Record<PadKey, string>> = { dot: ".", back: "Backspace" };

export function NumberPad({ onPress }: { onPress: (key: PadKey) => void }) {
  return (
    <div className={styles.pad} role="group" aria-label="Number pad">
      {ROWS.flat().map((key) => (
        <button
          key={key}
          type="button"
          className={styles.padKey}
          aria-label={LABELS[key] ?? key}
          onClick={() => onPress(key)}
        >
          {key === "back" ? <FiDelete aria-hidden /> : (LABELS[key] ?? key)}
        </button>
      ))}
    </div>
  );
}
