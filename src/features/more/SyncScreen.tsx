import { useState } from "react";
import { FiCopy, FiRefreshCw } from "react-icons/fi";
import { href } from "../../app/router";
import { connect, disconnect, syncNow } from "../../sync/engine";
import { getApiUrl, isValidApiUrl } from "../../sync/config";
import { describeSyncStatus, useSyncStatus } from "../../sync/useSyncStatus";
import { Button } from "../../ui/Button";
import { useConfirm } from "../../ui/Confirm";
import { TextField } from "../../ui/Field";
import { PageHeader, Panel, SectionTitle } from "../../ui/layout";
import { useToast } from "../../ui/Toast";
import styles from "./more.module.css";

const BACK = { label: "More", href: href("more") };

function setupLink(apiUrl: string): string {
  return `${location.origin}${href("connect")}#url=${encodeURIComponent(apiUrl)}`;
}

export function SyncScreen() {
  const status = useSyncStatus();
  const toast = useToast();
  const confirm = useConfirm();
  const connectedUrl = getApiUrl();
  const [url, setUrl] = useState(connectedUrl);
  const [error, setError] = useState("");

  const submit = () => {
    if (!isValidApiUrl(url)) return setError("Paste the Web app URL from Apps Script. It ends in /exec");
    connect(url.trim());
    toast("Connected, syncing with Google Sheet");
  };

  const copyLink = async () => {
    const link = setupLink(connectedUrl);
    try {
      await navigator.clipboard.writeText(link);
      toast("Setup link copied. Open it on your other device");
    } catch {
      window.prompt("Copy this setup link:", link);
    }
  };

  const unlink = async () => {
    const ok = await confirm({
      title: "Disconnect this device?",
      message: "Everything on this phone stays, but changes stop reaching the Sheet.",
      confirmLabel: "Disconnect",
      danger: true,
    });
    if (!ok) return;
    disconnect();
    setUrl("");
    toast("Disconnected from Google Sheet");
  };

  return (
    <>
      <PageHeader back={BACK} title="Google Sheet sync" />
      <Panel padded className={styles.block}>
        <div className={styles.statusRow} data-state={status.state}>
          <span className={styles.statusDot} data-state={status.state} />
          <b>{describeSyncStatus(status)}</b>
        </div>
        {status.outdatedScript && (
          <p className={styles.warning}>
            The script in your Google Sheet is older than this app, so some records are still waiting.
            Open the Sheet → Extensions → Apps Script, paste the latest <b>Code.gs</b>, then Deploy → Manage deployments → Edit → New version.
          </p>
        )}
        <p className={styles.help}>
          {connectedUrl
            ? "Expenses are saved on this phone first and sent to the Sheet in the background — the Sheet is the backup, and how a second device catches up."
            : "Optional. Connect a Google Sheet and every expense is mirrored into it, so the data outlives the phone."}
        </p>
        {connectedUrl && (
          <div className={styles.buttonRow}>
            <Button icon={<FiRefreshCw />} onClick={() => void syncNow()} disabled={status.state === "syncing"}>Sync now</Button>
            <Button icon={<FiCopy />} onClick={copyLink}>Copy setup link</Button>
          </div>
        )}
      </Panel>

      <SectionTitle>{connectedUrl ? "Connection" : "Connect"}</SectionTitle>
      <TextField
        label="Apps Script Web app URL"
        value={url}
        onChange={(v) => { setUrl(v); setError(""); }}
        error={error}
        placeholder="https://script.google.com/macros/s/…/exec"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        hint="Or open a setup link copied from a device that is already connected."
      />
      <div className={styles.buttonRow}>
        <Button variant="primary" onClick={submit} disabled={url.trim() === connectedUrl && Boolean(connectedUrl)}>{connectedUrl ? "Update" : "Connect"}</Button>
        {connectedUrl && <Button variant="danger" onClick={unlink}>Disconnect</Button>}
      </div>
    </>
  );
}
