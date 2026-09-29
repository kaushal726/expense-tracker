/* How heavy a day was, on a four-step scale against the heaviest day on screen. The
 * calendar and the History day bars both read from this, so a day that looks heavy in
 * one looks heavy in the other.
 */
export const HEAT_LEVELS = 4;

/** 0 for a day with nothing on it, then 1–4. */
export function heatLevel(amount: number, max: number): number {
  if (!amount || !max) return 0;
  return Math.min(HEAT_LEVELS, Math.max(1, Math.ceil((amount / max) * HEAT_LEVELS)));
}
