# Repo Truth

## Product Surfaces

- Dashboard at `/`
- Transactions management at `/transactions`
- Monthly budget tracking at `/budget`
- Savings goals at `/goals`
- Cross-cutting data management on the dashboard for JSON export and import
- Installable offline-first PWA behavior via service worker, manifest, and static deployment support
- Dual navigation system: desktop top navbar and mobile fixed bottom navigation
- GitHub Pages-oriented static deployment with `BASE_PATH` support

## Route Inventory

- `/`: dashboard, recent transactions, export/import, bar chart
- `/transactions`: CRUD for income and expenses
- `/budget`: monthly budget, month navigation, budget charts
- `/goals`: CRUD for savings goals

## Data Model Inventory

- IndexedDB database name: `mon-budget`
- Version: `1`
- `transactions`: auto-increment `id`, indexes on `date`, `type`, `category`
- Transaction fields: `type`, `amount`, `category`, `description`, `date`, `createdAt`
- `budgets`: keyed by `month`
- Budget fields: `month`, `amount`
- `goals`: auto-increment `id`
- Goal fields: `name`, `target_amount`, `current_amount`, `achieved`, `createdAt`
- Expense categories:
  `Alimentation`, `Transport`, `Loisirs`, `Shopping`, `Abonnements`, `Education`, `Autre`
- Income categories:
  `Argent de poche`, `Job etudiant`, `Cadeaux`, `Autre`

## Major Behaviors Observed In Code

- Dashboard is computed client-side from transactions.
- Current-month totals depend on the browser month.
- Recent transactions are capped at five.
- Transactions are sorted by date descending.
- Budget sums selected-month expenses only.
- Budget page supports buttons and swipe month navigation.
- Goals start at zero progress and can be updated by fixed increments.
- Export/import uses validated JSON with replace or merge behavior.
- Internal navigation uses `$app/paths` `base`.
- Desktop uses top nav; mobile uses bottom nav.
- Service worker is cache-first for GET assets.

## Major Behaviors Observed In Tests

- Dashboard, transactions, budget, goals, navigation, charts, integration, accessibility, and export/import all have E2E coverage.
- Coverage is strongest on core flows and weaker on swipe, persistence-after-reload, and some offline claims.

## Explicit Constraints In Repo Docs

- Frontend-only application with no backend runtime dependency in the target architecture.
- Local-first storage via IndexedDB only.
- French locale is mandatory for labels, dates, month names, and euro formatting.
- Static deployment target is GitHub Pages on branch `trunk`.
- Internal links must use `$app/paths` `base`.
- `manifest.json` is generated from a template during build rather than edited directly.
- `404.html` is used for SPA route refresh support on GitHub Pages.
- The mobile layout must account for the fixed bottom navigation height.
- Charts are SVG-based and are hidden when there is no data to display.

## Known Drift Or Ambiguity

- `README.md` still mentions export/import as a recommended future feature, but export/import is already implemented in the app and covered by tests.
- `frontend/e2e/COVERAGE.md` appears older than the current test suite and understates implemented coverage in several areas.
- `research.md` preserves historical product and technical decisions, but some items are backlog candidates rather than current scope.
- Some UI copy and headings use unaccented French strings in code, while the product intent is clearly French-first rather than orthographically strict in every label.
