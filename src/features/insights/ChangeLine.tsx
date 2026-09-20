import { changeVs } from "../../data/insights";
import { cx } from "../../lib/cx";
import { formatMoney, formatPercentChange } from "../../lib/format";
import styles from "./insights.module.css";

interface ChangeLineProps {
  current: number;
  previous: number;
  /** What the previous window is called, e.g. "last month". */
  label: string;
}

/** One honest sentence: up or down, by how much, against what. */
export function ChangeLine({ current, previous, label }: ChangeLineProps) {
  const change = changeVs(current, previous);
  if (!change.amount) return <p className={styles.change}>Same as {label}</p>;
  const up = change.amount > 0;

  return (
    <p className={cx(styles.change, up ? styles.changeUp : styles.changeDown)}>
      <b>{formatMoney(Math.abs(change.amount))}</b> {up ? "more" : "less"} than {label}
      {change.percent !== null && <> · {formatPercentChange(change.percent)}</>}
    </p>
  );
}
