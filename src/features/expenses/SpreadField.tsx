/* How many months a payment covers.
 *
 * Nearly everything is one month, so the control opens there and says nothing. Any other
 * choice spells out what it does to the monthly totals, because that is the whole point
 * of it: a six-month recharge should cost a sixth a month, not everything in one.
 *
 * The four buttons are shortcuts, not the whole range — the box beside them takes any
 * count, so an eighteen-month plan is typed rather than rounded to the nearest preset.
 */
import { useEffect, useState } from "react";
import {
  clampSpreadMonths, MAX_SPREAD_MONTHS, NO_SPREAD, perCycleCostOf, spreadEndsAt,
  spreadMonthsOf, spreadStartsAt, SPREAD_CHOICES, type SpreadInput,
} from "../../data/spread";
import { formatDate } from "../../lib/dates";
import { formatMoney } from "../../lib/format";
import { TextField } from "../../ui/Field";
import { Segmented } from "../../ui/Segmented";
import { FieldLabel } from "../../ui/layout";
import styles from "./expenses.module.css";

interface SpreadFieldProps {
  /** The payment as the form has it so far, amount and date included, so the note under
   *  the control can say what this choice actually costs a month. */
  value: SpreadInput;
  monthStartDay: number;
  onChange: (months: number) => void;
}

const OPTIONS = SPREAD_CHOICES.map((months) => ({ value: String(months), label: String(months) }));
/** Three digits is more than MAX_SPREAD_MONTHS needs and stops a pasted essay. */
const MAX_DIGITS = 3;

const monthOf = (iso: string) => formatDate(iso, { month: "short", year: "numeric" });

export function SpreadField({ value, monthStartDay, onChange }: SpreadFieldProps) {
  const months = spreadMonthsOf(value);
  const perMonth = perCycleCostOf(value);
  const first = spreadStartsAt(value, monthStartDay);
  const last = spreadEndsAt(value, monthStartDay);
  const span = `${monthOf(first.from)} to ${monthOf(last.from)}`;

  /* The box keeps its own text so a half-typed or cleared count doesn't snap back under
   * the cursor, and follows the count whenever it settles somewhere else — a preset
   * button, a count past the maximum, or the form being reset after a save. */
  const [typed, setTyped] = useState(String(months));
  useEffect(() => setTyped(String(months)), [months]);

  const type = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, MAX_DIGITS);
    setTyped(digits);
    if (Number(digits) >= NO_SPREAD) onChange(clampSpreadMonths(Number(digits)));
  };

  return (
    <>
      <FieldLabel>Spread the cost over (months)</FieldLabel>
      <Segmented
        label="Spread the cost over, in months"
        options={OPTIONS}
        value={String(months)}
        onChange={(next) => onChange(Number(next))}
        className={styles.spreadChoices}
      />
      <TextField
        label="Months"
        value={typed}
        onChange={type}
        onBlur={() => setTyped(String(months))}
        inputMode="numeric"
        max={MAX_SPREAD_MONTHS}
        className={styles.spreadCount}
      />
      <p className={styles.spreadNote}>
        {months === NO_SPREAD
          ? <>Counts in full against {monthOf(first.from)}.</>
          : perMonth > 0
            ? <><b>{formatMoney(perMonth)} a month</b>, {span}.</>
            : <>Split evenly, {span}.</>}
      </p>
    </>
  );
}
