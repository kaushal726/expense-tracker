/* The order the category chips sit in — set by hand in More → Categories, not guessed
 * from how often each one is used, so what is in front stays in front.
 */
import type { Category } from "./types";

export type MoveDirection = -1 | 1;

/** Categories in the order they were arranged. Ties fall back to when they were made,
 *  which is what every category looks like before anything has been moved. */
export function categoriesInOrder(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt);
}

/** The place a new category goes: the end of the list. */
export function nextSortOrder(categories: Category[]): number {
  return categories.reduce((max, c) => Math.max(max, c.sortOrder), -1) + 1;
}

/**
 * Moves one category a single place up or down. Every category is renumbered 0…n−1, but
 * the ones that kept their place keep their object too, so only the rows that really
 * moved are stamped and sent to the Sheet.
 */
export function moveCategory(categories: Category[], id: string, direction: MoveDirection): Category[] {
  const ordered = categoriesInOrder(categories);
  const from = ordered.findIndex((c) => c.id === id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= ordered.length) return categories;

  const moved = [...ordered];
  [moved[from], moved[to]] = [moved[to], moved[from]];
  return moved.map((category, index) => (category.sortOrder === index ? category : { ...category, sortOrder: index }));
}
