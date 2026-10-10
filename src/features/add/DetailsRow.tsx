/* Payment method, note, and how many months the payment covers — almost always "UPI,
 * nothing, one month", so they live behind one quiet line and the pad keeps the screen.
 * The date has its own control at the top.
 */
import { useState } from "react";
import { FiChevronRight } from "react-icons/fi";
import { methodLabel, SPEND_METHODS } from "../../data/methods";
import { NO_SPREAD } from "../../data/spread";
import type { SpendMethod } from "../../data/types";
import { plural } from "../../lib/format";
import { Button } from "../../ui/Button";
import { TextAreaField } from "../../ui/Field";
import { Segmented } from "../../ui/Segmented";
import { FieldLabel } from "../../ui/layout";
import { Sheet } from "../../ui/Sheet";
import { SpreadField } from "../expenses/SpreadField";
import styles from "./add.module.css";

export interface ExpenseDetails {
  date: string;
  method: SpendMethod;
  note: string;
  spreadMonths: number;
}

interface DetailsRowProps extends Pick<ExpenseDetails, "date" | "method" | "note" | "spreadMonths"> {
  /** What the pad has so far, so the spread control can say what it costs a month. */
  amount: number;
  monthStartDay: number;
  onChange: (patch: Partial<ExpenseDetails>) => void;
}

export function DetailsRow({ date, method, note, spreadMonths, amount, monthStartDay, onChange }: DetailsRowProps) {
  const [open, setOpen] = useState(false);
  const summary = [
    methodLabel(method),
    note.trim() && "note",
    spreadMonths > NO_SPREAD && plural(spreadMonths, "month"),
  ].filter(Boolean).join(" · ");

  return (
    <>
      <button type="button" className={styles.details} onClick={() => setOpen(true)}>
        <span className={styles.detailsKey}>Details</span>
        <span className={styles.detailsValue}>
          {summary}
          <FiChevronRight aria-hidden />
        </span>
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Details" footer={<Button variant="primary" block onClick={() => setOpen(false)}>Done</Button>}>
        <FieldLabel>Paid by</FieldLabel>
        <Segmented label="Paid by" options={SPEND_METHODS} value={method} onChange={(next) => onChange({ method: next })} className={styles.detailsGap} />

        <TextAreaField label="Note" value={note} onChange={(next) => onChange({ note: next })} optional placeholder="What was it for?" maxLength={80} />

        <div className={styles.detailsGap} />
        <SpreadField
          value={{ date, amount, spreadMonths }}
          monthStartDay={monthStartDay}
          onChange={(months) => onChange({ spreadMonths: months })}
        />
      </Sheet>
    </>
  );
}
