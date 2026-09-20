import type { CSSProperties } from "react";
import { colorVars } from "../../data/categoryColors";
import { categoryIcon } from "../../data/categoryIcons";
import { cx } from "../../lib/cx";
import styles from "./categories.module.css";

interface CategoryBadgeProps {
  icon: string;
  color: string;
  size?: "sm" | "md" | "lg";
}

/** The category's icon in its own colour — the one visual cue repeated across every screen. */
export function CategoryBadge({ icon, color, size = "md" }: CategoryBadgeProps) {
  const Icon = categoryIcon(icon);
  const { ink, soft } = colorVars(color);
  return (
    <span className={cx(styles.badge, styles[size])} style={{ "--badge-ink": ink, "--badge-soft": soft } as CSSProperties} aria-hidden>
      <Icon />
    </span>
  );
}
