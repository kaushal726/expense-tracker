import type { CSSProperties } from "react";
import { cx } from "../lib/cx";
import styles from "./meterBar.module.css";

interface MeterBarProps {
  /** Percent used; anything over 100 fills the track. */
  share: number;
  label: string;
  size?: "md" | "sm";
}

/**
 * A track that fills green through to red. The gradient always spans the whole track and
 * the fill clips it, so a colour means the same share of the limit whether the bar is a
 * sliver or full.
 */
export function MeterBar({ share, label, size = "md" }: MeterBarProps) {
  const filled = Math.min(100, Math.max(0, share));
  return (
    <div
      className={cx(styles.track, size === "sm" && styles.sm)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(share)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={styles.fill} style={{ "--filled": `${filled}%` } as CSSProperties} />
    </div>
  );
}
