import { PERIOD_LABELS, type PeriodPreset } from "../../data/periods";
import { cx } from "../../lib/cx";
import { todayISO } from "../../lib/dates";
import { Chip } from "../../ui/Chip";
import { TextField } from "../../ui/Field";
import type { PeriodFilter } from "./usePeriodFilter";
import styles from "./period.module.css";

interface PeriodChipsProps {
  filter: PeriodFilter;
  presets: PeriodPreset[];
}

/** One scrolling row from a month out to a decade, with a custom range behind the last chip. */
export function PeriodChips({ filter, presets }: PeriodChipsProps) {
  const today = todayISO();
  return (
    <>
      <div className={cx(styles.chips, "scroll-row")} role="group" aria-label="Period">
        {presets.map((preset) => (
          <Chip key={preset} selected={preset === filter.preset} onClick={() => filter.setPreset(preset)}>
            {PERIOD_LABELS[preset]}
          </Chip>
        ))}
      </div>
      {filter.preset === "custom" && (
        <div className={styles.customRow}>
          <TextField label="From" type="date" value={filter.range.from} max={filter.range.to || today} onChange={(from) => filter.setRange({ ...filter.range, from })} />
          <TextField label="To" type="date" value={filter.range.to} min={filter.range.from} max={today} onChange={(to) => filter.setRange({ ...filter.range, to })} />
        </div>
      )}
    </>
  );
}
