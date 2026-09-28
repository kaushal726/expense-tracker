/* What the number pad is holding: the digits being typed, plus a running total when a
 * + or − is pending. It is a small calculator, so a bill can be added up on the pad
 * instead of in your head, and it is pure so the arithmetic can be tested on its own.
 */
import { round2 } from "../../lib/format";

const LOCALE = "en-IN";
const MAX_INTEGER_DIGITS = 9;
const MAX_DECIMALS = 2;

export const PAD_DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"] as const;
export type PadDigit = (typeof PAD_DIGITS)[number];
export type Operator = "plus" | "minus";
export type PadKey = PadDigit | "dot" | "back" | "clear" | Operator | "equals";

export interface PadState {
  /** The number being typed right now, as typed ("12", "12.", "12.50"). */
  draft: string;
  /** What is already added up, waiting for the pending operator. */
  total: number;
  operator: Operator | null;
}

export const EMPTY_PAD: PadState = { draft: "", total: 0, operator: null };

const SIGN: Record<Operator, number> = { plus: 1, minus: -1 };
export const OPERATOR_LABELS: Record<Operator, string> = { plus: "+", minus: "−" };

function draftValue(draft: string): number {
  const n = Number(draft);
  return Number.isFinite(n) ? round2(n) : 0;
}

/** The amount the pad currently stands for, pending operator applied. */
export function padValue(state: PadState): number {
  if (!state.operator) return draftValue(state.draft);
  if (!state.draft) return state.total;
  return round2(state.total + SIGN[state.operator] * draftValue(state.draft));
}

export function pressPad(state: PadState, key: PadKey): PadState {
  switch (key) {
    case "clear":
      return EMPTY_PAD;
    case "plus":
    case "minus":
      return { draft: "", total: padValue(state), operator: key };
    case "equals":
      return state.operator ? { ...EMPTY_PAD, draft: numberToDraft(padValue(state)) } : state;
    case "back":
      // With nothing typed yet, backspace takes back the pending operator.
      return state.draft ? { ...state, draft: state.draft.slice(0, -1) } : { ...EMPTY_PAD, draft: numberToDraft(state.total) };
    case "dot":
      return { ...state, draft: state.draft.includes(".") ? state.draft : `${state.draft || "0"}.` };
    default:
      return { ...state, draft: appendDigit(state.draft, key) };
  }
}

function appendDigit(draft: string, digit: PadDigit): string {
  const [whole, decimals] = draft.split(".");
  if (decimals !== undefined) return decimals.length >= MAX_DECIMALS ? draft : `${draft}${digit}`;
  if (draft === "0") return digit;
  return whole.length >= MAX_INTEGER_DIGITS ? draft : `${draft}${digit}`;
}

/** A quick chip: adds to whatever the pad stands for and settles any pending operator. */
export function addStep(state: PadState, step: number): PadState {
  return { ...EMPTY_PAD, draft: numberToDraft(round2(padValue(state) + step)) };
}

export function fromAmount(amount: number): PadState {
  return { ...EMPTY_PAD, draft: numberToDraft(amount) };
}

function numberToDraft(value: number): string {
  return value ? String(round2(value)) : "";
}

/** The big number: what is being typed, or the running total while an operator waits. */
export function padDisplay(state: PadState): string {
  if (state.draft) return formatDraft(state.draft);
  return state.operator ? formatDraft(numberToDraft(state.total)) : "0";
}

/** "1,200 +" above the amount, so a pending operator is never invisible. */
export function padExpression(state: PadState): string {
  return state.operator ? `${formatDraft(numberToDraft(state.total))} ${OPERATOR_LABELS[state.operator]}` : "";
}

/** Grouped for the display, keeping the decimals exactly as typed. */
export function formatDraft(draft: string): string {
  if (!draft) return "0";
  const negative = draft.startsWith("-");
  const [whole, decimals] = (negative ? draft.slice(1) : draft).split(".");
  const grouped = (Number(whole) || 0).toLocaleString(LOCALE);
  return `${negative ? "−" : ""}${grouped}${decimals === undefined ? "" : `.${decimals}`}`;
}
