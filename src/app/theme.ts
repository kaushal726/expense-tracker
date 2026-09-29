/* Light or dark, following the phone unless the user picked one.
 *
 * The resolved theme is written to <html data-theme>, so the stylesheet needs a single
 * dark block. index.html sets it before first paint; this module keeps it in step with
 * the phone's setting and with what the user chooses in More.
 */
import { useSyncExternalStore } from "react";

export type ThemeChoice = "system" | "light" | "dark";

export const THEME_KEY = "spendly_theme";
const CHOICES: ThemeChoice[] = ["system", "light", "dark"];
const DARK_QUERY = "(prefers-color-scheme: dark)";

const listeners = new Set<() => void>();
let choice: ThemeChoice = read();

function read(): ThemeChoice {
  try {
    const saved = localStorage.getItem(THEME_KEY) as ThemeChoice | null;
    return saved && CHOICES.includes(saved) ? saved : "system";
  } catch {
    return "system";
  }
}

function prefersDark(): boolean {
  return typeof matchMedia === "function" && matchMedia(DARK_QUERY).matches;
}

export function resolveTheme(pick: ThemeChoice = choice): "light" | "dark" {
  return pick === "system" ? (prefersDark() ? "dark" : "light") : pick;
}

/* index.html carries one theme-color meta per scheme. Following the phone means leaving
 * their media queries alone; a theme chosen by hand pins one on and the other off, which
 * is what an installed app's status bar reads. */
function applyStatusBar(): void {
  const [light, dark] = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
  if (!light || !dark) return;
  if (choice === "system") {
    light.media = "(prefers-color-scheme: light)";
    dark.media = "(prefers-color-scheme: dark)";
    return;
  }
  light.media = choice === "light" ? "all" : "not all";
  dark.media = choice === "dark" ? "all" : "not all";
}

function apply(): void {
  document.documentElement.dataset.theme = resolveTheme();
  applyStatusBar();
}

export function getThemeChoice(): ThemeChoice {
  return choice;
}

export function setThemeChoice(next: ThemeChoice): void {
  choice = next;
  try {
    if (next === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, next);
  } catch {
    // A phone with storage blocked still gets the theme for this session.
  }
  apply();
  listeners.forEach((l) => l());
}

export function initTheme(): void {
  apply();
  matchMedia?.(DARK_QUERY).addEventListener("change", () => {
    if (choice === "system") apply();
  });
}

export function useThemeChoice(): ThemeChoice {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getThemeChoice,
  );
}
