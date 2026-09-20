import { useState } from "react";
import { FiArchive, FiCloud, FiHardDrive, FiHeart, FiSmartphone, FiTag, FiTarget } from "react-icons/fi";
import { APP_NAME } from "../../app/brand";
import { isStandalone, useInstallPrompt } from "../../app/installPrompt";
import { href } from "../../app/router";
import { setThemeChoice, useThemeChoice, type ThemeChoice } from "../../app/theme";
import { settingsOf } from "../../data/settings";
import { useDB } from "../../data/store";
import { describeSyncStatus, useSyncStatus } from "../../sync/useSyncStatus";
import { formatMoney, plural } from "../../lib/format";
import { ListGroup, ListRow, PageHeader, SectionTitle } from "../../ui/layout";
import { Segmented } from "../../ui/Segmented";
import { Sheet } from "../../ui/Sheet";
import { formatBytes, useStorageUsage } from "./useStorageUsage";
import styles from "./more.module.css";

const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function budgetSummary(monthlyBudget: number, monthStartDay: number): string {
  const start = monthStartDay === 1 ? "months start on the 1st" : `months start on day ${monthStartDay}`;
  return `${monthlyBudget ? `${formatMoney(monthlyBudget)} a month` : "No budget set"} · ${start}`;
}

export function MoreScreen() {
  const db = useDB();
  const sync = useSyncStatus();
  const install = useInstallPrompt();
  const settings = settingsOf(db);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const bytes = useStorageUsage(db);
  const theme = useThemeChoice();

  return (
    <div className={styles.screen}>
      <PageHeader title="More" />
      <ListGroup>
        <ListRow leading={<FiTag />} title="Categories" subtitle={plural(db.categories.length, "category", "categories")} href={href("more/categories")} />
        <ListRow leading={<FiTarget />} title="Budget & month start" subtitle={budgetSummary(settings.monthlyBudget, settings.monthStartDay)} href={href("more/budget")} />
        <ListRow leading={<FiCloud />} title="Google Sheet sync" subtitle={describeSyncStatus(sync)} href={href("more/sync")} />
        <ListRow leading={<FiArchive />} title="Backup & restore" subtitle="Keep a copy of everything" href={href("more/backup")} />
      </ListGroup>

      <SectionTitle>This phone</SectionTitle>
      <Segmented label="Appearance" className={styles.theme} value={theme} onChange={setThemeChoice} options={THEMES} />
      <ListGroup>
        <ListRow
          leading={<FiHardDrive />}
          title={bytes === null ? "Stored on this phone" : `${formatBytes(bytes)} stored on this phone`}
          subtitle={plural(db.expenses.length, "expense")}
        />
        {!isStandalone() && (
          <ListRow leading={<FiSmartphone />} title="Install on this phone" subtitle="Opens like an app, works offline" onClick={install ?? (() => setShowInstallHelp(true))} chevron />
        )}
      </ListGroup>

      <footer className={styles.footer}>
        <p className={styles.credit}>
          Crafted with <FiHeart aria-label="love" className={styles.heart} /> by Kaushal
        </p>
        <p className={styles.version}>{APP_NAME} · version {__APP_VERSION__}</p>
      </footer>

      <Sheet open={showInstallHelp} onClose={() => setShowInstallHelp(false)} title="Install the app">
        <ol className={styles.steps}>
          <li><b>iPhone (Safari):</b> tap the Share button, then “Add to Home Screen”.</li>
          <li><b>Android (Chrome):</b> open the ⋮ menu, then “Install app” or “Add to Home screen”.</li>
        </ol>
      </Sheet>
    </div>
  );
}
