/* Category colours. Each key resolves to a pair of CSS variables defined for both themes
 * in src/styles/global.css: --cat-<key> (the solid ink) and --cat-<key>-soft (its tint).
 */
export const CATEGORY_COLORS = ["blue", "teal", "green", "amber", "orange", "rose", "violet", "slate"] as const;
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export const DEFAULT_CATEGORY_COLOR: CategoryColor = "slate";

function isCategoryColor(value: string): value is CategoryColor {
  return (CATEGORY_COLORS as readonly string[]).includes(value);
}

/** The least-used colour, so a new category doesn't come out looking like an existing one. */
export function nextCategoryColor(used: { color: string }[]): CategoryColor {
  const counts = new Map<string, number>();
  used.forEach((c) => counts.set(c.color, (counts.get(c.color) ?? 0) + 1));
  return CATEGORY_COLORS.reduce(
    (best, color) => ((counts.get(color) ?? 0) < (counts.get(best) ?? 0) ? color : best),
    CATEGORY_COLORS[0],
  );
}

/** A colour saved by a newer version (or hand-edited in the Sheet) falls back to the default. */
export function colorVars(color: string): { ink: string; soft: string } {
  const key = isCategoryColor(color) ? color : DEFAULT_CATEGORY_COLOR;
  return { ink: `var(--cat-${key})`, soft: `var(--cat-${key}-soft)` };
}
