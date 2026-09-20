/* Every entry, newest first, with the filters kept in the URL so Insights can link here. */
import { useMemo, useState } from "react";
import { FiInbox, FiSearch } from "react-icons/fi";
import { setQuery, type Route } from "../../app/router";
import { duplicateExpense, deleteExpense } from "../../data/actions";
import { groupByDay } from "../../data/grouping";
import { inRange, totalOf, UNCATEGORISED_FILTER, UNCATEGORISED_NAME } from "../../data/insights";
import { methodLabel } from "../../data/methods";
import { PERIOD_PRESETS } from "../../data/periods";
import { settingsOf } from "../../data/settings";
import { useDB } from "../../data/store";
import type { Category, Expense } from "../../data/types";
import { formatDayLabel, todayISO } from "../../lib/dates";
import { formatMoney, plural } from "../../lib/format";
import { EmptyState } from "../../ui/feedback";
import { FilterBar } from "../../ui/FilterBar";
import { PageHeader } from "../../ui/layout";
import type { Option } from "../../ui/OptionList";
import { useToast } from "../../ui/Toast";
import { ExpenseRow } from "../expenses/ExpenseRow";
import { ExpenseSheet } from "../expenses/ExpenseSheet";
import { PeriodChips } from "../period/PeriodChips";
import { usePeriodFilter } from "../period/usePeriodFilter";
import styles from "./history.module.css";

const ALL_CATEGORIES = "all";

function matches(expense: Expense, category: Category | undefined, query: string): boolean {
  if (!query) return true;
  return [expense.note, category?.name ?? UNCATEGORISED_NAME, methodLabel(expense.method), String(expense.amount)]
    .some((field) => field.toLowerCase().includes(query));
}

export function HistoryScreen({ route }: { route: Route }) {
  const db = useDB();
  const toast = useToast();
  const today = todayISO();
  const settings = settingsOf(db);
  const period = usePeriodFilter(route, settings.monthStartDay, PERIOD_PRESETS);
  const [editing, setEditing] = useState<Expense | null>(null);

  const categoryId = route.query.get("category") ?? ALL_CATEGORIES;
  const search = route.query.get("q") ?? "";
  const categoriesById = useMemo(() => new Map(db.categories.map((c) => [c.id, c])), [db.categories]);

  const inPeriod = useMemo(() => inRange(db.expenses, period.range), [db.expenses, period.range]);
  const inCategory = useMemo(() => {
    if (categoryId === ALL_CATEGORIES) return inPeriod;
    if (categoryId === UNCATEGORISED_FILTER) return inPeriod.filter((e) => !categoriesById.has(e.categoryId));
    return inPeriod.filter((e) => e.categoryId === categoryId);
  }, [inPeriod, categoryId, categoriesById]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? inCategory.filter((e) => matches(e, categoriesById.get(e.categoryId), query)) : inCategory;
  }, [inCategory, search, categoriesById]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);
  const total = totalOf(filtered);

  const categoryOptions: Option[] = useMemo(() => {
    const orphans = inPeriod.filter((e) => !categoriesById.has(e.categoryId)).length;
    return [
      { value: ALL_CATEGORIES, label: "All categories", count: inPeriod.length },
      ...db.categories.map((c) => ({ value: c.id, label: c.name, count: inPeriod.filter((e) => e.categoryId === c.id).length })),
      ...(orphans ? [{ value: UNCATEGORISED_FILTER, label: UNCATEGORISED_NAME, count: orphans }] : []),
    ];
  }, [db.categories, inPeriod, categoriesById]);

  const repeat = (expense: Expense) => {
    const id = duplicateExpense(expense.id, today);
    if (!id) return;
    toast("Repeated on today", { action: { label: "Undo", onClick: () => deleteExpense(id) } });
  };

  return (
    <>
      <PageHeader
        title="History"
        eyebrow={period.rangeLabel}
        actions={<span className={styles.total}>{formatMoney(total)}</span>}
      />
      <PeriodChips filter={period} presets={PERIOD_PRESETS} />
      <FilterBar
        className={styles.filters}
        search={{ value: search, onChange: (q) => setQuery(route, { q: q || null }), placeholder: "Search notes, categories, amounts" }}
        groups={[{
          key: "category",
          label: "Category",
          value: categoryId,
          defaultValue: ALL_CATEGORIES,
          options: categoryOptions,
          onChange: (value) => setQuery(route, { category: value === ALL_CATEGORIES ? null : value }),
        }]}
      />

      {groups.length ? (
        <div className={styles.groups}>
          {groups.map((group) => (
            <section key={group.date}>
              <header className={styles.dayHeader}>
                <span className={styles.dayLabel}>{formatDayLabel(group.date)}</span>
                <span className={styles.dayTotals}>
                  <b>{formatMoney(group.total)}</b>
                  <small>{formatMoney(group.runningTotal)} to date</small>
                </span>
              </header>
              <div className={styles.dayList}>
                {group.expenses.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    category={categoriesById.get(expense.categoryId)}
                    onOpen={() => setEditing(expense)}
                    onRepeat={() => repeat(expense)}
                  />
                ))}
              </div>
            </section>
          ))}
          <p className={styles.footNote}>{plural(filtered.length, "expense")} · press and hold one to repeat it on today</p>
        </div>
      ) : (
        <EmptyState
          icon={inPeriod.length ? <FiSearch /> : <FiInbox />}
          title={inPeriod.length ? "Nothing matches those filters" : "Nothing spent in this period"}
          message={inPeriod.length ? "Try a wider period, or clear the search." : "Add an expense and it will show up here."}
        />
      )}

      <ExpenseSheet open={editing !== null} onClose={() => setEditing(null)} expense={editing} />
    </>
  );
}
