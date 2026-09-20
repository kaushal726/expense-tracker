/* Date, payment method and note — the three things that are almost always "today, UPI,
 * nothing". They live behind one quiet line so the pad keeps the screen.
 */
import { useState } from "react";
import { FiChevronRight } from "react-icons/fi";
import { methodLabel, SPEND_METHODS } from "../../data/methods";
import type { SpendMethod } from "../../data/types";
import { formatDayLabel } from "../../lib/dates";
import { Button } from "../../ui/Button";
import { TextAreaField } from "../../ui/Field";
import { Segmented } from "../../ui/Segmented";
import { FieldLabel } from "../../ui/layout";
import { Sheet } from "../../ui/Sheet";
import { DateRow } from "./DateRow";
import styles from "./add.module.css";

export interface ExpenseDetails {
  date: string;
  method: SpendMethod;
  note: string;
}

interface DetailsRowProps extends ExpenseDetails {
  onChange: (patch: Partial<ExpenseDetails>) => void;
}

export function DetailsRow({ date, method, note, onChange }: DetailsRowProps) {
  const [open, setOpen] = useState(false);
  const summary = [formatDayLabel(date), methodLabel(method), note.trim() && "note"].filter(Boolean).join(" · ");

  return (
    <>
      <button type="button" className={styles.details} onClick={() => setOpen(true)}>
        <span className={styles.detailsKey}>Date &amp; payment</span>
        <span className={styles.detailsValue}>
          {summary}
          <FiChevronRight aria-hidden />
        </span>
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Details" footer={<Button variant="primary" block onClick={() => setOpen(false)}>Done</Button>}>
        <FieldLabel>Date</FieldLabel>
        <DateRow value={date} onChange={(next) => onChange({ date: next })} />

        <FieldLabel>Paid by</FieldLabel>
        <Segmented label="Paid by" options={SPEND_METHODS} value={method} onChange={(next) => onChange({ method: next })} className={styles.detailsGap} />

        <TextAreaField label="Note" value={note} onChange={(next) => onChange({ note: next })} optional placeholder="What was it for?" maxLength={80} />
      </Sheet>
    </>
  );
}
