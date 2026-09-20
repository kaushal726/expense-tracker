import { describe, expect, it } from "vitest";
import { formatMoney, formatMoneyShort, formatPercentChange, formatShare, parseAmount, plural, round2 } from "./format";

describe("money", () => {
  it("groups the Indian way and keeps up to two paise digits", () => {
    expect(formatMoney(1234567)).toBe("₹12,34,567");
    expect(formatMoney(1234.5)).toBe("₹1,234.5");
    expect(formatMoney(0.005)).toBe("₹0.01");
    expect(formatMoney(0)).toBe("₹0");
  });

  it("puts the minus before the rupee sign", () => {
    expect(formatMoney(-300)).toBe("−₹300");
    expect(formatMoneyShort(-1250.6)).toBe("−₹1,251");
  });

  it("drops the paise from headline figures", () => {
    expect(formatMoneyShort(1234.5)).toBe("₹1,235");
    expect(formatMoneyShort(0)).toBe("₹0");
  });

  it("rounds to paise, and treats junk as zero", () => {
    expect(round2(10.005)).toBe(10.01);
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(Number.NaN)).toBe(0);
    expect(round2("abc" as unknown as number)).toBe(0);
  });

  it("parses typed amounts, commas and all", () => {
    expect(parseAmount("1,200.50")).toBe(1200.5);
    expect(parseAmount(" 90 ")).toBe(90);
    expect(parseAmount("")).toBe(0);
    expect(parseAmount("abc")).toBe(0);
  });
});

describe("percentages", () => {
  it("always shows which way a change went", () => {
    expect(formatPercentChange(12.34)).toBe("+12.3%");
    expect(formatPercentChange(-8)).toBe("−8%");
    expect(formatPercentChange(0)).toBe("0%");
  });

  it("writes a share without a sign", () => {
    expect(formatShare(33.333)).toBe("33.3%");
    expect(formatShare(100)).toBe("100%");
  });
});

describe("text helpers", () => {
  it("pluralises counts", () => {
    expect(plural(1, "expense")).toBe("1 expense");
    expect(plural(0, "expense")).toBe("0 expenses");
    expect(plural(3, "day")).toBe("3 days");
    expect(plural(2, "category", "categories")).toBe("2 categories");
    expect(plural(1, "category", "categories")).toBe("1 category");
  });
});
