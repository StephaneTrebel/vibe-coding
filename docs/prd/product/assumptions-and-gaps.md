# Assumptions And Gaps

## Confirmed Facts

- The app is a frontend-only budgeting PWA with IndexedDB storage.
- The current shipped feature set centers on dashboard, transactions, monthly budget, goals, and JSON export/import.
- The product is localized in French and deployed as a static site with `BASE_PATH` support.
- The app is intentionally local-first and does not use authentication or a backend API.
- Export/import is already implemented, despite older docs implying it was future work.

## Strong Inferences

- The product is intentionally optimized for simplicity over feature breadth.
- Privacy and low operational burden are core product choices, not incidental implementation details.
- Teenagers are the intended primary audience, based on project documentation and category choices such as allowance and small job income.
- The budgeting model is meant for day-to-day personal finance rather than formal accounting.

## Weak Inferences

- The actual active user base is teenagers rather than a broader casual-budgeting audience.
- The main success outcome is habit formation rather than backup reliability or educational value.
- Swipe navigation materially improves usability instead of being a nice interaction detail.
- The dashboard should become the main hub for deeper navigation rather than staying summary-only.

## Missing Product Evidence

- No explicit product brief or original PRD is present in the repo.
- No documented prioritization rationale explains why current features won over alternatives.
- No canonical roadmap turns backlog items into dated or owned product commitments.
- Some historical notes mix shipped scope, backlog, and technical memory.

## Missing User Evidence

- No interview notes, usability sessions, persona docs, or survey outputs are present.
- No direct evidence validates the “teenager” framing beyond internal documentation.
- No evidence shows which feature users value most: dashboard summary, budget control, goals, or backup.

## Missing Metric Baselines

- No adoption baseline
- No retention baseline
- No export/import usage baseline
- No task success or completion-time baseline
- No error-rate baseline for import validation or failed CRUD flows

Current metrics are therefore product hypotheses, not measured performance indicators.

## Blocking Questions

- None for documenting the current shipped product shape.

## Non-Blocking Questions

- Is the target user definition intentionally “teenagers” or better expressed as “first-time personal budgeters”?
- Should the product treat backup education as a first-class UX problem?
- Which backlog items are exploratory versus genuinely intended next-scope items?
- Should “no budget set” become a distinct UX state instead of the current zero-budget default?
