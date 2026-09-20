/* The home screen is the add screen: pad, chips and tiles, with today's spending under it.
 * A repeat is two taps (tile, tile), a fresh one is amount → category → Save.
 */
import { useMemo, useState } from "react";
import { deleteExpense, duplicateExpense, saveExpense } from "../../data/actions";
import { totalOf } from "../../data/insights";
import { DEFAULT_METHOD } from "../../data/methods";
import { cycleContaining } from "../../data/months";
import { categoriesByUse, repeatTiles, type RepeatTile } from "../../data/repeats";
import { settingsOf } from "../../data/settings";
import { useDB } from "../../data/store";
import type { Expense } from "../../data/types";
import { formatDate, todayISO } from "../../lib/dates";
import { formatMoney } from "../../lib/format";
import { Button } from "../../ui/Button";
import { FieldLabel, PageHeader, StatGrid } from "../../ui/layout";
import { QuickAmounts } from "../../ui/QuickAmounts";
import { useToast } from "../../ui/Toast";
import { CategoryChips } from "../categories/CategoryChips";
import { CategoryFormSheet } from "../categories/CategoryFormSheet";
import { ExpenseSheet } from "../expenses/ExpenseSheet";
import { draftValue, formatDraft, fromAmount, pressKey, type PadKey } from "./amountDraft";
import { DetailsRow, type ExpenseDetails } from "./DetailsRow";
import { NumberPad } from "./NumberPad";
import { QUICK_STEPS } from "./quickSteps";
import { RepeatTiles } from "./RepeatTiles";
import { TodayList } from "./TodayList";
import styles from "./add.module.css";

const INCOMPLETE_MESSAGE = "Enter an amount and pick a category";

export function AddScreen() {
  const db = useDB();
  const toast = useToast();
  const today = todayISO();

  const freshDetails = (): ExpenseDetails => ({ date: today, method: DEFAULT_METHOD, note: "" });
  const [draft, setDraft] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [details, setDetails] = useState<ExpenseDetails>(freshDetails);
  const [armedKey, setArmedKey] = useState<string | null>(null);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const categories = useMemo(() => categoriesByUse(db.expenses, db.categories, today), [db.expenses, db.categories, today]);
  const categoriesById = useMemo(() => new Map(db.categories.map((c) => [c.id, c])), [db.categories]);
  const tiles = useMemo(() => repeatTiles(db.expenses, db.categories, today), [db.expenses, db.categories, today]);
  const todayExpenses = useMemo(
    () => db.expenses.filter((e) => e.date === today).sort((a, b) => b.createdAt - a.createdAt),
    [db.expenses, today],
  );
  const monthSpent = useMemo(() => {
    const cycle = cycleContaining(today, settingsOf(db).monthStartDay);
    return totalOf(db.expenses.filter((e) => e.date >= cycle.from && e.date <= cycle.to));
  }, [db, today]);

  const reset = () => {
    setDraft("");
    setDetails(freshDetails());
    setArmedKey(null);
  };

  const amount = draftValue(draft);

  const save = (): void => {
    if (amount <= 0 || !categoryId) return toast(INCOMPLETE_MESSAGE, { tone: "error" });
    const id = saveExpense({ ...details, amount, categoryId, note: details.note.trim() }, null);
    reset();
    toast("Expense saved", { action: { label: "Undo", onClick: () => deleteExpense(id) } });
  };

  const press = (key: PadKey) => {
    setDraft((d) => pressKey(d, key));
    setArmedKey(null);
  };

  const step = (next: string) => {
    setDraft(next);
    setArmedKey(null);
  };

  const pickCategory = (id: string) => {
    setCategoryId(id);
    setArmedKey(null);
  };

  /* First tap loads the tile onto the pad, a second tap on the same tile saves it. */
  const pickTile = (tile: RepeatTile) => {
    if (tile.key === armedKey && draftValue(draft) === tile.amount && categoryId === tile.categoryId) {
      const id = saveExpense({ ...details, amount: tile.amount, categoryId: tile.categoryId, note: "" }, null);
      reset();
      toast("Expense saved", { action: { label: "Undo", onClick: () => deleteExpense(id) } });
      return;
    }
    setDraft(fromAmount(tile.amount));
    setCategoryId(tile.categoryId);
    setDetails((d) => ({ ...d, note: "" }));
    setArmedKey(tile.key);
  };

  const repeat = (expense: Expense) => {
    const id = duplicateExpense(expense.id, today);
    if (!id) return;
    toast("Repeated on today", { action: { label: "Undo", onClick: () => deleteExpense(id) } });
  };

  return (
    <div className={styles.screen}>
      <PageHeader title="Add expense" eyebrow={formatDate(today, { weekday: "long", day: "numeric", month: "long" })} />

      <p className={styles.amount} aria-live="polite" aria-label={`Amount ${formatMoney(amount)}`}>
        <span className={styles.currency}>₹</span>
        <span className={draft ? styles.amountValue : styles.amountEmpty}>{formatDraft(draft)}</span>
      </p>

      {tiles.length > 0 && (
        <>
          <FieldLabel>Your usuals</FieldLabel>
          <RepeatTiles tiles={tiles} armedKey={armedKey} onPick={pickTile} />
        </>
      )}

      <FieldLabel>Category</FieldLabel>
      <CategoryChips categories={categories} value={categoryId} onChange={pickCategory} onCreate={() => setNewCategoryOpen(true)} scrollable />

      <FieldLabel>Amount</FieldLabel>
      <QuickAmounts value={draft} onChange={step} steps={QUICK_STEPS} />
      <NumberPad onPress={press} />

      <DetailsRow {...details} onChange={(patch) => setDetails((d) => ({ ...d, ...patch }))} />
      <Button variant="primary" block className={styles.save} onClick={save}>Save expense</Button>

      <div className={styles.summary}>
        <StatGrid
          columns={2}
          stats={[
            { label: "Spent today", value: formatMoney(totalOf(todayExpenses)) },
            { label: "Spent this month", value: formatMoney(monthSpent), tone: "primary" },
          ]}
        />
      </div>

      <TodayList
        expenses={todayExpenses}
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
