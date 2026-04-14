# Feature PRD - Monthly Budget

## Why This Feature Exists

This feature answers “Am I still within my budget this month?”

## Scope

- Monthly budget per month
- Spent and remaining summary
- Warning and over-budget states
- Previous/next month navigation
- Swipe month navigation
- Pie chart by category
- Line chart for budget versus spent history

## Requirements

- The feature must allow setting and updating a budget amount for a selected month.
- Budgets must be stored per `YYYY-MM` month key.
- Spending for the selected month must be computed from `expense` transactions only.
- Income must not increase the monthly spent amount.
- Spending from other months must not affect the current month summary.
- The feature must display:
  selected month, budget amount, spent amount, remaining amount, and progress state.
- Remaining amount must be computed as budget minus spent.
- Progress percentage must be derived from spent divided by budget and clamped to `100%` for the progress bar width.
- The feature must display:
  normal state below warning threshold,
  warning state above `75%` and up to `100%`,
  over-budget state above `100%`.
- The selected month must be navigable with previous and next controls.
- The selected month must also support swipe left/right on supported touch devices.
- The pie chart must render only when the selected month contains expense data.
- The line chart must render only when there is budget or spent data in the displayed historical window.
- The line chart must support toggling between six-month and twelve-month windows.

## Month Navigation Rules

- Initial month is the browser’s current month.
- `Precedent` moves the selected month back by one calendar month.
- `Suivant` moves the selected month forward by one calendar month.
- Swipe right moves backward one month.
- Swipe left moves forward one month.
- Navigation refreshes the month summary, pie data, and line data.

## Calculation Rules

- `spent` is the sum of all selected-month transactions where `type === 'expense'`.
- `remaining = budget.amount - spent`
- `percentage = budget.amount ? min((spent / budget.amount) * 100, 100) : 0`
- Pie chart aggregates selected-month expenses by category.
- Line chart compares month-level budget versus month-level spent over the last twelve months, with a six- or twelve-month visible slice.

## Acceptance Criteria

- Given the user opens `/budget`, when the page loads, then the current month label is displayed in French.
- Given the user enters a valid amount and clicks `Enregistrer`, when save completes, then the budget summary reflects the saved amount.
- Given expense transactions exist in the selected month, when the page renders, then the spent amount equals the sum of those expenses.
- Given a budget and monthly spending exist, when the page renders, then the remaining amount equals budget minus spent.
- Given spending is `50%` of the budget, when the page renders, then the progress bar shows the normal state and no warning or danger class.
- Given spending is above `75%` but not above `100%`, when the page renders, then the warning message is shown.
- Given spending exceeds `100%`, when the page renders, then the over-budget message is shown.
- Given the user navigates to a previous or next month, when navigation completes, then the month title updates and the summary reflects that month’s stored budget and expenses.
- Given different budgets are saved for different months, when the user navigates between months, then each month retains its own saved amount.
- Given only income exists in the selected month, when the page renders, then spent remains `0`.
- Given expense data exists, when the page renders, then the pie chart card is visible.
- Given budget or spent history exists, when the page renders, then the line chart card is visible and the period toggle is available.

## Non-Goals

- Shared or family budgets
- Category-specific budget limits
- Recurring monthly budget templates
- Forecasting future months from trends
- Fullscreen analytics in the current shipped scope
- Income planning or cashflow forecasting beyond current summaries

## Verification Signals

- `frontend/e2e/budget.spec.ts` covers month display, save/update flows, spent and remaining calculations, warning states, month navigation, month independence, and income exclusion from spending.
- `frontend/e2e/integration.spec.ts` verifies that transaction create/edit/delete flows affect the budget summary.
- `frontend/e2e/charts.spec.ts` covers pie-chart and line-chart visibility plus line-chart period toggling.
- `frontend/src/routes/budget/+page.svelte` is the implementation source for budget rules, swipe handling, and summary rendering.
- `frontend/src/lib/LineChart.svelte` shows the active six-/twelve-month toggle behavior.

## Open Questions

- Should the zero-budget default remain the product behavior, or should the UI distinguish more clearly between “not set” and `0`?
- Is swipe navigation worth promoting more aggressively with onboarding, or should buttons remain the primary interaction?
- Should the dashboard bar chart link into a specific month view on the budget page?
