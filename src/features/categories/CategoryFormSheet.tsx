import { useState, type CSSProperties } from "react";
import { FiTrash2 } from "react-icons/fi";
import { deleteCategory, saveCategory, type CategoryInput } from "../../data/actions";
import { CATEGORY_COLORS, colorVars, DEFAULT_CATEGORY_COLOR } from "../../data/categoryColors";
import { CATEGORY_ICON_NAMES, categoryIcon, DEFAULT_CATEGORY_ICON } from "../../data/categoryIcons";
import { parseAmount, plural } from "../../lib/format";
import type { Category } from "../../data/types";
import { Button, IconButton } from "../../ui/Button";
import { useConfirm } from "../../ui/Confirm";
import { TextField } from "../../ui/Field";
import { Sheet } from "../../ui/Sheet";
import { useToast } from "../../ui/Toast";
import styles from "./categories.module.css";

interface CategoryFormSheetProps {
  open: boolean;
  onClose: () => void;
  /** Null when adding. */
  category: Category | null;
  /** How many expenses already point at this category. */
  usage?: number;
  initialName?: string;
  onSaved?: (categoryId: string) => void;
}

function emptyDraft(name: string): CategoryInput {
  return { name, icon: DEFAULT_CATEGORY_ICON, color: DEFAULT_CATEGORY_COLOR, monthlyBudget: 0 };
}

export function CategoryFormSheet(props: CategoryFormSheetProps) {
  return props.open ? <CategoryForm key={props.category?.id ?? "new"} {...props} /> : null;
}

function CategoryForm({ onClose, category, usage = 0, initialName = "", onSaved }: CategoryFormSheetProps) {
  const [draft, setDraft] = useState<CategoryInput>(() =>
    category ? { name: category.name, icon: category.icon, color: category.color, monthlyBudget: category.monthlyBudget } : emptyDraft(initialName));
  const [budget, setBudget] = useState(() => (category?.monthlyBudget ? String(category.monthlyBudget) : ""));
  const [error, setError] = useState("");
  const confirm = useConfirm();
  const toast = useToast();

  const submit = () => {
    const name = draft.name.trim();
    if (!name) return setError("Give it a name");
    const id = saveCategory({ ...draft, name, monthlyBudget: parseAmount(budget) }, category?.id ?? null);
    onSaved?.(id);
    onClose();
  };

  const remove = async () => {
    const ok = await confirm({
      title: "Delete this category?",
      message: usage
        ? `${plural(usage, "expense")} will stay, counted in the totals but shown as Uncategorised.`
        : "It will be gone from the chips and from Insights.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok || !category) return;
    deleteCategory(category.id);
    toast("Category deleted");
    onClose();
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={category ? "Edit category" : "New category"}
      headerAction={category ? <IconButton label="Delete category" icon={<FiTrash2 />} bare onClick={() => void remove()} /> : undefined}
      footer={<Button variant="primary" block onClick={submit}>Save</Button>}
    >
      <TextField
        label="Name"
        value={draft.name}
        onChange={(name) => { setDraft((d) => ({ ...d, name })); setError(""); }}
        error={error}
        placeholder="Chai, Rent, Petrol…"
        autoFocus
        maxLength={24}
      />

      <p className={styles.formLabel}>Icon</p>
      <div className={styles.iconGrid} role="radiogroup" aria-label="Icon">
        {CATEGORY_ICON_NAMES.map((name) => {
          const Icon = categoryIcon(name);
          return (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={name === draft.icon}
              aria-label={name}
              className={styles.iconOption}
              onClick={() => setDraft((d) => ({ ...d, icon: name }))}
            >
              <Icon aria-hidden />
            </button>
          );
        })}
      </div>

      <p className={styles.formLabel}>Colour</p>
      <div className={styles.colorRow} role="radiogroup" aria-label="Colour">
        {CATEGORY_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={color === draft.color}
            aria-label={color}
            className={styles.colorOption}
            style={{ "--swatch": colorVars(color).ink } as CSSProperties}
            onClick={() => setDraft((d) => ({ ...d, color }))}
          />
        ))}
      </div>

      <TextField
        label="Monthly budget"
        value={budget}
        onChange={(v) => setBudget(v.replace(/[^\d.]/g, ""))}
        optional
        prefix="₹"
        inputMode="decimal"
        placeholder="0"
        hint="Leave blank for no limit on this category."
      />
    </Sheet>
  );
}
