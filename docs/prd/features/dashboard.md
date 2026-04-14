# Feature PRD - Dashboard

## Why This Feature Exists

The dashboard answers “Where do I stand right now?” and gives quick access to the rest of the app.

## Scope

- Balance
- Current-month totals
- History totals
- Five recent transactions
- Bar chart for the last six months
- Link to `/transactions`
- Export/import entry point

## Requirements

- The dashboard must display:
  current balance, current-month income, current-month expenses, total income, total expenses, and recent transactions.
- Balance must be derived from total income minus total expenses.
- Current-month totals must be computed from the browser’s current month at runtime.
- The recent transactions list must show at most five items.
- Recent transactions must be sorted with the most recent first.
- The recent transaction row must show category, formatted date, signed amount, and type-specific styling.
- The dashboard must link to `/transactions` through a visible `Voir tout` action.
- The six-month bar chart must render only when at least one displayed month has non-zero income or expenses.
- The dashboard must expose export and import controls for JSON data management.
- Successful export and import actions must provide visible feedback to the user.
- Import into a non-empty database must route through a confirmation flow rather than silently overwriting data.

## Acceptance Criteria

- Given no data exists, when the user opens `/`, then the dashboard shows an empty recent-transactions state.
- Given at least one income and one expense exist, when the user opens `/`, then the dashboard shows total income and total expenses in the history card.
- Given recent transactions exist, when the user opens `/`, then the dashboard shows them in reverse chronological order.
- Given more than five transactions exist, when the user opens `/`, then only the five most recent transactions are displayed.
- Given income is greater than expenses, when the dashboard renders, then the balance uses positive styling.
- Given expenses are greater than income, when the dashboard renders, then the balance uses negative styling.
- Given transactions exist in multiple months, when the dashboard renders, then `Ce mois-ci` reflects only the current month while `Historique` reflects all time.
- Given there is chartable data in the last six months, when the dashboard renders, then the bar chart card is visible.
- Given there is no chartable data in the last six months, when the dashboard renders, then the bar chart card is not rendered.
- Given the user clicks `Voir tout`, when navigation completes, then the user lands on `/transactions`.
- Given the user exports data, when export succeeds, then a success status is shown.
- Given the user imports valid data into an empty database, when import completes, then the dashboard refreshes to reflect the imported data.

## Non-Goals

- Full transaction management directly on the dashboard
- Deep analytical drill-down
- Editable widgets or personalized dashboard layouts
- Cloud sync status
- Financial forecasting beyond the bar chart summary

## Verification Signals

- `frontend/e2e/dashboard.spec.ts` covers totals, recent transactions, empty state, link behavior, balance styling, five-item limit, monthly isolation, and signed formatting.
- `frontend/e2e/charts.spec.ts` covers bar-chart visibility.
- `frontend/e2e/export-import.spec.ts` covers export payload generation, success messaging, and import behavior from the dashboard.
- `frontend/src/routes/+page.svelte` is the implementation source for dashboard structure and data-management UI.

## Open Questions

- Should the bar chart card become a navigation surface to `/budget`, as suggested in project notes?
- Should import/export remain on the dashboard, or should data management move to a dedicated settings surface if the product grows?
- Should the dashboard show onboarding guidance when the database is empty?
