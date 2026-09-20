import { FiPlus } from "react-icons/fi";
import { colorVars } from "../../data/categoryColors";
import { categoryIcon } from "../../data/categoryIcons";
import type { Category } from "../../data/types";
import { cx } from "../../lib/cx";
import { Chip } from "../../ui/Chip";
import styles from "./categories.module.css";

interface CategoryChipsProps {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  /** Shows a "New" chip that opens the category form. */
  onCreate?: () => void;
  /** One line that scrolls sideways instead of wrapping, to keep the pad above the fold. */
  scrollable?: boolean;
  label?: string;
}

/** Categories as tappable chips, most-used first — never a dropdown. */
export function CategoryChips({ categories, value, onChange, onCreate, scrollable, label = "Category" }: CategoryChipsProps) {
  return (
    <div className={scrollable ? cx(styles.chipsScroll, "scroll-row") : styles.chips} role="radiogroup" aria-label={label}>
      {categories.map((category) => {
        const Icon = categoryIcon(category.icon);
        return (
          <Chip
            key={category.id}
            role="radio"
            selected={category.id === value}
            tone={colorVars(category.color)}
            icon={<Icon />}
            onClick={() => onChange(category.id)}
          >
            {category.name}
          </Chip>
        );
      })}
      {onCreate && <Chip selected={false} outline icon={<FiPlus />} onClick={onCreate}>New</Chip>}
    </div>
  );
}
