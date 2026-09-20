import { describe, expect, it } from "vitest";
import { stampChanges } from "./changes";
import { emptyDB } from "./seed";
import type { Category } from "./types";

const category = (id: string, name: string): Category => ({ id, name, icon: "tag", color: "slate", monthlyBudget: 0, createdAt: 0, updatedAt: 0 });

describe("stampChanges", () => {
  it("stamps only records whose reference changed, and reports deletions", () => {
    const prev = { ...emptyDB(), categories: [category("a", "Food"), category("b", "Travel"), category("c", "Bills")] };
    const [first, second, third] = prev.categories;
    const draft = { ...prev, categories: [first, { ...second, name: "Commute" }] };
    const { next, changes } = stampChanges(prev, draft, 1234);

    expect(changes.categories?.upserts.map((r) => [r.id, r.updatedAt])).toEqual([[second.id, 1234]]);
    expect(changes.categories?.deletes).toEqual([third.id]);
    expect(next.categories[0]).toBe(first);
    expect(next.expenses).toBe(prev.expenses);
    expect(changes.expenses).toBeUndefined();
  });
});
