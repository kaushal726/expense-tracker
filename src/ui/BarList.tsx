import type { CSSProperties, ReactNode } from "react";
import styles from "./barList.module.css";

export interface BarItem {
  key: string;
  label: ReactNode;
  value: number;
  display: ReactNode;
  href?: string;
  /** CSS colour for the bar; the accent is used when it is left out. */
  color?: string;
}

/** Horizontal bars scaled to the largest value. */
export function BarList({ items }: { items: BarItem[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className={styles.list}>
      {items.map((item) => {
        const body = (
          <>
            <div className={styles.top}>
              <span className={styles.label}>{item.label}</span>
              <span className={styles.value}>{item.display}</span>
            </div>
            <div className={styles.track}>
              <div className={styles.fill} style={{ width: `${Math.max(2, (item.value / max) * 100)}%`, background: item.color } as CSSProperties} />
            </div>
          </>
        );
        return item.href
          ? <a key={item.key} href={item.href} className={styles.row}>{body}</a>
          : <div key={item.key} className={styles.row}>{body}</div>;
      })}
    </div>
  );
}
