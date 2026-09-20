# Spendly — where the money goes

A personal expense tracker for one phone. It tracks **money going out** and nothing else:
punch in what you just spent, and it tells you honestly how much you are burning — this
month, this year, and over the last five or ten.

React 19 + TypeScript + Vite. No backend server: everything lives on the phone
(IndexedDB), optionally mirrored into a Google Sheet through a small Apps Script, and
GitHub Pages hosts the app for free. It installs as a PWA and works fully offline.

The product name lives in `src/app/brand.ts` (page title, install name and manifest all
read it).

## The idea

Adding an expense has to be nearly effortless, or it doesn't get done:

- The home screen **is** the add screen — a big in-app number pad, not the OS keyboard.
- **Quick chips** (`+10 +20 +50 +100 +200 +500 +1000`) add up, so most amounts need two taps.
- **Repeat tiles** are built from your own history — the category + amount combinations
  used most over the last 60 days. One tap fills the pad, a second tap saves it.
- **Categories are chips**, most-used first; adding one is a tap and a name.
- Date defaults to today, with Yesterday one tap away.
- Press and hold any entry to repeat it on today.

## Project layout

```
src/
  app/          shell: routing, tab bar, sheet/back-button handling, theme, PWA update prompt
  data/         types, IndexedDB storage, store, actions, spending cycles, insights maths, backup
  sync/         offline outbox + sync engine, record <-> Sheet row mapping
  features/
    add/        the number pad, quick chips, repeat tiles, today's list
    history/    every entry, grouped by day, with filters kept in the URL
    insights/   totals, budget, trend chart, calendar heat map, month- and year-on-year
    period/     the period selector shared by History and Insights
    categories/ category chips, icon/colour picker, category form
    expenses/   the row and the edit sheet shared by Add and History
    more/       categories, budget, Google Sheet sync, backup & restore, appearance
  ui/           shared components (Button, Sheet, fields, lists, bars, toast, confirm…)
apps-script/Code.gs      Google Sheet backend (Apps Script web app)
vite-plugins/            service worker, manifest + 404.html, local mock of the Sheet backend
.github/workflows/       build + deploy to GitHub Pages
```

## Develop

```bash
npm install
npm run dev
```

- App: http://localhost:8787
- A mock of the Google Sheet backend runs alongside at http://localhost:8788/exec (it runs the
  real `apps-script/Code.gs` against an in-memory sheet). Connect to it from **More → Google Sheet sync**.
  The mock sheet is empty after a restart.

```bash
npm test            # insights invariants, cycle maths, number pad, Sheet mapping, backup, Code.gs
npm run typecheck
npm run build       # production build in dist/
```

## How the numbers work

- **A month** runs from the day set in **More → Budget & month start** (1–28) to the day
  before the next one, so a salary-day budget behaves like a calendar month. **A year** is
  twelve of those cycles, starting with January's. Both tile the calendar: every date
  belongs to exactly one, with no gaps and no overlaps.
- **Everything agrees.** A period's total, its category breakdown and its trend series are
  three views of the same sum. An expense whose category was deleted is not dropped — it
  lands in an "Uncategorised" slice, so no total ever changes behind your back.
  `src/data/insightsInvariants.test.ts` checks this over hundreds of generated histories.
- **The trend chart zooms itself**: day by day up to ~3 months, month by month up to ~3
  years, year by year beyond that. "Last 12 months" and "Year on year" are always shown,
  whatever period is selected.
- **Projection** is the current daily rate carried to the end of the period — shown only
  while the period is still running.

## Google Sheet backend (optional, one-time)

Everything works without it. Connect a Sheet and the data outlives the phone, and a second
device can catch up.

1. Create a new, blank Google Sheet.
2. **Extensions → Apps Script**. Replace the sample code with all of `apps-script/Code.gs`, and save.
3. **Deploy → New deployment** → gear icon → **Web app**. Execute as: **Me**. Who has access: **Anyone**.
4. **Deploy**, approve the permissions (Google warns the app is unverified: **Advanced → Go to … (unsafe)**; it is your own script).
5. Copy the **Web app URL** (ends in `/exec`) and paste it into **More → Google Sheet sync**.

Tabs (Expenses, Categories, Settings) are created when data first arrives. Dates are written
as real date cells ("20 Sept 2026"), and every row carries a readable `updatedOn` column next
to the raw `updatedAt`.

**Updating `Code.gs` later:** **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**.
This keeps the same URL. A *new deployment* would get a new URL, and the phone would need to reconnect.

**Anyone with the `/exec` URL can read and change the data.** If it leaks, create a new
deployment, archive the old one, and reconnect.

### Editing directly in the Sheet

Edits typed into the Sheet reach the app on its next sync, and new rows get an id automatically.
Don't edit `_rev` and don't clear rows; to delete, set `deleted` to `TRUE`. In **Expenses**, the
`category` column is a display copy and edits there are ignored. Sync conflicts are settled per
record: the most recent change wins.

## Add a second device

1. On the connected device: **More → Google Sheet sync → Copy setup link**.
2. Open that link on the other device and confirm. It joins the same Sheet — and adopts the
   categories already there rather than seeding its own.

## Deploy on GitHub Pages

1. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push to `spendly` or `main`. The workflow in `.github/workflows/deploy.yml` tests, builds
   and publishes on every push to either branch.
3. The app is served at `https://<username>.github.io/<repo>/`.

Installed apps pick up a new version automatically: they show "A new version is ready · Update".

URLs are normal paths (`/expense-tracker/history?category=…`), so any page can be reloaded or
shared. GitHub Pages serves `404.html` (a copy of the app) for paths it doesn't know, and
installed apps are served by the service worker, offline too.

## The icon

`public/icons/icon.svg` is the source. The PNGs were rendered from it with
`qlmanage -t -s 512 -o . icon.svg` and resized with `sips`.
