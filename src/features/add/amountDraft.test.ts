import { describe, expect, it } from "vitest";
import { draftValue, formatDraft, fromAmount, pressKey, type PadKey } from "./amountDraft";

const type = (keys: PadKey[]) => keys.reduce((draft, key) => pressKey(draft, key), "");

describe("number pad", () => {
  it("builds an amount digit by digit", () => {
    expect(type(["1", "2", "0"])).toBe("120");
    expect(draftValue(type(["1", "2", "0"]))).toBe(120);
  });

  it("keeps a half-typed decimal until the next digit arrives", () => {
    expect(type(["1", "2", "dot"])).toBe("12.");
    expect(draftValue("12.")).toBe(12);
    expect(type(["1", "2", "dot", "5"])).toBe("12.5");
  });

  it("allows one decimal point and two paise digits", () => {
    expect(type(["1", "dot", "dot"])).toBe("1.");
    expect(type(["1", "dot", "2", "5", "9"])).toBe("1.25");
  });

  it("starts a fresh number instead of padding a lone zero", () => {
    expect(type(["0", "5"])).toBe("5");
    expect(type(["dot", "5"])).toBe("0.5");
  });

  it("stops at nine whole digits", () => {
    expect(type(["1", "1", "1", "1", "1", "1", "1", "1", "1", "1"])).toBe("111111111");
  });

  it("backspaces to empty and stays there", () => {
    expect(pressKey("12", "back")).toBe("1");
    expect(pressKey("1", "back")).toBe("");
    expect(pressKey("", "back")).toBe("");
    expect(draftValue("")).toBe(0);
  });
});

describe("display", () => {
  it("groups the Indian way and keeps the decimals as typed", () => {
    expect(formatDraft("")).toBe("0");
    expect(formatDraft("1234567")).toBe("12,34,567");
    expect(formatDraft("12.")).toBe("12.");
    expect(formatDraft("12.50")).toBe("12.50");
  });

  it("loads a saved amount back onto the pad", () => {
    expect(fromAmount(20)).toBe("20");
    expect(fromAmount(12.5)).toBe("12.5");
    expect(fromAmount(0)).toBe("");
  });
});
