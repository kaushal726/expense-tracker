/* The starter categories, written exactly once.
 *
 * The settings record doubles as the "this device has been set up" marker, so a category
 * deleted later never reappears. src/data/store.ts holds this back until after the first
 * successful sync when the device is connected to a Sheet, so joining an existing Sheet
 * doesn't duplicate the categories already there.
 */
import { DEFAULT_SETTINGS, starterCategories } from "./seed";
import { APP_SETTINGS_ID, type DB } from "./types";

export function seedFirstRun(db: DB): DB {
  if (db.settings.length) return db;
  const now = Date.now();
  return {
    ...db,
    categories: db.categories.length ? db.categories : starterCategories(now),
    settings: [{ ...DEFAULT_SETTINGS, id: APP_SETTINGS_ID, seededAt: now, updatedAt: now }],
  };
}
