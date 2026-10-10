/* Payments that buy more than one month — a six-month recharge, a yearly subscription.
 *
 * The money leaves the pocket on one day, but the cost belongs to every cycle it covers.
 * One record holds the whole payment and the split is worked out on the way out, so
 * changing "spread over" — or the month start day — re-attributes everything at once and
 * nothing stored can go stale.
 *
 * Every screen reads one of two views on purpose:
 *   - cash, the record itself: what left the pocket, in full, on the day it went. The
 *     expense row, the day list, the biggest payments, History's day totals.
 *   - cost, through costsIn(): the share belonging to the window being looked at. Every
 *     total, category split, trend, budget and daily limit.
 *
 * With nothing spread the two views are identical, down to the object references, so an
 * app that never uses this behaves exactly as it did before.
 */
import { isWithin } from "../lib/dates";
import { round2 } from "../lib/format";
import { cycleContaining, shiftCycle, type Span } from "./months";
import type { DateRange } from "./periods";
import type { Expense } from "./types";

/** An ordinary expense: the whole cost lands in the cycle it was paid in. */
export const NO_SPREAD = 1;
/** Ten years of cycles is past anything real, and it keeps the loop below bounded. */
export const MAX_SPREAD_MONTHS = 120;

/** What the form offers; any count in range still loads and saves. */
export const SPREAD_CHOICES = [1, 3, 6, 12] as const;

/** All the split depends on, so a form can preview a payment it has not saved yet. */
export type SpreadInput = Pick<Expense, "date" | "amount" | "spreadMonths">;

export function clampSpreadMonths(months: number): number {
  const whole = Math.floor(Number(months) || NO_SPREAD);
  return Math.min(MAX_SPREAD_MONTHS, Math.max(NO_SPREAD, whole));
}

/** Records saved before the field existed don't carry it, so never read it raw. */
export function spreadMonthsOf(expense: SpreadInput): number {
  return clampSpreadMonths(expense.spreadMonths);
}

export function isSpread(expense: SpreadInput): boolean {
  return spreadMonthsOf(expense) > NO_SPREAD;
}

export interface SpreadShare {
  /** The cycle this share belongs to. */
  cycle: Span;
  /** The day the share is filed under: the day it was paid for the cycle it was paid in,
   *  and the first day of the cycle for the ones carried forward, which have no day of
   *  their own. */
  date: string;
  amount: number;
  /** 1 for the cycle it was paid in, counting up from there. */
  index: number;
  /** How many cycles in all — 1 for an ordinary expense. */
  of: number;
}

/** The amount split across the cycles it covers. The shares always add back up to the
 *  amount, to the paisa: the last cycle carries whatever the division left over. */
export function sharesOf(expense: SpreadInput, monthStartDay: number): SpreadShare[] {
  const of = spreadMonthsOf(expense);
  const amount = round2(Number(expense.amount) || 0);
  const even = round2(amount / of);
  const shares: SpreadShare[] = [];
  let cycle = cycleContaining(expense.date, monthStartDay);
  let left = amount;
  for (let index = 1; index <= of; index += 1) {
    const share = index === of ? round2(left) : even;
    shares.push({ cycle, date: index === 1 ? expense.date : cycle.from, amount: share, index, of });
    left = round2(left - share);
    cycle = shiftCycle(cycle, monthStartDay, 1);
  }
  return shares;
}

/** What one cycle of this payment costs — the figure the row and the form show. */
export function perCycleCostOf(expense: SpreadInput): number {
  const months = spreadMonthsOf(expense);
  const amount = round2(Number(expense.amount) || 0);
  return months === NO_SPREAD ? amount : round2(amount / months);
}

/** The first and last cycles the payment covers — what the form says it buys. */
export function spreadStartsAt(expense: SpreadInput, monthStartDay: number): Span {
  return cycleContaining(expense.date, monthStartDay);
}

/** The last cycle the payment still covers. */
export function spreadEndsAt(expense: SpreadInput, monthStartDay: number): Span {
  const shares = sharesOf(expense, monthStartDay);
  return shares[shares.length - 1].cycle;
}

/** The expenses as the range *costs* them: one entry per share falling inside it, carrying
 *  that cycle's amount and filed under the day the share belongs to.
 *
 *  An ordinary expense comes back untouched — the same object, so nothing downstream has
 *  to re-render. Entries come back marked unspread, which makes this safe to apply again
 *  over a narrower window: a share is never split twice.
 */
export function costsIn(expenses: Expense[], range: DateRange, monthStartDay: number): Expense[] {
  const costs: Expense[] = [];
  expenses.forEach((expense) => {
    if (!isSpread(expense)) {
      if (isWithin(expense.date, range.from, range.to)) costs.push(expense);
      return;
    }
    sharesOf(expense, monthStartDay).forEach((share) => {
      if (!isWithin(share.date, range.from, range.to)) return;
      costs.push({ ...expense, date: share.date, amount: share.amount, spreadMonths: NO_SPREAD });
    });
  });
  return costs;
}

/** The same costs, but only the ones a day actually saw money for: each payment on the
 *  day it was made, charged what it costs the month it was made in.
 *
 *  Cost carried in from an earlier payment has no day of its own, so it is left out
 *  rather than parked on the 1st, where it would paint a calendar square and head a
 *  "busiest days" list for a day nothing happened on. carriedInto() accounts for it
 *  instead, and the summary says so in words. */
export function dayCostsIn(expenses: Expense[], range: DateRange): Expense[] {
  return expenses
    .filter((e) => isWithin(e.date, range.from, range.to))
    .map((e) => (isSpread(e) ? { ...e, amount: perCycleCostOf(e), spreadMonths: NO_SPREAD } : e));
}

/** How much of what was paid on a day counts against the cycle that day falls in — the
 *  day's total until something spread was paid that day. */
export function dayCostOf(expenses: SpreadInput[], date: string): number {
  const paid = expenses.filter((e) => e.date === date);
  return round2(paid.reduce((sum, e) => sum + perCycleCostOf(e), 0));
}

export interface CycleCostSplit {
  /** What the cycle already owed before today, cost carried in from earlier payments and
   *  all. */
  before: number;
  /** What today added, counted the way the cycle has to count it. */
  today: number;
}

/** The cycle's cost either side of today. Cost carried in from an earlier payment counts
 *  as owed before today however the calendar files it — it was not spent today. */
export function cycleCostSplit(expenses: SpreadInput[], cycle: Span, today: string, monthStartDay: number): CycleCostSplit {
  let before = 0;
  let paidToday = 0;
  expenses.forEach((expense) => {
    sharesOf(expense, monthStartDay).forEach((share) => {
      if (share.cycle.from !== cycle.from) return;
      if (share.index === 1 && expense.date === today) paidToday += share.amount;
      else before += share.amount;
    });
  });
  return { before: round2(before), today: round2(paidToday) };
}

/** Of what a range costs, how much was paid before the range even started — the figure
 *  that explains a total bigger than the entries inside it. */
export function carriedInto(expenses: SpreadInput[], range: DateRange, monthStartDay: number): number {
  if (!range.from) return 0;
  let carried = 0;
  expenses.forEach((expense) => {
    if (!isSpread(expense) || expense.date >= range.from) return;
    sharesOf(expense, monthStartDay).forEach((share) => {
      if (isWithin(share.date, range.from, range.to)) carried += share.amount;
    });
  });
  return round2(carried);
}

/** Of what was paid inside a range, how much belongs to cycles after it — what this
 *  period has already bought for later. */
export function committedAhead(expenses: SpreadInput[], range: DateRange, monthStartDay: number): number {
  if (!range.to) return 0;
  let ahead = 0;
  expenses.forEach((expense) => {
    if (!isSpread(expense) || !isWithin(expense.date, range.from, range.to)) return;
    sharesOf(expense, monthStartDay).forEach((share) => {
      if (share.date > range.to) ahead += share.amount;
    });
  });
  return round2(ahead);
}
