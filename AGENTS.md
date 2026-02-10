# AGENTS.md - AI Agent Guidelines

## Project Overview

"Mon Budget" is a personal budgeting PWA for teenagers. Full-stack application with:
- **Frontend**: SvelteKit 5 (JavaScript, not TypeScript) with static adapter, IndexedDB storage
- **Backend**: Rust with Axum 0.8, SQLite via sqlx (optional - frontend is local-first)
- **Locale**: French (fr-FR)

## Build & Run Commands

### Frontend (from `/frontend`)
```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
```

### Backend (from `/backend`)
```bash
cargo run            # Start server (http://0.0.0.0:3000)
cargo build --release # Release build
```

## Testing

### Framework: Playwright (E2E only)

Test files are in `/frontend/e2e/`.

```bash
npm run test:e2e                           # Run all tests
npx playwright test e2e/transactions.spec.ts  # Single file
npx playwright test -g "create-expense"    # By name pattern
npm run test:e2e:headed                    # With visible browser
npm run test:e2e:ui                        # Interactive UI mode
```

### Writing Tests
- Tests use French UI labels (e.g., "Ajouter", "Supprimer", "Aucune transaction")
- Use `data-testid` attributes when adding new testable elements
- Follow existing patterns in `e2e/*.spec.ts`

## Code Review Principles

From `.claude/instructions.md`:
- **Challenge** architecture and implementation choices actively
- **Flag** any compromise on strong typing or functional purity
- **Never validate** code without appropriate tests
- Provide **concrete alternatives** when identifying problems
- Be **token-efficient** - alert before expensive operations

## Code Style Guidelines

### Frontend (JavaScript/Svelte)

**Imports**
```javascript
import { onMount } from 'svelte';    // Svelte imports first
import { db } from '$lib/db.js';     // Then lib imports with $lib alias
```

**Svelte Component Structure**
```svelte
<script>
  // 1. Imports  2. Props/state  3. Reactive ($:)  4. Functions
</script>
<svelte:head><title>Page - Mon Budget</title></svelte:head>
<!-- Template -->
<style>/* Scoped styles */</style>
```

**Formatting**
- Tabs for indentation
- Single quotes, no semicolons
- camelCase for variables/functions, kebab-case for CSS classes

**Error Handling**
```javascript
try {
  result = await db.someOperation();
} catch (e) {
  error = e.message;
} finally {
  loading = false;
}
```

**Locale Formatting** (always fr-FR)
```javascript
new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
new Date(dateStr).toLocaleDateString('fr-FR')
```

### Backend (Rust)

**Imports**
```rust
use crate::{error::AppError, models::*, AppState};  // Crate first
use axum::{extract::State, Json};                    // Then external
```

**Error Handling**
```rust
pub enum AppError { BadRequest(String), Unauthorized(String), NotFound(String), Internal(String) }
// Convert via From trait: impl From<sqlx::Error> for AppError { ... }
```

**Models**
```rust
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Transaction {
    pub description: Option<String>,
    #[serde(rename = "type")]
    #[sqlx(rename = "type")]
    pub transaction_type: String,
}
```

**Validation** - validate in handlers, return `AppError::BadRequest`
```rust
if req.amount <= 0.0 {
    return Err(AppError::BadRequest("Amount must be positive".to_string()));
}
```

## CSS Guidelines

**Variables** (in `app.css`): `--primary`, `--secondary`, `--danger`, `--bg`, `--bg-card`, `--text`, `--text-muted`, `--radius`

**Utility Classes**: `.card`, `.text-muted`, `.text-success`, `.text-danger`, `.mb-1`/`.mb-2`/`.mb-3`, `.flex`, `.flex-between`, `.grid`, `.grid-2`

## Database

**IndexedDB Stores** (frontend)
- `transactions` - keyPath: id (autoIncrement), indexes: date, type, category
- `budgets` - keyPath: month
- `goals` - keyPath: id (autoIncrement)

**SQLite Tables** (backend)
- `users`, `transactions`, `budgets`, `savings_goals`

## Environment Variables

```bash
JWT_SECRET=your-secret-key
DATABASE_URL=sqlite:./data/budget.db
RUST_LOG=info
```

## File Structure

```
frontend/src/
  lib/db.js           # IndexedDB wrapper
  routes/             # SvelteKit routes (+page.svelte, +layout.svelte)
  app.css             # Global styles
  service-worker.js   # PWA offline support

backend/src/
  main.rs             # Entry point, router
  db.rs, error.rs, models.rs
  routes/             # auth.rs, transactions.rs, budget.rs, goals.rs, dashboard.rs
```
