import { useRef } from "react";
import { FiDownload, FiUpload } from "react-icons/fi";
import { href } from "../../app/router";
import { eraseAllData, replaceAllData } from "../../data/actions";
import { createBackup, InvalidBackupError, parseBackup } from "../../data/backup";
import { getDB } from "../../data/store";
import { todayISO } from "../../lib/dates";
import { downloadBlob } from "../../lib/files";
import { Button } from "../../ui/Button";
import { useConfirm } from "../../ui/Confirm";
import { PageHeader, Panel, SectionTitle } from "../../ui/layout";
import { useToast } from "../../ui/Toast";
import styles from "./more.module.css";

const BACK = { label: "More", href: href("more") };
const SHEET_NOTE = "If this device is connected to a Google Sheet, the change reaches the Sheet too.";

export function BackupScreen() {
  const toast = useToast();
  const confirm = useConfirm();
  const fileInput = useRef<HTMLInputElement>(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(createBackup(getDB()), null, 2)], { type: "application/json" });
    downloadBlob(blob, `spendly-backup-${todayISO()}.json`);
    toast("Backup saved");
  };

  const restore = async (file: File) => {
    try {
      const data = parseBackup(await file.text());
      const ok = await confirm({ title: "Replace everything with this backup?", message: SHEET_NOTE, confirmLabel: "Restore", danger: true });
      if (!ok) return;
      replaceAllData(data);
      toast("Backup restored");
    } catch (err) {
      toast(err instanceof InvalidBackupError ? err.message : "Could not read that file", { tone: "error" });
    }
  };

  const erase = async () => {
    const ok = await confirm({
      title: "Erase everything?",
      message: `Every expense and category goes. ${SHEET_NOTE} Save a backup first.`,
      confirmLabel: "Erase everything",
      danger: true,
    });
    if (!ok) return;
    eraseAllData();
    toast("All data erased");
  };

  return (
    <>
      <PageHeader back={BACK} title="Backup & restore" />
      <Panel padded className={styles.block}>
        <p className={styles.help}>
          A single file with every expense, category and setting — the safety net for a lost or wiped phone.
          Restoring replaces what is on this device.
        </p>
        <div className={styles.buttonRow}>
          <Button variant="primary" icon={<FiDownload />} onClick={exportJson}>Save backup</Button>
          <Button icon={<FiUpload />} onClick={() => fileInput.current?.click()}>Restore backup</Button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void restore(file);
          }}
        />
      </Panel>

      <SectionTitle>Danger zone</SectionTitle>
      <Panel padded className={styles.danger}>
        <p className={styles.help}>Removes everything and starts fresh. Save a backup first.</p>
        <Button variant="danger" block onClick={erase}>Erase all data</Button>
      </Panel>
    </>
  );
}
