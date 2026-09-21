/* Payment method and note — almost always "UPI, nothing", so they live behind one quiet
 * line and the pad keeps the screen. The date has its own control at the top.
 */
import { useState } from "react";
import { FiChevronRight } from "react-icons/fi";
import { methodLabel, SPEND_METHODS } from "../../data/methods";
import type { SpendMethod } from "../../data/types";
import { Button } from "../../ui/Button";
import { TextAreaField } from "../../ui/Field";
import { Segmented } from "../../ui/Segmented";
import { FieldLabel } from "../../ui/layout";
import { Sheet } from "../../ui/Sheet";
import styles from "./add.module.css";

export interface ExpenseDetails {
  date: string;
  method: SpendMethod;
  note: string;
}

interface DetailsRowProps {
  method: SpendMethod;
  note: string;
  onChange: (patch: Partial<ExpenseDetails>) => void;
}

export function DetailsRow({ method, note, onChange }: DetailsRowProps) {
  const [open, setOpen] = useState(false);
  const summary = [methodLabel(method), note.trim() && "note"].filter(Boolean).join(" · ");

  return (
    <>
      <button type="button" className={styles.details} onClick={() => setOpen(true)}>
        <span className={styles.detailsKey}>Payment &amp; note</span>
        <span className={styles.detailsValue}>
          {summary}
          <FiChevronRight aria-hidden />
        </span>
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Payment & note" footer={<Button variant="primary" block onClick={() => setOpen(false)}>Done</Button>}>
        <FieldLabel>Paid by</FieldLabel>
        <Segmented label="Paid by" options={SPEND_METHODS} value={method} onChange={(next) => onChange({ method: next })} className={styles.detailsGap} />

        <TextAreaField label="Note" value={note} onChange={(next) => onChange({ note: next })} optional placeholder="What was it for?" maxLength={80} />
      </Sheet>
    </>
  );
}
