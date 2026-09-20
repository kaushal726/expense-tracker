import { FiSearch, FiX } from "react-icons/fi";
import styles from "./controls.module.css";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}

export function SearchInput({ value, onChange, placeholder, autoFocus }: SearchInputProps) {
  return (
    <div className={styles.search}>
      <FiSearch className={styles.searchIcon} aria-hidden />
      <input
        className={styles.searchInput}
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button type="button" className={styles.searchClear} aria-label="Clear search" onClick={() => onChange("")}><FiX /></button>
      )}
    </div>
  );
}
