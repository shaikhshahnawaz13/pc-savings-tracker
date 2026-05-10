# PC Build Savings Tracker

A local-first, offline-capable personal finance tracker for saving money toward your dream PC build.

---

## Features

- **Dashboard** — Total savings, monthly stats, goal progress, charts
- **Add Entry** — Log savings with source, date, amount and notes
- **History** — Search, filter, sort, edit and delete entries
- **Goal Tracking** — Set a total build target + individual component targets
- **Import** — Upload CSV / JSON / XLSX to merge previous records
- **Export** — Download as Excel, CSV or JSON
- **Analytics** — Monthly trend, cumulative chart, streak, source breakdown
- **PWA** — Installable on mobile and desktop, works fully offline

---

## Setup

### Option 1 — Open directly (simplest)

Just open `index.html` in any modern browser. All data stays in `localStorage`.

> **Note:** Some browsers block Service Worker registration for `file://` URLs.
> For full PWA + offline support, use Option 2.

---

### Option 2 — Local dev server (recommended)

**Using Python (no install needed):**

```bash
cd pc-savings-tracker
python3 -m http.server 3000
# Open http://localhost:3000
```

**Using Node.js:**

```bash
cd pc-savings-tracker
npx serve .
# Open the URL shown in the terminal
```

**Using VS Code:**
Install the _Live Server_ extension, right-click `index.html` → **Open with Live Server**.

---

## File Structure

```
pc-savings-tracker/
├── index.html                  # App shell / entry point
├── manifest.json               # PWA manifest
├── sw.js                       # Service worker (offline)
├── README.md
│
├── public/
│   ├── css/
│   │   ├── base.css            # CSS variables, reset, typography
│   │   ├── components.css      # Buttons, cards, forms, tables…
│   │   ├── layout.css          # Sidebar, topbar, grids, responsive
│   │   └── animations.css      # Keyframes and transitions
│   └── assets/                 # Icons / images (optional)
│
└── src/
    ├── app.js                  # Router, navigation, init
    ├── utils/
    │   ├── constants.js        # Sources, colors, PC components
    │   ├── db.js               # localStorage wrapper (CRUD)
    │   └── helpers.js          # Formatting, dates, DOM utils
    └── components/
        ├── toast.js            # Toast notifications
        ├── charts.js           # Chart.js wrappers
        ├── modals.js           # Modal open/close
        ├── dashboard.js        # Dashboard page
        ├── addEntry.js         # Add / edit entry form
        ├── history.js          # History table + filters
        ├── goals.js            # Goal + component tracking
        ├── importData.js       # File import (CSV/JSON/XLSX)
        ├── exportData.js       # File export
        └── analytics.js        # Analytics & charts
```

---

## Import Format

Your CSV or Excel file should have these columns:

| Column  | Required | Example        |
|---------|----------|----------------|
| amount  | Yes      | 5000           |
| date    | Yes      | 2024-03-15     |
| source  | No       | Freelancing    |
| notes   | No       | Logo project   |

Valid source values: `Pocket Money`, `Freelancing`, `Gift`, `Side Hustle`, `Selling Old Items`, `Part-time Job`, `Bonus`, `Other`

---

## Data Storage

All data is stored in your browser's `localStorage` under these keys:

| Key               | Contents                     |
|-------------------|------------------------------|
| `pcbt_entries`    | Array of savings entries     |
| `pcbt_goal`       | PC build goal object         |
| `pcbt_components` | Array of component targets   |

No data is ever sent to a server. Export JSON regularly as a backup.

---

## Browser Support

Chrome 80+, Firefox 75+, Safari 14+, Edge 80+

---

## Tech Stack

- Vanilla HTML / CSS / JavaScript (no build step)
- [Chart.js 4](https://www.chartjs.org/) — charts
- [SheetJS (xlsx)](https://sheetjs.com/) — Excel import/export
- [Tabler Icons](https://tabler-icons.io/) — icon set
- [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) + [JetBrains Mono](https://www.jetbrains.com/lp/mono/) — typography
