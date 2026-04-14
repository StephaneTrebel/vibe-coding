# Mon Budget - Product PRD

## Why Now

`Mon Budget` is a small local-first budgeting app for teenagers and first-time personal budgeters. It avoids account setup, backend infrastructure, and constant connectivity.

The repo shows a deliberate pivot toward:

- low complexity
- stronger privacy
- offline use after first load
- manual backup via export/import

## Problem Statement

Users need something lighter than bank-connected finance apps or spreadsheets to:

- tracking small day-to-day income and expenses
- setting a monthly spending limit and seeing progress against it
- saving toward named goals
- retaining control of data locally instead of depending on an account-based service

Without a product source of truth, the repo risks drift between shipped behavior, backlog, and documentation.

## Target Users

- Primary target user:
  teenagers managing personal spending, allowance, gifts, small job income, and short-term savings goals
- Secondary likely user:
  privacy-conscious individuals who prefer a lightweight, local-only budgeting tool

Evidence note: “teenagers” is documented intent, not validated user research.

## Product Context

The product is a French frontend-only PWA with four core surfaces:

- dashboard for summary and recent activity
- transaction management
- monthly budget tracking
- savings goals

The dashboard also owns JSON export/import, which is the current backup mechanism.

## Goals

- Help users record income and expenses quickly with minimal setup.
- Help users understand current financial position through a clear dashboard summary.
- Help users manage a monthly spending cap and see when they are approaching or exceeding it.
- Help users save toward short-term goals with visible progress and lightweight controls.
- Preserve privacy and low operating cost by keeping the product local-first and backend-free.
- Provide a practical backup path through export/import of application data.

## Non-Goals

- Bank account aggregation or automatic transaction import from financial institutions
- Multi-device synchronization
- Shared budgets or collaborative household finance
- Complex financial planning, debt modeling, or investment tracking
- Advanced analytics beyond the current summary and chart surfaces
- OFX support in the current shipped scope
- Server-side accounts, authentication, or cloud backup

These exclusions are consistent with the observed local-first architecture and current backlog notes.

## Core User Journeys

1. Log transactions.
2. Check balance and monthly activity.
3. Manage a monthly budget.
4. Track savings goals.
5. Back up or restore local data.

## Functional Scope Summary

- Dashboard: balance, monthly totals, history totals, recent transactions, bar chart, export/import
- Transactions: create, edit, delete, list
- Budget: monthly budget, spending summary, warnings, month navigation, charts
- Goals: create, delete, progress updates, achieved state
- Navigation: desktop navbar, mobile bottom nav
- Portability: JSON export/import
- PWA: service worker, manifest, static deployment

Shipped scope is strongest where it is directly backed by code and E2E tests. Areas like swipe verification and some persistence claims remain partially evidenced.

## Non-Functional Requirements

- Offline-first after first load
- Local persistence via IndexedDB
- French locale
- Mobile usability
- Static deployment with GitHub Pages subpath support
- Basic accessibility coverage
- Charts hidden when there is no meaningful data

## Constraints

- Frontend-only
- IndexedDB-only storage
- No auth, backend, or sync
- GitHub Pages with `BASE_PATH`
- Runtime current-month logic
- Import/export format locked to app name `Mon Budget` and version `1`

## Risks

- Local data loss if browser storage is cleared
- Missing user research and metric baselines
- Documentation drift versus implementation
- Partial verification for some behaviors
- Limited appeal for users expecting sync
- Time-coupled month and locale behavior

## Open Questions

- Teenagers only, or broader lightweight-budgeting audience?
- Which outcome matters most: habit, budgeting accuracy, or backup reliability?
- Is OFX real roadmap or just backlog?
- Should the dashboard become a deeper navigation hub?
- Is swipe worth further investment?

## Recommendation

- Keep local-first and no-backend as defining choices
- Treat export/import as core capability
- Keep scope focused on transactions, budget, goals, and lightweight charts
- Do not expand into sync, banking integrations, or complex planning without a new product decision
