const LOCALE = "en-IN";

export function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function formatMoney(n: number): string {
  const value = round2(n);
  const text = "₹" + Math.abs(value).toLocaleString(LOCALE, { maximumFractionDigits: 2 });
  return value < 0 ? "−" + text : text;   // "−₹300", not "₹-300"
}

/** Money without the paise, for big headline figures. */
export function formatMoneyShort(n: number): string {
  const value = Math.round(round2(n));
  const text = "₹" + Math.abs(value).toLocaleString(LOCALE);
  return value < 0 ? "−" + text : text;
}

export function parseAmount(text: string): number {
  const n = Number(String(text).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

/** "+12%" / "−8%" — the sign is always shown, because the direction is the point. */
export function formatPercentChange(percent: number): string {
  const value = round2(percent);
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toLocaleString(LOCALE, { maximumFractionDigits: 1 })}%`;
}

export function formatShare(percent: number): string {
  return `${round2(percent).toLocaleString(LOCALE, { maximumFractionDigits: 1 })}%`;
}

/** "1 expense", "3 expenses", and "2 categories" when the plural isn't just an "s". */
export function plural(count: number, word: string, many = `${word}s`): string {
  return `${count} ${count === 1 ? word : many}`;
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "export";
}
