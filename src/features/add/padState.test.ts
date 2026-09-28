import { describe, expect, it } from "vitest";
import { addStep, EMPTY_PAD, formatDraft, fromAmount, padDisplay, padExpression, padValue, pressPad, type PadKey, type PadState } from "./padState";

const type = (keys: PadKey[], from: PadState = EMPTY_PAD) => keys.reduce(pressPad, from);

describe("number pad", () => {
  it("builds an amount digit by digit", () => {
    const pad = type(["1", "2", "0"]);
    expect(pad.draft).toBe("120");
    expect(padValue(pad)).toBe(120);
  });

  it("keeps a half-typed decimal until the next digit arrives", () => {
    expect(type(["1", "2", "dot"]).draft).toBe("12.");
    expect(padValue(type(["1", "2", "dot"]))).toBe(12);
    expect(type(["1", "2", "dot", "5"]).draft).toBe("12.5");
  });

  it("allows one decimal point and two paise digits", () => {
    expect(type(["1", "dot", "dot"]).draft).toBe("1.");
    expect(type(["1", "dot", "2", "5", "9"]).draft).toBe("1.25");
  });

  it("starts a fresh number instead of padding a lone zero", () => {
    expect(type(["0", "5"]).draft).toBe("5");
    expect(type(["dot", "5"]).draft).toBe("0.5");
  });

  it("stops at nine whole digits", () => {
    expect(type(["1", "1", "1", "1", "1", "1", "1", "1", "1", "1"]).draft).toBe("111111111");
  });

  it("backspaces to empty and stays there", () => {
    expect(pressPad({ ...EMPTY_PAD, draft: "12" }, "back").draft).toBe("1");
    expect(pressPad({ ...EMPTY_PAD, draft: "1" }, "back").draft).toBe("");
    expect(pressPad(EMPTY_PAD, "back")).toEqual(EMPTY_PAD);
    expect(padValue(EMPTY_PAD)).toBe(0);
  });
});

describe("adding up on the pad", () => {
  it("adds two numbers", () => {
    const pad = type(["1", "2", "0", "plus", "8", "0"]);
    expect(padValue(pad)).toBe(200);
    expect(type(["1", "2", "0", "plus", "8", "0", "equals"]).draft).toBe("200");
  });

  it("subtracts, and keeps going past zero rather than hiding the mistake", () => {
    expect(padValue(type(["2", "0", "0", "minus", "5", "0"]))).toBe(150);
    expect(padValue(type(["1", "0", "0", "minus", "1", "5", "0"]))).toBe(-50);
  });

  it("chains one operator after another", () => {
    expect(padValue(type(["1", "0", "plus", "2", "0", "plus", "3", "0"]))).toBe(60);
    expect(padValue(type(["1", "0", "0", "plus", "5", "0", "minus", "2", "0"]))).toBe(130);
  });

  it("carries the running total when an operator is pressed with nothing typed", () => {
    expect(padValue(type(["5", "0", "plus"]))).toBe(50);
    expect(padValue(type(["5", "0", "plus", "plus"]))).toBe(50);
  });

  it("takes back a pending operator on backspace", () => {
    const pad = type(["5", "0", "plus", "back"]);
    expect(pad.operator).toBeNull();
    expect(pad.draft).toBe("50");
  });

  it("keeps the paise exact through a chain", () => {
    expect(padValue(type(["0", "dot", "1", "plus", "0", "dot", "2"]))).toBe(0.3);
  });

  it("does nothing on equals when no operator is waiting", () => {
    const pad = type(["4", "2"]);
    expect(pressPad(pad, "equals")).toEqual(pad);
  });
});

describe("display", () => {
  it("shows what is being typed, and the running total while an operator waits", () => {
    expect(padDisplay(EMPTY_PAD)).toBe("0");
    expect(padDisplay(type(["1", "2", "3", "4", "5", "6", "7"]))).toBe("12,34,567");
    expect(padDisplay(type(["1", "2", "0", "plus"]))).toBe("120");
    expect(padDisplay(type(["1", "2", "0", "plus", "8"]))).toBe("8");
  });

  it("spells out a pending operator", () => {
    expect(padExpression(EMPTY_PAD)).toBe("");
    expect(padExpression(type(["1", "2", "0", "plus"]))).toBe("120 +");
    expect(padExpression(type(["1", "2", "0", "minus"]))).toBe("120 −");
  });

  it("groups the Indian way and keeps the decimals as typed", () => {
    expect(formatDraft("")).toBe("0");
    expect(formatDraft("1234567")).toBe("12,34,567");
    expect(formatDraft("12.")).toBe("12.");
    expect(formatDraft("12.50")).toBe("12.50");
    expect(formatDraft("-50")).toBe("−50");
  });

  it("loads a saved amount back onto the pad", () => {
    expect(fromAmount(20).draft).toBe("20");
    expect(fromAmount(12.5).draft).toBe("12.5");
    expect(fromAmount(0).draft).toBe("");
  });
});

describe("quick chips", () => {
  it("adds to whatever the pad stands for and settles the operator", () => {
    expect(addStep(EMPTY_PAD, 50).draft).toBe("50");
    expect(padValue(addStep(type(["1", "0", "0"]), 20))).toBe(120);
    expect(addStep(type(["1", "0", "0", "plus", "2", "0"]), 30)).toEqual({ draft: "150", total: 0, operator: null });
  });
});
