/* Product name and web-app manifest — the single place to rename the app.
 * Storage keys and the IndexedDB name live in their own modules and must not change
 * once the app is installed: renaming them would orphan the data already on a phone.
 */
export const APP_NAME = "Spendly";
export const APP_TAGLINE = "Where the money goes";

export const THEME_COLOR = "#F4F5F7";
/** Matches --bg under [data-theme="dark"] in src/styles/global.css. */
export const THEME_COLOR_DARK = "#0F1116";
/** The icon's own background. A manifest can't follow the phone's theme, so the splash
 *  and an installed window's default bar use this instead of flashing white. */
export const BRAND_COLOR = "#233544";

export const WEB_MANIFEST = {
  name: `${APP_NAME} — ${APP_TAGLINE}`,
  short_name: APP_NAME,
  description: `Track what you spend in two taps. ${APP_TAGLINE}, synced with Google Sheets. Works offline.`,
  start_url: "./",
  scope: "./",
  display: "standalone",
  orientation: "any",
  background_color: BRAND_COLOR,
  theme_color: BRAND_COLOR,
  icons: [
    { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};
