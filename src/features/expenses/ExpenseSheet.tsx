import { useMemo, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { deleteExpense, saveExpense } from "../../data/actions";
import { SPEND_METHODS } from "../../data/methods";
import { categoriesByUse } from "../../data/repeats";
import { useDB } from "../../data/store";
import { todayISO } from "../../lib/dates";
import { parseAmount } from "../../lib/format";
import type { Expense, SpendMethod } from "../../data/types";
import { Button, IconButton } from "../../ui/Button";
import { useConfirm } from "../../ui/Confirm";
import { TextAreaField, TextField } from "../../ui/Field";
import { QuickAmounts } from "../../ui/QuickAmounts";
import { Segmented } from "../../ui/Segmented";
import { Sheet } from "../../ui/Sheet";
import { useToast } from "../../ui/Toast";
import { QUICK_STEPS } from "../add/quickSteps";
import { CategoryChips } from "../categories/CategoryChips";
import styles from "./expenses.module.css";

interface ExpenseSheetProps {
  open: boolean;
  onClose: () => void;
  expense: Expense | null;
}

/** Edit or delete one entry. New ones are added from the Add screen, not here. */
export function ExpenseSheet({ open, onClose, expense }: ExpenseSheetProps) {
  return open && expense ? <ExpenseForm key={expense.id} expense={expense} onClose={onClose} /> : null;
}

function ExpenseForm({ expense, onClose }: { expense: Expense; onClose: () => void }) {
  const db = useDB();
  const confirm = useConfirm();
  const toast = useToast();
  const categories = useMemo(() => categoriesByUse(db.expenses, db.categories, todayISO()), [db.expenses, db.categories]);

  const [amount, setAmount] = useState(String(expense.amount));
  const [categoryId, setCategoryId] = useState(expense.categoryId);
  const [date, setDate] = useState(expense.date);
  const [method, setMethod] = useState<SpendMethod>(expense.method);
  const [note, setNote] = useState(expense.note);
  const [error, setError] = useState("");

  const submit = () => {
    const value = parseAmount(amount);
    if (value <= 0) return setError("Enter how much you spent");
    saveExpense({ date, amount: value, categoryId, note: note.trim(), method }, expense.id);
    toast("Expense updated");
    onClose();
  };

  const remove = async () => {
    const ok = await confirm({ title: "Delete this expense?", message: "It comes off every total straight away.", confirmLabel: "Delete", danger: true });
    if (!ok) return;
    deleteExpense(expense.id);
    toast("Expense deleted");
    onClose();
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Edit expense"
      size="full"
      headerAction={<IconButton label="Delete expense" icon={<FiTrash2 />} bare onClick={() => void remove()} />}
      footer={<Button variant="primary" block onClick={submit}>Save</Button>}
    >
      <TextField
        label="Amount"
        value={amount}
        onChange={(v) => { setAmount(v.replace(/[^\d.]/g, "")); setError(""); }}
        error={error}
        prefix="₹"
        inputMode="decimal"
        autoFocus
      />
      <QuickAmounts value={amount} onChange={setAmount} steps={QUICK_STEPS} />

      <p className={styles.formLabel}>Category</p>
      <CategoryChips categories={categories} value={categoryId} onChange={setCategoryId} />

      <div className={styles.formGap} />
      <TextField label="Date" type="date" value={date} onChange={setDate} max={todayISO()} />

      <p className={styles.formLabel}>Paid by</p>
      <Segmented label="Paid by" options={SPEND_METHODS} value={method} onChange={setMethod} className={styles.formGap} />

      <TextAreaField label="Note" value={note} onChange={setNote} optional placeholder="What was it for?" />
    </Sheet>
  );
}
