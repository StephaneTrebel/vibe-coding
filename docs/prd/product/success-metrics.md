# Success Metrics

## Measurement Principles

- Only metrics with a credible source, owner, and review cadence should be treated as real product metrics.
- In this repo state, most metrics are proposed rather than measured.
- Telemetry may be intentionally absent in a local-first app.

## Current Observable Signals

- The repo has broad E2E coverage for core product flows.
- Accessibility scans currently report zero axe violations on the main routes.
- Export/import behavior is validated in dedicated tests.
- Responsive navigation and chart visibility are covered by targeted tests.

## Metric Gaps

- No measured active users
- No measured retention
- No measured install rate
- No measured export/import adoption
- No measured completion rate for transaction entry, budget setup, or goal creation
- No measured recovery success after data loss scenarios
- No measured performance baseline from production usage

## Proposed Product Metrics

- Transaction logging activation:
  percentage of new users who create at least one transaction in their first session
- Budget setup adoption:
  percentage of active users who set a monthly budget
- Goal adoption:
  percentage of active users who create at least one savings goal
- Backup readiness:
  percentage of active users who export data at least once
- Restoration success:
  percentage of import attempts that complete successfully

## Proposed Quality Metrics

- E2E pass rate on core flows
- Accessibility violation count on core routes
- Import validation failure rate during test runs
- Build success rate for GitHub Pages deployment
- Deployed smoke-test pass rate if such a gate is added

## Review Cadence

- Per change set:
  test pass rate and accessibility results
- Per release:
  build/deploy health and any manual smoke verification
- Per product review cycle:
  reassess whether lightweight user research or explicit telemetry is needed

## Owners

- Product framing: repository maintainer
- Quality verification: release owner
- Usage metrics: unassigned
