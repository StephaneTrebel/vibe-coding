# Feature PRD - Savings Goals

## Why This Feature Exists

Goals turn budgeting into progress toward something specific.

## Scope

- Create and delete goals
- Fixed target amount
- Manual progress updates
- Achieved state with distinct UI

## Requirements

- The feature must support creating a goal with:
  name and target amount.
- New goals must initialize with:
  `current_amount = 0` and `achieved = false`.
- Goals must be displayed in reverse creation order.
- Each goal card must show:
  goal name, current amount, target amount, progress bar, and progress percentage text.
- In-progress goals must expose fixed progress controls:
  `-10`, `-1`, `+1`, `+10`.
- Progress updates must persist to IndexedDB.
- Progress cannot go below `0`.
- A goal becomes achieved when `current_amount >= target_amount`.
- Achieved goals must:
  show the `Atteint !` badge,
  apply achieved visual styling,
  hide progress adjustment controls.
- The delete action must remain available even when a goal is achieved.
- The feature must expose an empty state when no goals exist.

## Progress Update Rules

- `newAmount = max(0, current_amount + delta)`
- `achieved = newAmount >= target_amount`
- Percentage display is based on `min((current_amount / target_amount) * 100, 100)`
- The progress bar uses a distinct completed style when the goal is achieved

## Acceptance Criteria

- Given no goals exist, when the user opens `/goals`, then the empty-state message is visible.
- Given the form is closed, when the user clicks `Nouvel objectif`, then the goal form opens.
- Given the user submits a valid goal name and target amount, when save completes, then a new goal card appears with `0% atteint`.
- Given the user reopens the form after creating a goal, when the form is shown, then the fields are reset.
- Given an in-progress goal, when the user clicks `+1`, then the current amount increases by one and the percentage updates.
- Given an in-progress goal, when the user clicks `+10`, then the current amount increases by ten and the percentage updates.
- Given an in-progress goal with non-zero progress, when the user clicks `-1` or `-10`, then the amount decreases accordingly.
- Given a goal at zero, when the user clicks a decrement control, then the value remains zero.
- Given progress reaches or exceeds the target amount, when the update completes, then the goal shows the achieved badge, achieved styling, completed progress bar, and hidden progress controls.
- Given an existing goal, when the user confirms deletion, then the goal is removed from the list.
- Given the deleted goal was the last one, when deletion completes, then the page returns to the empty state.

## Non-Goals

- Automatic funding from income transactions
- Goal categories or tags
- Deadline-based saving plans
- Goal sharing or social features
- Partial archive/completion history beyond the achieved state
- Transfer logic between goals and budget

## Verification Signals

- `frontend/e2e/goals.spec.ts` covers empty state, create flow, form toggle/reset, progress increments and decrements, zero floor, achieved state, hidden controls after completion, deletion, multiple goals, and validation errors.
- `frontend/src/routes/goals/+page.svelte` is the implementation source for creation, progress, and achieved-state rules.
- `frontend/src/lib/db.js` defines the persisted goal shape and defaults.

## Open Questions

- Should goals eventually connect to actual financial flows instead of manual progress buttons?
- Should achieved goals remain in the same list forever, or should the product eventually separate active and completed goals?
- Would mobile users benefit from different increment presets or a free-form contribution input?
