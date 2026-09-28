/* "+50 +100 +500 +1000" beside a money field: taps add up, so most amounts never need
 * the keypad. The caller owns the amount, so this works for a plain field and for the
 * calculator pad alike. */
import { cx } from "../lib/cx";
import styles from "./quickAmounts.module.css";

const STEPS = [50, 100, 500, 1000];

interface QuickAmountsProps {
  onAdd: (step: number) => void;
  onClear: () => void;
  /** Hides the Clear chip while there is nothing to clear. */
  canClear: boolean;
  steps?: number[];
}

export function QuickAmounts({ onAdd, onClear, canClear, steps = STEPS }: QuickAmountsProps) {
  return (
    <div className={cx(styles.row, "scroll-row")}>
      {steps.map((step) => (
        <button key={step} type="button" className={styles.chip} onClick={() => onAdd(step)}>+{step}</button>
      ))}
      {canClear && <button type="button" className={styles.clear} onClick={onClear}>Clear</button>}
    </div>
  );
}
