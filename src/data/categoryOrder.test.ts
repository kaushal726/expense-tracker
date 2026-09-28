import { describe, expect, it } from "vitest";
import { CATEGORY_COLORS, nextCategoryColor } from "./categoryColors";
import { categoriesInOrder, moveCategory, nextSortOrder } from "./categoryOrder";
import type { Category } from "./types";

const category = (id: string, sortOrder: number, createdAt = 0): Category =>
  ({ id, name: id, icon: "tag", color: "slate", monthlyBudget: 0, sortOrder, createdAt, updatedAt: 0 });

const ids = (list: Category[]) => list.map((c) => c.id);

describe("category order", () => {
  it("reads in the arranged order", () => {
    expect(ids(categoriesInOrder([category("c", 2), category("a", 0), category("b", 1)]))).toEqual(["a", "b", "c"]);
  });

  it("falls back to creation order for categories that were never arranged", () => {
    const untouched = [category("third", 0, 3), category("first", 0, 1), category("second", 0, 2)];
    expect(ids(categoriesInOrder(untouched))).toEqual(["first", "second", "third"]);
  });

  it("moves one place up and one place down", () => {
    const list = [category("a", 0), category("b", 1), category("c", 2)];
    expect(ids(categoriesInOrder(moveCategory(list, "c", -1)))).toEqual(["a", "c", "b"]);
    expect(ids(categoriesInOrder(moveCategory(list, "a", 1)))).toEqual(["b", "a", "c"]);
  });

  it("stays put at the ends, and ignores a category it doesn't have", () => {
    const list = [category("a", 0), category("b", 1)];
    expect(moveCategory(list, "a", -1)).toBe(list);
    expect(moveCategory(list, "b", 1)).toBe(list);
    expect(moveCategory(list, "ghost", 1)).toBe(list);
  });

  it("keeps the object of every category that did not move", () => {
    const [a, b, c] = [category("a", 0), category("b", 1), category("c", 2)];
    const moved = moveCategory([a, b, c], "c", -1);
    expect(moved.find((x) => x.id === "a")).toBe(a);
    expect(moved.find((x) => x.id === "b")).not.toBe(b);
    expect(moved.find((x) => x.id === "c")).not.toBe(c);
  });

  it("renumbers a list that was never arranged, so the order can be held from then on", () => {
    const list = [category("a", 0, 1), category("b", 0, 2), category("c", 0, 3)];
    expect(categoriesInOrder(moveCategory(list, "c", -1)).map((c) => [c.id, c.sortOrder])).toEqual([["a", 0], ["c", 1], ["b", 2]]);
  });

  it("puts a new category at the end", () => {
    expect(nextSortOrder([])).toBe(0);
    expect(nextSortOrder([category("a", 0), category("b", 4)])).toBe(5);
  });
});

describe("colour for a new category", () => {
  it("picks one nothing is using yet", () => {
    expect(nextCategoryColor([{ color: "blue" }, { color: "teal" }])).toBe("green");
  });

  it("falls back to the least-used once every colour is taken", () => {
    const everyColour = CATEGORY_COLORS.map((color) => ({ color }));
    expect(nextCategoryColor([...everyColour, { color: "blue" }, { color: "green" }])).toBe("teal");
  });

  it("starts at the top of the palette for the first category", () => {
    expect(nextCategoryColor([])).toBe(CATEGORY_COLORS[0]);
  });
});
