import { useState } from "react";
import { href } from "../../app/router";
import { saveSettings } from "../../data/actions";
import { cycleContaining, cycleLabel } from "../../data/months";
import { clampMonthStartDay, MAX_MONTH_START_DAY, MIN_MONTH_START_DAY, settingsOf } from "../../data/settings";
import { useDB } from "../../data/store";
import { todayISO } from "../../lib/dates";
import { parseAmount } from "../../lib/format";
import { Button } from "../../ui/Button";
import { TextField } from "../../ui/Field";
import { PageHeader, Panel, SectionTitle } from "../../ui/layout";
import { useToast } from "../../ui/Toast";
import styles from "./more.module.css";

const BACK = { label: "More", href: href("more") };

export function BudgetScreen() {
  const db = useDB();
  const toast = useToast();
  const settings = settingsOf(db);
  const [budget, setBudget] = useState(settings.monthlyBudget ? String(settings.monthlyBudget) : "");
  const [startDay, setStartDay] = useState(String(settings.monthStartDay));

  const day = clampMonthStartDay(Number(startDay));
  const preview = cycleLabel(cycleContaining(todayISO(), day), day);

  const submit = () => {
    saveSettings({ monthlyBudget: Math.max(0, parseAmount(budget)), monthStartDay: day });
    setStartDay(String(day));
    toast("Budget saved");
  };

  return (
    <>
      <PageHeader back={BACK} title="Budget & month start" />
      <Panel padded className={styles.block}>
        <p className={styles.help}>
          A budget turns Insights into a running check: how much is left this month, and what that works out to per day.
          Leave it blank if you would rather just watch the numbers.
        </p>
        <TextField
          label="Monthly budget"
          value={budget}
          onChange={(v) => setBudget(v.replace(/[^\d.]/g, ""))}
          optional
          prefix="₹"
          inputMode="decimal"
          placeholder="0"
        />
        <TextField
          label="Month starts on day"
          value={startDay}
          onChange={(v) => setStartDay(v.replace(/\D/g, "").slice(0, 2))}
          inputMode="numeric"
          min={MIN_MONTH_START_DAY}
          max={MAX_MONTH_START_DAY}
          hint={`Between ${MIN_MONTH_START_DAY} and ${MAX_MONTH_START_DAY} — set it to your salary day and every total follows it. Right now: ${preview}.`}
        />
        <Button variant="primary" block onClick={submit}>Save</Button>
      </Panel>

      <SectionTitle>How the month is counted</SectionTitle>
      <Panel padded>
        <p className={styles.help}>
          Every total, chart and budget uses this window — the current one runs {preview}. Changing the day re-slices the
          history you already have; nothing is lost or moved.
        </p>
      </Panel>
    </>
  );
}
