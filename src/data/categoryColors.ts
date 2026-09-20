/* Category colours. Each key resolves to a pair of CSS variables defined for both themes
 * in src/styles/global.css: --cat-<key> (the solid ink) and --cat-<key>-soft (its tint).
 */
export const CATEGORY_COLORS = ["blue", "teal", "green", "amber", "orange", "rose", "violet", "slate"] as const;
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export const DEFAULT_CATEGORY_COLOR: CategoryColor = "slate";

function isCategoryColor(value: string): value is CategoryColor {
  return (CATEGORY_COLORS as readonly string[]).includes(value);
}

/** A colour saved by a newer version (or hand-edited in the Sheet) falls back to the default. */
export function colorVars(color: string): { ink: string; soft: string } {
  const key = isCategoryColor(color) ? color : DEFAULT_CATEGORY_COLOR;
  return { ink: `var(--cat-${key})`, soft: `var(--cat-${key}-soft)` };
}
