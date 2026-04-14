# Glossary

## Budget

The monthly spending amount assigned to a specific `YYYY-MM` period and stored in the `budgets` store.

## Transaction

A single income or expense record with type, amount, category, date, optional description, and creation timestamp.

## Expense

A transaction with `type = expense`. Expenses contribute to dashboard expense totals and monthly budget spending.

## Income

A transaction with `type = income`. Income contributes to dashboard income totals but does not count as monthly budget spending.

## Goal

A named savings target with a target amount, current progress amount, and achieved state.

## Current Month

The month derived from the user’s runtime browser date, used for dashboard monthly totals and default budget view.

## Offline-First

A product posture where the app remains useful after initial load without relying on continuous network access for core functionality.

## Local-Only Data

Application data stored in the browser via IndexedDB rather than on a remote server.

## Export

The action that serializes all application data into a downloadable JSON backup file.

## Import

The action that validates and writes a previously exported JSON data file into local storage, using replace or merge behavior when applicable.
