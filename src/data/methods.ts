import type { SpendMethod } from "./types";

export const SPEND_METHODS: { value: SpendMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
];

export const DEFAULT_METHOD: SpendMethod = "upi";

export function methodLabel(method: SpendMethod): string {
  return SPEND_METHODS.find((m) => m.value === method)?.label ?? method;
}
