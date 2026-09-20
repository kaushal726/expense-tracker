import type { CSSProperties, ReactNode } from "react";
import { cx } from "../lib/cx";
import styles from "./chip.module.css";

export interface ChipTone {
  ink: string;
  soft: string;
}

interface ChipProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  icon?: ReactNode;
  /** Colours the chip when it is selected; the app's own accent is used otherwise. */
  tone?: ChipTone;
  /** "radio" for one-of-many; "button" for a plain toggle. */
  role?: "radio" | "button";
  /** An outline instead of a fill, for "add a new one". */
  outline?: boolean;
  label?: string;
}

/** The one chip in the app: categories, periods and anything else pickable. */
export function Chip({ selected, onClick, children, icon, tone, role = "button", outline, label }: ChipProps) {
  const aria = role === "radio" ? { role, "aria-checked": selected } : { "aria-pressed": selected };
  return (
    <button
      type="button"
      className={cx(styles.chip, selected && styles.selected, outline && styles.outline)}
      style={tone ? ({ "--chip-ink": tone.ink, "--chip-soft": tone.soft } as CSSProperties) : undefined}
      aria-label={label}
      onClick={onClick}
      {...aria}
    >
      {icon && <span className={styles.icon} aria-hidden>{icon}</span>}
      {children}
    </button>
  );
}
