# Sheet → Dashboard

Turn any employee spreadsheet into an interactive HR attrition analytics
dashboard — entirely in your browser. Upload a `.xlsx` / `.xls` / `.csv`
file (or try the built-in sample dataset), map your columns, and get a
full BI-style dashboard: KPI cards, retention/attrition breakdowns,
auto-generated insights, a transparent per-employee risk score, and
click-to-filter drill-down charts.

**No backend, no upload.** Parsing, cleaning, and analysis all run
client-side — your data never leaves the browser.

![Dashboard screenshot](./screenshot.png)

## Features

- **3-stage flow** — Upload → Map columns → Dashboard, with a one-click
  "try sample data" path so it's demoable with no file at all.
- **Smart column mapping** — auto-guesses which uploaded column maps to
  Attrition, Department, Job Role, Gender, Education, Age, Income, and
  Tenure, with full manual override.
- **Automatic data cleaning** — trims whitespace, normalizes blank
  placeholder tokens (`N/A`, `null`, `-`, etc.), drops empty/duplicate
  rows, and silently excludes implausible outliers (age, income, tenure)
  from averages and charts. A transparent "Data cleaned" summary shows
  exactly what was fixed.
- **KPI cards** — headcount, attrition count/rate, average age, income,
  and tenure, with smooth animated count-up transitions.
- **Charts** — overall retention donut, attrition by department / job
  role / age group / salary slab / education / tenure bucket / gender,
  plus an attrition-rate-over-time trend line when a date column is
  mapped.
- **Auto-generated insights** — plain-language takeaways computed from
  the current filtered view using simple, explainable comparison rules.
- **Attrition risk scoring** — a transparent, weighted per-employee risk
  score (Low / Medium / High), sortable and searchable, explicitly
  labeled as a heuristic rather than a predictive model.
- **Click-to-filter drill-down** — click any bar or donut slice to filter
  the whole dashboard; active filters show as removable chips.
- **CSV export** — download the currently filtered rows, including the
  computed risk score/level, as a CSV file.
- **Colorblind-safe palette toggle** and full keyboard navigation.
- **Dark/light theme toggle**, responsive layout (KPI row becomes a
  swipeable strip on mobile).

## Tech Stack

- [React](https://react.dev/) + [Vite](https://vite.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) v4
- [SheetJS (xlsx)](https://sheetjs.com/) for client-side spreadsheet parsing
- [Chart.js](https://www.chartjs.org/) via [react-chartjs-2](https://react-chartjs-2.js.org/)

## How to Run Locally

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

To build a static production bundle (deployable to Vercel, Netlify, or
GitHub Pages):

```bash
npm run build
npm run preview   # serve the production build locally
```

## What I Learned

- Building an in-browser data pipeline (parse → clean → normalize →
  aggregate) that stays fast and responsive as filters change on every
  interaction.
- Designing transparent, explainable heuristics (insights, risk scoring)
  instead of reaching for a black-box model — and making that tradeoff
  visible in the UI.
- Making charts double as filter controls (click-to-drill-down) without
  the interaction model becoming confusing.
