# PRD Question Backlog

Working list of unresolved product questions consolidated from the PRD set.

## How To Use

- Answer top to bottom unless a later question is urgent.
- When a question is resolved, update the source PRD and remove or mark it here.
- Prefer concrete decisions over open brainstorming.

## Tier 1 - Product Direction

### Q1. Who is the target user, exactly?

- Question:
  teenagers only, or a broader “lightweight personal budgeting” audience?
- Why it matters:
  affects product wording, examples, roadmap, and visual tone
- Source:
  `product/mon-budget.md`, `product/assumptions-and-gaps.md`

### Q2. What is the main product outcome?

- Question:
  habit formation, budgeting accuracy, or backup reliability?
- Why it matters:
  affects prioritization and success metrics
- Source:
  `product/mon-budget.md`

### Q3. Is OFX real roadmap or just backlog?

- Question:
  should OFX remain out of scope, become planned scope, or be dropped?
- Why it matters:
  affects export/import roadmap and interoperability positioning
- Source:
  `product/mon-budget.md`, `features/export-import.md`

## Tier 2 - Product Structure

### Q4. Should the dashboard become more navigational?

- Question:
  should the dashboard bar chart link to `/budget`, or should the dashboard stay summary-only?
- Why it matters:
  affects information architecture and user flow
- Source:
  `product/mon-budget.md`, `features/dashboard.md`, `features/budget.md`

### Q5. Should import/export stay on the dashboard?

- Question:
  keep backup actions on the dashboard, or move them to a dedicated settings/data screen if the product grows?
- Why it matters:
  affects dashboard scope and future navigation design
- Source:
  `features/dashboard.md`

### Q6. Should the dashboard show empty-state onboarding?

- Question:
  should the empty dashboard explain what to do next?
- Why it matters:
  affects first-run clarity
- Source:
  `features/dashboard.md`

## Tier 3 - Budget UX

### Q7. Should “no budget set” stay equivalent to zero?

- Question:
  keep the current zero-budget default, or distinguish “not set” from `0`?
- Why it matters:
  affects budget semantics and UX clarity
- Source:
  `features/budget.md`

### Q8. Is swipe month navigation worth investing in?

- Question:
  keep swipe as a secondary interaction, improve its onboarding, or de-emphasize it?
- Why it matters:
  affects mobile UX and testing priorities
- Source:
  `product/mon-budget.md`, `features/budget.md`

## Tier 4 - Goals Model

### Q9. Should goals remain manual?

- Question:
  should goals stay as manual progress trackers, or eventually connect to real financial flows?
- Why it matters:
  affects the product model and implementation complexity
- Source:
  `features/goals.md`

### Q10. Should achieved goals stay in the main list?

- Question:
  keep one list, or separate active and completed goals?
- Why it matters:
  affects list usability as data grows
- Source:
  `features/goals.md`

### Q11. Should goal updates stay fixed-step only?

- Question:
  keep `+1/+10/-1/-10`, or add free-form contribution input?
- Why it matters:
  affects mobile usability and speed
- Source:
  `features/goals.md`

## Tier 5 - Backup And Recovery

### Q12. Is JSON the long-term canonical backup format?

- Question:
  keep JSON as the main backup contract, or plan additional formats?
- Why it matters:
  affects portability and future import/export scope
- Source:
  `features/export-import.md`

### Q13. Does backup need stronger in-app guidance?

- Question:
  should the app actively teach users that local data can be lost without export?
- Why it matters:
  affects resilience and user expectations
- Source:
  `features/export-import.md`, `product/assumptions-and-gaps.md`

### Q14. Does merge need stricter conflict handling?

- Question:
  keep current merge behavior, or add duplicate/conflict handling later?
- Why it matters:
  affects recovery trust and data integrity expectations
- Source:
  `features/export-import.md`

## Tier 6 - Platform And Release Discipline

### Q15. Which offline/installability guarantees are hard requirements?

- Question:
  what must be guaranteed versus documented as best effort?
- Why it matters:
  affects release gates and QA scope
- Source:
  `features/pwa-offline.md`

### Q16. Should offline behavior get a deployed smoke test?

- Question:
  add a real post-deploy smoke test or keep current coverage as-is?
- Why it matters:
  affects release confidence
- Source:
  `features/pwa-offline.md`, `evidence/test-coverage-map.md`

### Q17. Is GitHub Pages still the long-term deployment target?

- Question:
  keep GitHub Pages as the target, or revisit hosting if product scope grows?
- Why it matters:
  affects deployment assumptions and future constraints
- Source:
  `features/pwa-offline.md`

## Suggested Next Session Order

1. Q1 target user
2. Q2 main product outcome
3. Q3 OFX roadmap status
4. Q7 no-budget semantics
5. Q8 swipe investment
6. Q12 backup format strategy
7. Q15 offline guarantees
