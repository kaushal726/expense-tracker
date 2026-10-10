/* How many months a payment covers.
 *
 * Nearly everything is one month, so the control opens there and says nothing. Any other
 * choice spells out what it does to the monthly totals, because that is the whole point
 * of it: a six-month recharge should cost a sixth a month, not everything in one.
 */
import {
  NO_SPREAD, perCycleCostOf, spreadEndsAt, spreadMonthsOf, spreadStartsAt, SPREAD_CHOICES,
  type SpreadInput,
} from "../../data/spread";
import { formatDate } from "../../lib/dates";
import { formatMoney } from "../../lib/format";
import { Segmented } from "../../ui/Segmented";
import { FieldLabel } from "../../ui/layout";
import styles from "./expenses.module.css";

interface SpreadFieldProps {
  /** The payment as the form has it so far, amount and date included, so the note under
   *  the control can show what this choice actually costs a month. */
  value: SpreadInput;
  monthStartDay: number;
  onChange: (months: number) => void;
}

const OPTIONS = SPREAD_CHOICES.map((months) => ({ value: String(months), label: String(months) }));

const monthOf = (iso: string) => formatDate(iso, { month: "short", year: "numeric" });

export function SpreadField({ value, monthStartDay, onChange }: SpreadFieldProps) {
  const months = spreadMonthsOf(value);
  const perMonth = perCycleCostOf(value);
  const first = spreadStartsAt(value, monthStartDay);
  const last = spreadEndsAt(value, monthStartDay);
  const span = `${monthOf(first.from)} to ${monthOf(last.from)}`;

  return (
    <>
      <FieldLabel>Spread the cost over (months)</FieldLabel>
      <Segmented
        label="Spread the cost over, in months"
        options={OPTIONS}
        value={String(months)}
        onChange={(next) => onChange(Number(next))}
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
