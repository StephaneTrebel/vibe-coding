# Test Coverage Map

## Coverage Principles

- Product requirements should map to observable behavior rather than implementation details.
- Existing E2E coverage is the main verification signal for this frontend-only application.
- `Covered`: directly tested
- `Partially covered`: only some paths tested
- `Uncovered`: described but not reliably tested

## Product Requirement To Test Mapping

| Requirement area                                      | Current evidence                                                | Coverage status   |
| ----------------------------------------------------- | --------------------------------------------------------------- | ----------------- |
| Dashboard balance, monthly totals, and history totals | `dashboard.spec.ts`, `integration.spec.ts`                      | Covered           |
| Recent transactions list and limit to five            | `dashboard.spec.ts` and project test inventory                  | Partially covered |
| Transactions empty state                              | `transactions.spec.ts`                                          | Covered           |
| Transaction type/category switching                   | `transactions.spec.ts`                                          | Covered           |
| Transaction CRUD                                      | `transactions.spec.ts`, project test inventory in `AGENTS.md`   | Partially covered |
| Budget current month display                          | `budget.spec.ts`                                                | Covered           |
| Budget save and update flows                          | `budget.spec.ts`                                                | Covered           |
| Budget remaining, overspend, and progress states      | `budget.spec.ts`                                                | Covered           |
| Budget month navigation                               | `budget.spec.ts`                                                | Covered           |
| Budget swipe gesture                                  | backlog in `plan.md`                                            | Uncovered         |
| Goals empty state                                     | `goals.spec.ts`                                                 | Covered           |
| Goal CRUD and progress controls                       | project test inventory in `AGENTS.md`                           | Partially covered |
| Desktop and mobile navigation                         | `navigation.spec.ts`                                            | Covered           |
| Chart conditional rendering                           | `charts.spec.ts`                                                | Covered           |
| Cross-page propagation of transaction changes         | `integration.spec.ts`                                           | Covered           |
| Export JSON payload and success state                 | `export-import.spec.ts`                                         | Covered           |
| Import validation and confirmation flows              | `export-import.spec.ts`                                         | Covered           |
| Offline/PWA behavior                                  | `NON_FUNCTIONAL_REQUIREMENTS.md`, service worker implementation | Partially covered |
| Accessibility on core pages                           | `accessibility.spec.ts`                                         | Covered           |

## Covered Behaviors

- Dashboard can display aggregate financial stats.
- Dashboard can display recent transactions and link to `/transactions`.
- Transactions page handles empty state and dynamic category switching by type.
- Budget page supports monthly budget entry, budget summary calculations, progress warnings, and month navigation.
- Navigation works on both desktop and mobile layouts.
- Charts are hidden when there is no usable data and shown when data exists.
- Export produces a valid application JSON payload.
- Import accepts valid app exports and rejects malformed or incompatible files.
- Core routes are scanned for accessibility regressions with axe-core.

## Partially Covered Behaviors

- Transaction CRUD evidence is split between specs and older coverage docs.
- Goals coverage is broader than the simplified coverage note suggests.
- Offline/PWA coverage exists, but not all claims are explicitly automated.
- Persistence-after-reload is still a known gap.

## Uncovered Behaviors

- Budget swipe navigation does not appear to have a dedicated E2E test yet.
- Multi-browser support is not yet established as a verified requirement.
- Deployed-site smoke coverage is still listed as backlog rather than implemented verification.
- Browser-closure persistence and IndexedDB unavailability handling remain difficult to verify and are not clearly automated.

## Candidate New Tests

- Add a dedicated E2E swipe test for `/budget`.
- Add a persistence-after-reload integration test covering transactions, budgets, and goals.
- Normalize CRUD coverage for transactions and goals so the evidence files reflect the actual suite.
- Decide whether offline/PWA checks should stay as E2E, build-time assertions, or documented manual checks.
- Add a lightweight smoke test against the deployed GitHub Pages site if deployment confidence becomes a release gate.
