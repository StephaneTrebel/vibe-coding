# Feature PRD - Export Import

## Why This Feature Exists

Export/import is the backup and restore layer for a local-only product.

## Scope

- Export all app data to JSON
- Validate imported JSON
- Replace or merge on non-empty local data
- Refresh app state after import

## Requirements

- The feature must export a JSON file containing:
  app identity, version, export date, metadata counts, and all transaction, budget, and goal records.
- The exported filename must include the `mon-budget-YYYY-MM-DD.json` pattern.
- Import must validate:
  app identity, version, data structure, metadata counts, transaction fields, budget fields, and goal fields.
- Import must reject files that are not valid JSON.
- Import must reject files that do not belong to `Mon Budget`.
- Import must reject unsupported versions and prompt update when the file version is newer than the app version.
- Import into an empty database must replace all data immediately.
- Import into a non-empty database must require an explicit user strategy:
  replace or merge.
- Replace must clear all existing stores and write the incoming dataset atomically.
- Merge must append transactions and goals while putting budgets by month atomically.
- Import success must refresh dashboard-derived views.
- Import and export outcomes must display visible status or error feedback.

## File Format Rules

- Root fields:
  `version`, `appName`, `exportDate`, `metadata`, `data`
- `appName` must equal `Mon Budget`
- `version` must equal `1` for current compatibility
- `metadata` must include:
  `totalTransactions`, `totalBudgets`, `totalGoals`
- `data` must include arrays for:
  `transactions`, `budgets`, `goals`
- Transaction export preserves:
  `id`, `type`, `amount`, `category`, `date`, `createdAt`, and optional `description`

## Validation Rules

- Transactions:
  `type` must be `income` or `expense`
- Transactions:
  `amount` must be numeric and `> 0`
- Transactions:
  `date` must match `YYYY-MM-DD`
- Transactions:
  `category` must match the allowed set for the transaction type
- Budgets:
  `month` must match `YYYY-MM`
- Budgets:
  `amount` must be numeric and `>= 0`
- Goals:
  `name` must be a non-empty string
- Goals:
  `target_amount` must be numeric and `> 0`
- Metadata counts must match the actual array lengths in the payload

## Replacement And Merge Rules

- Replace:
  clear `transactions`, `budgets`, and `goals`, then import all incoming data in one transaction.
- Merge:
  append imported transactions and goals as new records, and upsert budgets by month in one transaction.
- During replace and merge, incoming transaction and goal identifiers are not reused as canonical local identifiers.
- Missing optional fields are normalized on write:
  `description` defaults to `null`,
  `current_amount` defaults to `0`,
  `achieved` defaults to `false`,
  timestamps are filled if absent.

## Acceptance Criteria

- Given the user exports data, when export completes, then a downloadable JSON payload is generated with the expected root structure.
- Given the user exports from an empty database, when export completes, then the arrays are empty and metadata counts are zero.
- Given the user exports from a populated database, when export completes, then the payload reflects the stored records.
- Given the user imports a valid file into an empty database, when import completes, then the data becomes visible in the application without a confirmation modal.
- Given the user imports a valid file into a non-empty database, when validation succeeds, then the app opens a confirmation flow instead of importing immediately.
- Given the user chooses replace, when import completes, then previous local data is removed and the imported dataset becomes the source of truth.
- Given the user chooses merge, when import completes, then local and incoming data coexist according to the merge rules.
- Given the file is malformed, incompatible, or corrupt, when import is attempted, then the app shows an error and does not mutate local data.

## Non-Goals

- OFX import or export in current shipped scope
- Incremental cloud backup
- Automatic backup scheduling
- Partial import selection by entity type
- Conflict-resolution UI beyond replace versus merge
- Cross-app compatibility with third-party budgeting tools

## Verification Signals

- `frontend/e2e/export-import.spec.ts` covers empty and populated export, filename messaging, valid import, replace/merge confirmation behavior, and validation failures.
- `frontend/src/lib/export.js` is the implementation source for payload shape, validation rules, and import strategies.
- `frontend/src/lib/db.js` defines replace and merge persistence behavior.
- `frontend/src/routes/+page.svelte` is the integration point for user-triggered export and import actions.

## Open Questions

- Is JSON the long-term canonical backup format, or only the first supported format before OFX or other interchange options?
- Should the app eventually provide a dedicated backup education message, given the local-only storage risk?
- Should merge behavior become more selective if duplicate-like records become a real user problem?
