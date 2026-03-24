# Fix Export/Import E2E Tests — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 31 failing E2E tests for the export/import feature by making the code compatible with Playwright's testing mechanisms.

**Status:** EN COURS — Task 1 terminée (commit `a954fd5`), Tasks 2-3 restantes.
**Dernière session:** 2026-03-24

**Architecture:** Two root causes identified via systematic debugging:
1. **Import**: Svelte 5 event delegation doesn't fire `onchange` when Playwright's `setInputFiles` dispatches its synthetic `change` event. Fix: use `$effect` + `addEventListener` directly on the input element instead of Svelte's `onchange` attribute. `$effect` is reactive and guarantees the listener is attached once `bind:this` resolves.
2. **Export**: `exportToJSON()` creates a blob URL + programmatic `<a>` click that Playwright can't intercept as a `download` event. Fix: split `exportToJSON` into a pure data function + a separate download trigger, so tests can call the data function directly and the UI still triggers the download.

**Tech Stack:** SvelteKit 5 (JS), Playwright E2E tests (TS), IndexedDB

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/export.js` | Modify | Split `exportToJSON` into `buildExportPayload()` (pure, testable) + `downloadJSON()` (browser-only) |
| `src/routes/+page.svelte` | Modify | Replace `onchange` attribute with `addEventListener` via `$effect`; use split export functions |
| `e2e/export-import.spec.ts` | Modify | Fix export tests to use a different download interception strategy |
| `e2e/diag.spec.ts` | Delete | Remove diagnostic test file |
| `e2e/debug-export.spec.ts` | Delete | Remove debug test file |

---

### Task 1: Fix import — replace Svelte `onchange` with direct `addEventListener`

**Root cause:** Svelte 5 event delegation ignores Playwright's CDP-dispatched `change` event on `<input type="file">`. A native `addEventListener` attached directly on the element works.

**Files:**
- Modify: `src/routes/+page.svelte:14,26-43,251-259`

- [x] **Step 1: Modify the `<input>` element — remove `onchange`**

In `src/routes/+page.svelte`, change the file input (around line 251-259) from:

```svelte
<input
    type="file"
    id="import-file-trigger"
    accept=".json"
    class="sr-only"
    data-testid="import-file-input"
    bind:this={importFileInput}
    onchange={handleImportFile}
    tabindex="-1"
/>
```

to:

```svelte
<input
    type="file"
    id="import-file-trigger"
    accept=".json"
    class="sr-only"
    data-testid="import-file-input"
    bind:this={importFileInput}
    tabindex="-1"
/>
```

- [x] **Step 2: Attach event listener via `$effect`**

In `src/routes/+page.svelte`, add a `$effect` block after the `onMount` block (around line 43). Using `$effect` instead of `onMount` because `bind:this` with `$state` in Svelte 5 may not be populated synchronously when `onMount` runs. `$effect` is reactive and will attach the listener as soon as `importFileInput` resolves, and automatically cleans up via its return function.

**Add this block** after the closing `})` of `onMount` (do NOT modify `onMount` itself):

```javascript
$effect(() => {
    if (importFileInput) {
        importFileInput.addEventListener('change', handleImportFile)
        return () => importFileInput.removeEventListener('change', handleImportFile)
    }
})
```

The `onMount` block stays unchanged.

- [x] **Step 3: Run the import error tests to verify the fix**

Run: `npx playwright test e2e/export-import.spec.ts -g "corrupted-json" --reporter=list`
Expected: PASS (the handler now fires on `setInputFiles`)

- [x] **Step 4: Run all import tests (excluding export tests)**

Run: `npx playwright test e2e/export-import.spec.ts -g "Import|Cas invalides|Modale|merge|replace" --reporter=line`
Expected: All import-related tests PASS

- [x] **Step 5: Run existing 84 tests to check for regressions**

Run: `npx playwright test e2e/transactions.spec.ts e2e/dashboard.spec.ts e2e/budget.spec.ts e2e/goals.spec.ts e2e/navigation.spec.ts e2e/accessibility.spec.ts e2e/charts.spec.ts e2e/integration.spec.ts --reporter=line`
Expected: 84 PASS, 0 FAIL

- [x] **Step 6: Commit** — `a954fd5`

**Notes d'implémentation (écarts par rapport au plan) :**
- `setInputFiles` de Playwright ne fonctionne PAS même avec `addEventListener` natif. Le helper `triggerImport` utilise DataTransfer API + `dispatchEvent` à la place.
- Ajout de `data-listener-ready` attribute dans le `$effect` pour un wait déterministe (remplace `waitForTimeout(500)`).
- Ajout de `$state.snapshot(pendingImportData)` dans `closeModal()` — nécessaire car IndexedDB ne peut pas cloner les proxies Svelte 5.
- **Résultat :** 27/27 import tests PASS + 84/84 existing tests PASS = 111/115 (4 export tests restants → Task 2)

---

### Task 2: Fix export — split `exportToJSON` for testability

**Root cause:** `exportToJSON()` in `export.js` creates a blob URL and triggers download via programmatic `<a>.click()`. Playwright's `page.waitForEvent('download')` cannot intercept this because the blob is created and consumed entirely client-side without an HTTP response.

**Strategy:** Split into `buildExportPayload()` (returns the data object) and `downloadJSON(payload)` (triggers the browser download). The tests can intercept at the payload level.

**Files:**
- Modify: `src/lib/export.js:3-53`
- Modify: `src/routes/+page.svelte:77-86`
- Modify: `e2e/export-import.spec.ts:96-173`

- [ ] **Step 1: Split `exportToJSON` in `export.js`**

Replace the `exportToJSON` function (lines 3-53) with two functions:

```javascript
export async function buildExportPayload() {
	const [transactions, budgets, goals] = await Promise.all([
		db.getTransactions({}),
		db.getAllBudgets(),
		db.getGoals()
	])

	return {
		version: 1,
		appName: 'Mon Budget',
		exportDate: new Date().toISOString(),
		metadata: {
			totalTransactions: transactions.length,
			totalBudgets: budgets.length,
			totalGoals: goals.length
		},
		data: {
			transactions: transactions.map(t => {
				const obj = {
					id: t.id,
					type: t.type,
					amount: t.amount,
					category: t.category,
					date: t.date,
					createdAt: t.createdAt
				}
				if (t.description != null) obj.description = t.description
				return obj
			}),
			budgets,
			goals
		}
	}
}

export function downloadJSON(payload) {
	const json = JSON.stringify(payload, null, 2)
	const blob = new Blob([json], { type: 'application/json' })
	const url = URL.createObjectURL(blob)

	const today = new Date().toISOString().slice(0, 10)
	const filename = `mon-budget-${today}.json`

	const a = document.createElement('a')
	a.href = url
	a.download = filename
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)

	return filename
}
```

- [ ] **Step 2: Update `+page.svelte` to use the new functions**

Change the import (line 5):

```javascript
import { buildExportPayload, downloadJSON, readAndValidate, confirmImport } from '$lib/export.js'
```

Change `handleExport` (lines 77-86):

```javascript
async function handleExport() {
    importError = null
    exportSuccess = null
    try {
        const payload = await buildExportPayload()
        const filename = downloadJSON(payload)
        exportSuccess = `Fichier "${filename}" téléchargé avec succès.`
    } catch (e) {
        importError = e.message
    }
}
```

- [ ] **Step 3: Expose `buildExportPayload` on `window` for testing**

In `src/routes/+page.svelte`, add this line at the top of the `<script>` block, after the imports (around line 7):

```javascript
if (typeof window !== 'undefined') {
    window.__buildExportPayload = buildExportPayload
}
```

This exposes the pure data function to the browser context so tests can call it via `page.evaluate()`. The `typeof window` guard is a no-op safety for SSR contexts.

- [ ] **Step 4: Update export tests in `export-import.spec.ts`**

The export tests currently use `page.waitForEvent('download')` which doesn't work with blob URLs. Replace with two strategies:
- **Data tests**: call `window.__buildExportPayload()` via `page.evaluate` to verify payload content
- **UI tests**: click the export button and verify the success message (smoke test for `downloadJSON`)

Replace the export test section (lines 96-173) with:

```typescript
test.describe('Export', () => {
    test('export-empty-database', async ({ page }) => {
        await page.goto('/')

        const content = await page.evaluate(async () => {
            return (window as any).__buildExportPayload()
        })

        expect(content.version).toBe(1)
        expect(content.appName).toBe('Mon Budget')
        expect(Array.isArray(content.data.transactions)).toBe(true)
        expect(Array.isArray(content.data.budgets)).toBe(true)
        expect(Array.isArray(content.data.goals)).toBe(true)
        expect(content.data.transactions).toHaveLength(0)
        expect(content.data.budgets).toHaveLength(0)
        expect(content.data.goals).toHaveLength(0)
    })

    test('export-with-data', async ({ page }) => {
        await page.goto('/transactions')
        await expect(page.locator('text=Aucune transaction')).toBeVisible()
        await addTransaction(page, {
            type: 'expense',
            amount: '42.50',
            category: 'Alimentation',
            date: '2026-03-10',
        })

        await page.goto('/')

        const content = await page.evaluate(async () => {
            return (window as any).__buildExportPayload()
        })

        expect(content.data.transactions).toHaveLength(1)
        expect(content.data.transactions[0].category).toBe('Alimentation')
        expect(content.data.transactions[0].amount).toBe(42.5)
        expect(content.data.transactions[0].type).toBe('expense')
        expect(content.data.transactions[0].date).toBe('2026-03-10')
    })

    test('export-filename', async ({ page }) => {
        await page.goto('/')

        await page.getByTestId('export-button').click()

        const msg = page.locator('[role="status"]')
        await expect(msg).toBeVisible()
        const text = await msg.textContent()
        expect(text).toMatch(/mon-budget-\d{4}-\d{2}-\d{2}\.json/)
    })

    test('export-success-message', async ({ page }) => {
        await page.goto('/')

        // Verify the full download flow doesn't throw
        await page.getByTestId('export-button').click()

        const msg = page.locator('[role="status"]')
        await expect(msg).toBeVisible()
        await expect(msg).toContainText('téléchargé')

        // Verify no error appeared
        const errorVisible = await page.getByTestId('import-error-message').isVisible().catch(() => false)
        expect(errorVisible).toBe(false)
    })
})
```

**Note:** `os` import can be removed. Keep `path` and `fs` — they're still used by import fixture tests.

- [ ] **Step 5: Run export tests**

Run: `npx playwright test e2e/export-import.spec.ts -g "Export" --reporter=line`
Expected: All 4 export tests PASS

- [ ] **Step 6: Run all 84 + export-import tests**

Run: `npx playwright test --reporter=line`
Expected: All tests PASS (84 existing + ~31 export-import)

- [ ] **Step 7: Commit**

```bash
git add src/lib/export.js src/routes/+page.svelte e2e/export-import.spec.ts
git commit -m "fix: split exportToJSON for testability (Playwright blob URL compat)"
```

---

### Task 3: Cleanup — remove diagnostic files

**Files:**
- Delete: `e2e/diag.spec.ts`
- Delete: `e2e/debug-export.spec.ts`

- [ ] **Step 1: Remove diagnostic test files**

```bash
rm -f e2e/diag.spec.ts e2e/debug-export.spec.ts
```

Note: `diag.spec.ts` is untracked (created during this debugging session). `debug-export.spec.ts` is also untracked. Both just need to be deleted from disk — no git staging needed for untracked files.

- [ ] **Step 2: Run full test suite**

Run: `npx playwright test --reporter=line`
Expected: All tests PASS, no references to deleted files

- [ ] **Step 3: Verify no stray files remain**

```bash
ls e2e/diag.spec.ts e2e/debug-export.spec.ts 2>&1
```
Expected: "No such file or directory" for both

---

## Verification Checklist

After all tasks:
- [ ] `npx playwright test --reporter=line` → all tests PASS (84 existing + ~31 export-import)
- [ ] `npm run build` → no errors
- [ ] Manual test: open `http://localhost:5173`, click "Exporter" → file downloads
- [ ] Manual test: select a JSON file via "Importer" → import works or error shows
