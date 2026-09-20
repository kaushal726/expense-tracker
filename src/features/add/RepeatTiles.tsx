import type { CSSProperties } from "react";
import { colorVars } from "../../data/categoryColors";
import { categoryIcon } from "../../data/categoryIcons";
import type { RepeatTile } from "../../data/repeats";
import { formatMoney } from "../../lib/format";
import { cx } from "../../lib/cx";
import styles from "./add.module.css";

interface RepeatTilesProps {
  tiles: RepeatTile[];
  /** The tile already loaded onto the pad — tapping it again saves. */
  armedKey: string | null;
  onPick: (tile: RepeatTile) => void;
}

/** The combinations used most over the last two months: one tap fills, a second saves. */
export function RepeatTiles({ tiles, armedKey, onPick }: RepeatTilesProps) {
  if (!tiles.length) return null;
  return (
    <div className={cx(styles.tiles, "scroll-row")} role="group" aria-label="Repeat a usual expense">
      {tiles.map((tile) => {
        const Icon = categoryIcon(tile.icon);
        const { ink, soft } = colorVars(tile.color);
        const armed = tile.key === armedKey;
        return (
          <button
            key={tile.key}
            type="button"
            className={cx(styles.tile, armed && styles.tileArmed)}
            style={{ "--tile-ink": ink, "--tile-soft": soft } as CSSProperties}
            onClick={() => onPick(tile)}
          >
            <span className={styles.tileIcon} aria-hidden><Icon /></span>
            <span className={styles.tileText}>
              <span className={styles.tileName}>{tile.categoryName}</span>
              <span className={styles.tileAmount}>{formatMoney(tile.amount)}</span>
            </span>
            <span className={styles.tileHint}>{armed ? "Tap to save" : ""}</span>
          </button>
        );
      })}
    </div>
  );
}
