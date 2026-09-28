import { useMemo, useState } from "react";
import { FiArrowDown, FiArrowUp, FiPlus, FiTag } from "react-icons/fi";
import { href } from "../../app/router";
import { categoryUsage, orderedCategories, reorderCategory } from "../../data/actions";
import { cycleContaining } from "../../data/months";
import { settingsOf } from "../../data/settings";
import { useDB } from "../../data/store";
import type { Category } from "../../data/types";
import { todayISO } from "../../lib/dates";
import { formatMoney, formatShare, plural, round2 } from "../../lib/format";
import { Button, IconButton } from "../../ui/Button";
import { EmptyState } from "../../ui/feedback";
import { PageHeader, SectionTitle } from "../../ui/layout";
import { CategoryBadge } from "../categories/CategoryBadge";
import { CategoryFormSheet } from "../categories/CategoryFormSheet";
import styles from "../categories/categories.module.css";

const BACK = { label: "More", href: href("more") };

interface Editing {
  category: Category | null;
  usage: number;
}

export function CategoriesScreen() {
  const db = useDB();
  const [editing, setEditing] = useState<Editing | null>(null);
  const monthStartDay = settingsOf(db).monthStartDay;

  const spentThisMonth = useMemo(() => {
    const cycle = cycleContaining(todayISO(), monthStartDay);
    const totals = new Map<string, number>();
    db.expenses.forEach((e) => {
      if (e.date < cycle.from || e.date > cycle.to) return;
      totals.set(e.categoryId, (totals.get(e.categoryId) ?? 0) + (Number(e.amount) || 0));
    });
    return totals;
  }, [db.expenses, monthStartDay]);

  const ordered = useMemo(() => orderedCategories(db), [db]);

  const detailOf = (category: Category): string => {
    const spent = round2(spentThisMonth.get(category.id) ?? 0);
    const used = category.monthlyBudget ? ` of ${formatMoney(category.monthlyBudget)} · ${formatShare((spent / category.monthlyBudget) * 100)}` : "";
    return `${formatMoney(spent)} this month${used}`;
  };

  return (
    <>
      <PageHeader
        back={BACK}
        title="Categories"
        eyebrow={plural(db.categories.length, "category", "categories")}
        actions={<Button icon={<FiPlus />} onClick={() => setEditing({ category: null, usage: 0 })}>New</Button>}
      />

      {ordered.length ? (
        <>
          <SectionTitle>In this order on the Add screen</SectionTitle>
          <div className={styles.list}>
            {ordered.map((category, index) => (
              <div key={category.id} className={styles.row}>
                <button type="button" className={styles.rowMain} onClick={() => setEditing({ category, usage: categoryUsage(db, category.id) })}>
                  <CategoryBadge icon={category.icon} color={category.color} />
                  <span className={styles.rowText}>
                    <span className={styles.rowName}>{category.name}</span>
                    <span className={styles.rowDetail}>{detailOf(category)}</span>
                  </span>
                </button>
                <span className={styles.rowActions}>
                  <IconButton
                    label={`Move ${category.name} up`}
                    icon={<FiArrowUp />}
                    bare
                    disabled={index === 0}
                    onClick={() => reorderCategory(category.id, -1)}
                  />
                  <IconButton
                    label={`Move ${category.name} down`}
                    icon={<FiArrowDown />}
                    bare
                    disabled={index === ordered.length - 1}
                    onClick={() => reorderCategory(category.id, 1)}
                  />
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={<FiTag />}
          title="No categories yet"
          message="Categories are the chips on the Add screen — make the ones you actually spend on."
          action={<Button variant="primary" icon={<FiPlus />} onClick={() => setEditing({ category: null, usage: 0 })}>New category</Button>}
        />
      )}

      <CategoryFormSheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        category={editing?.category ?? null}
        usage={editing?.usage ?? 0}
      />
    </>
  );
}
