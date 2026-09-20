import { describe, expect, it } from "vitest";
import { parseLocation } from "./parseLocation";

describe("parseLocation", () => {
  it("reads the path under the GitHub Pages base", () => {
    const route = parseLocation("/expense-tracker/history/abc", "?category=food", "/expense-tracker/");
    expect(route.path).toEqual(["history", "abc"]);
    expect(route.query.get("category")).toBe("food");
  });

  it("treats the base with or without a trailing slash as the home screen", () => {
    expect(parseLocation("/expense-tracker/", "", "/expense-tracker/").path).toEqual([]);
    expect(parseLocation("/expense-tracker", "", "/expense-tracker/").path).toEqual([]);
  });

  it("works at the root base used in development", () => {
    expect(parseLocation("/more/sync", "", "/").path).toEqual(["more", "sync"]);
  });

  it("decodes path segments", () => {
    expect(parseLocation("/history/a%20b", "", "/").path).toEqual(["history", "a b"]);
  });
});
