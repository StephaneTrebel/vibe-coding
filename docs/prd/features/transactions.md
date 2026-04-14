# Feature PRD - Transactions

## Why This Feature Exists

Transactions are the core input layer. Dashboard, budget, and export/import depend on them.

## Scope

- Create income and expenses
- Edit and delete entries
- Type-specific categories
- Optional description
- Recent-first list
- Propagation to dashboard and budget

## Requirements

- The feature must support both `expense` and `income` transaction types.
- The default transaction type in a fresh form is `expense`.
- The category list must change dynamically based on the selected transaction type.
- A transaction must capture:
  type, amount, category, date, and optional description.
- Creating a transaction must persist it to IndexedDB and refresh the rendered list.
- Editing a transaction must preload the existing values into the form before submission.
- Deleting a transaction must require explicit user confirmation.
- Transactions must be displayed in reverse chronological order.
- The rendered transaction list must show:
  type badge, category, optional description, formatted date, signed amount, and type-specific color treatment.
- Income transactions must display with a `+` sign and success styling.
- Expense transactions must display with a `-` sign and danger styling.
- The empty state must be shown when no transactions exist.
- Creating, editing, or deleting a transaction must propagate to dependent dashboard and budget calculations.

## Validation Rules

- `type` must be either `expense` or `income`.
- `amount` must be a number greater than `0`.
- `category` is required and must come from the type-specific allowed category set.
- `date` is required.
- `description` is optional and may be stored as `null` when empty.
- On create, `createdAt` is generated automatically in the data layer.
- Editing preserves the existing record identity and updates the changed fields.

- Expense categories: `Alimentation`, `Transport`, `Loisirs`, `Shopping`, `Abonnements`, `Education`, `Autre`
- Income categories: `Argent de poche`, `Job etudiant`, `Cadeaux`, `Autre`

## Acceptance Criteria

- Given an empty database, when the user opens `/transactions`, then the empty-state message is visible.
- Given the form is closed, when the user clicks `Ajouter`, then the transaction form opens.
- Given the form is open in create mode, when the user submits a valid expense, then the list shows:
  expense badge, selected category, formatted date, negative-signed amount, and danger styling.
- Given the form is open in create mode, when the user submits a valid income, then the list shows:
  income badge, selected category, positive-signed amount, and success styling.
- Given the user changes the type selector from expense to income, then the category options update to the income category set.
- Given the user submits a transaction with a description, then the description is rendered in the list.
- Given the user submits a transaction without a description, then no description block is rendered for that item.
- Given an existing transaction, when the user clicks `Modifier`, then the form opens in edit mode with the transaction values prefilled.
- Given an edited transaction, when the user submits the changes, then the list reflects the updated values.
- Given edit mode is open, when the user clicks the form cancel control, then the form closes and the existing transaction remains unchanged.
- Given an existing transaction, when the user confirms deletion, then the transaction is removed from the list.
- Given the deleted transaction was the last one, then the page returns to the empty state.
- Given a transaction affects current-month spending, when it is created, edited, or deleted, then the budget and dashboard views reflect that change.
- Given a current-month income transaction, when it is created, then it affects the dashboard totals but not monthly budget spending.

## Non-Goals

- Recurring transactions
- Split transactions
- Attachment upload or receipt capture
- Merchant normalization
- Automatic categorization
- Importing transactions directly from banks or OFX files
- Search, filters, tags, or pagination in the current shipped scope
- Multi-currency support

## Verification Signals

- `frontend/e2e/transactions.spec.ts` covers empty state, category switching, create flows, optional description behavior, edit flows, delete flow, and form toggle behavior.
- `frontend/e2e/integration.spec.ts` verifies that transaction changes propagate to dashboard and budget views.
- `frontend/src/routes/transactions/+page.svelte` is the implementation source for rendered behavior and form structure.
- `frontend/src/lib/db.js` is the source of truth for storage shape, ordering, and persistence behavior.

## Open Questions

- Should the list gain stable `data-testid` hooks for more durable E2E selectors?
- Should transactions eventually support search or filtering once the dataset grows?
- Should the product distinguish more clearly between “budget-affecting” and “non-budget-affecting” entries beyond the current income/expense split?
- Should transaction entry optimize further for mobile speed, for example with stronger defaults or reduced taps?
