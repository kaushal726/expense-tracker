/* What the number pad is holding. A draft is the digits as typed ("12", "12.", "12.50"),
 * never a number, so a half-typed decimal survives the next key press.
 */
import { round2 } from "../../lib/format";

const LOCALE = "en-IN";
const MAX_INTEGER_DIGITS = 9;
const MAX_DECIMALS = 2;

export const PAD_DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"] as const;
export type PadDigit = (typeof PAD_DIGITS)[number];
export type PadKey = PadDigit | "dot" | "back";

export function pressKey(draft: string, key: PadKey): string {
  if (key === "back") return draft.slice(0, -1);
  if (key === "dot") return draft.includes(".") ? draft : `${draft || "0"}.`;
  return appendDigit(draft, key);
}

function appendDigit(draft: string, digit: PadDigit): string {
  const [whole, decimals] = draft.split(".");
  if (decimals !== undefined) return decimals.length >= MAX_DECIMALS ? draft : `${draft}${digit}`;
  if (draft === "0") return digit;
  return whole.length >= MAX_INTEGER_DIGITS ? draft : `${draft}${digit}`;
}

export function draftValue(draft: string): number {
  const n = Number(draft);
  return Number.isFinite(n) ? round2(n) : 0;
}

export function fromAmount(amount: number): string {
  return amount > 0 ? String(round2(amount)) : "";
}

/** Grouped for the big display, keeping the decimals exactly as typed. */
export function formatDraft(draft: string): string {
  if (!draft) return "0";
  const [whole, decimals] = draft.split(".");
  const grouped = (Number(whole) || 0).toLocaleString(LOCALE);
  return decimals === undefined ? grouped : `${grouped}.${decimals}`;
}
