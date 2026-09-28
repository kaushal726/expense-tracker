/* The home screen is the add screen: a date, a calculator pad and the category chips,
 * with that day's spending under it. An expense is category → amount → Save.
 */
import { useMemo, useState } from "react";
import { deleteExpense, duplicateExpense, saveExpense } from "../../data/actions";
import { totalOf } from "../../data/insights";
import { DEFAULT_METHOD } from "../../data/methods";
import { cycleContaining } from "../../data/months";
import { categoriesByUse } from "../../data/repeats";
import { settingsOf } from "../../data/settings";
import { useDB } from "../../data/store";
import type { Expense } from "../../data/types";
import { todayISO } from "../../lib/dates";
import { formatMoney } from "../../lib/format";
import { Button } from "../../ui/Button";
import { FieldLabel, StatGrid } from "../../ui/layout";
import { useToast } from "../../ui/Toast";
import { CategoryChips } from "../categories/CategoryChips";
import { CategoryFormSheet } from "../categories/CategoryFormSheet";
import { ExpenseSheet } from "../expenses/ExpenseSheet";
import { EMPTY_PAD, padDisplay, padExpression, padValue, pressPad, type PadKey } from "./padState";
import { DateSwitcher } from "./DateSwitcher";
import { DetailsRow, type ExpenseDetails } from "./DetailsRow";
import { NumberPad } from "./NumberPad";
import { DayList } from "./DayList";
import styles from "./add.module.css";

const INCOMPLETE_MESSAGE = "Enter an amount and pick a category";

export function AddScreen() {
  const db = useDB();
  const toast = useToast();
  const today = todayISO();

  const freshDetails = (): ExpenseDetails => ({ date: today, method: DEFAULT_METHOD, note: "" });
  const [pad, setPad] = useState(EMPTY_PAD);
  const [categoryId, setCategoryId] = useState("");
  const [details, setDetails] = useState<ExpenseDetails>(freshDetails);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const categories = useMemo(() => categoriesByUse(db.expenses, db.categories, today), [db.expenses, db.categories, today]);
  const categoriesById = useMemo(() => new Map(db.categories.map((c) => [c.id, c])), [db.categories]);
  const todayTotal = useMemo(() => totalOf(db.expenses.filter((e) => e.date === today)), [db.expenses, today]);
  /* The list follows the date on the switcher, so an expense backdated to Friday is
   * visible the moment it is saved. */
  const dayExpenses = useMemo(
    () => db.expenses.filter((e) => e.date === details.date).sort((a, b) => b.createdAt - a.createdAt),
    [db.expenses, details.date],
  );
  const monthSpent = useMemo(() => {
    const cycle = cycleContaining(today, settingsOf(db).monthStartDay);
    return totalOf(db.expenses.filter((e) => e.date >= cycle.from && e.date <= cycle.to));
  }, [db, today]);

  const reset = () => {
    setPad(EMPTY_PAD);
    setDetails(freshDetails());
  };

  const amount = padValue(pad);
  const expression = padExpression(pad);

  const save = (): void => {
    if (amount <= 0 || !categoryId) return toast(INCOMPLETE_MESSAGE, { tone: "error" });
    const id = saveExpense({ ...details, amount, categoryId, note: details.note.trim() }, null);
    reset();
    toast("Expense saved", { action: { label: "Undo", onClick: () => deleteExpense(id) } });
  };

  const press = (key: PadKey) => setPad((p) => pressPad(p, key));

  const repeat = (expense: Expense) => {
    const id = duplicateExpense(expense.id, today);
    if (!id) return;
    toast("Repeated on today", { action: { label: "Undo", onClick: () => deleteExpense(id) } });
  };

  return (
    <div className={styles.screen}>
      <h1 className="visually-hidden">Add expense</h1>
      <DateSwitcher value={details.date} onChange={(date) => setDetails((d) => ({ ...d, date }))} />

      <p className={styles.expression} aria-hidden>{expression}</p>
      <p className={styles.amount} aria-live="polite" aria-label={`Amount ${formatMoney(amount)}`}>
        <span className={styles.currency}>₹</span>
        <span className={amount || pad.draft ? styles.amountValue : styles.amountEmpty}>{padDisplay(pad)}</span>
      </p>

      <FieldLabel>Category</FieldLabel>
      <CategoryChips categories={categories} value={categoryId} onChange={setCategoryId} onCreate={() => setNewCategoryOpen(true)} scrollable />

      <NumberPad onPress={press} />

      <DetailsRow method={details.method} note={details.note} onChange={(patch) => setDetails((d) => ({ ...d, ...patch }))} />
      <Button variant="primary" block className={styles.save} onClick={save}>Save expense</Button>

      <div className={styles.summary}>
        <StatGrid
          columns={2}
          stats={[
            { label: "Spent today", value: formatMoney(todayTotal) },
            { label: "Spent this month", value: formatMoney(monthSpent), tone: "primary" },
          ]}
        />
      </div>

      <DayList
        date={details.date}
        expenses={dayExpenses}
        total={totalOf(dayExpenses)}
        categoriesById={categoriesById}
        onOpen={setEditing}
        onRepeat={repeat}
      />

      <CategoryFormSheet
        open={newCategoryOpen}
        onClose={() => setNewCategoryOpen(false)}
        category={null}
        onSaved={setCategoryId}
      />
      <ExpenseSheet open={editing !== null} onClose={() => setEditing(null)} expense={editing} />
    </div>
  );
}
