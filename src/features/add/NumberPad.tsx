import { FiDelete } from "react-icons/fi";
import { cx } from "../../lib/cx";
import { OPERATOR_LABELS, type PadKey } from "./padState";
import styles from "./add.module.css";

/** Digits on the left, the two operators and backspace down the right edge. */
const ROWS: PadKey[][] = [
  ["1", "2", "3", "back"],
  ["4", "5", "6", "minus"],
  ["7", "8", "9", "plus"],
  ["clear", "0", "dot", "equals"],
];

const LABELS: Partial<Record<PadKey, string>> = {
  dot: ".",
  back: "Backspace",
  clear: "Clear",
  equals: "=",
  plus: OPERATOR_LABELS.plus,
  minus: OPERATOR_LABELS.minus,
};

const OPERATOR_KEYS: PadKey[] = ["plus", "minus", "equals"];
const UTILITY_KEYS: PadKey[] = ["back", "clear"];

export function NumberPad({ onPress }: { onPress: (key: PadKey) => void }) {
  return (
    <div className={styles.pad} role="group" aria-label="Number pad">
      {ROWS.flat().map((key) => (
        <button
          key={key}
          type="button"
          className={cx(styles.padKey, OPERATOR_KEYS.includes(key) && styles.padOperator, UTILITY_KEYS.includes(key) && styles.padUtility)}
          aria-label={LABELS[key] ?? key}
          onClick={() => onPress(key)}
        >
          {key === "back" ? <FiDelete aria-hidden /> : key === "clear" ? "C" : (LABELS[key] ?? key)}
        </button>
      ))}
    </div>
  );
}
