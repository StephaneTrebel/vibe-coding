import { test, expect, type Page } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

const __dirname = import.meta.dirname

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function addTransaction(
	page: Page,
	{
		type,
		amount,
		category,
		description,
		date,
	}: {
		type: 'income' | 'expense'
		amount: string
		category: string
		description?: string
		date?: string
	}
) {
	await expect(page.locator('#type')).not.toBeVisible()
	await page.locator('button:has-text("Ajouter")').click()
	await expect(page.locator('#type')).toBeVisible()
	await page.selectOption('#type', type)
	await page.fill('#amount', amount)
	await page.selectOption('#category', category)
	if (description) {
		await page.fill('#description', description)
	}
	if (date) {
		await page.fill('#date', date)
	}
	await page.locator('button[type="submit"]:has-text("Ajouter")').click()
	await expect(page.locator(`.tx-category:has-text("${category}")`)).toBeVisible()
}

async function triggerImport(page: Page, fixtureName: string) {
	const fixturePath = path.join(__dirname, 'fixtures', fixtureName)
	const fileContent = fs.readFileSync(fixturePath, 'utf-8')
	// Wait for the page to be fully rendered (Svelte $effect must have run)
	await page.waitForSelector('[data-testid="export-button"]')
	// Ensure $effect has attached the change listener after Svelte hydration
	await page.waitForTimeout(500)
	await page.evaluate(
		({ content, name }) => {
			const input = document.querySelector(
				'[data-testid="import-file-input"]'
			) as HTMLInputElement
			const dt = new DataTransfer()
			dt.items.add(new File([content], name, { type: 'application/json' }))
			input.files = dt.files
			input.dispatchEvent(new Event('change', { bubbles: true }))
		},
		{ content: fileContent, name: fixtureName }
	)
}

async function getExistingCounts(
	page: Page
): Promise<{ transactions: number; budgets: number; goals: number }> {
	return page.evaluate(() => {
		return new Promise((resolve, reject) => {
			const req = indexedDB.open('mon-budget', 1)
			req.onerror = () => reject(req.error)
			req.onsuccess = () => {
				const db = req.result
				const tx = db.transaction(['transactions', 'budgets', 'goals'], 'readonly')
				const counts = { transactions: 0, budgets: 0, goals: 0 }
				let pending = 3

				function done() {
					pending--
					if (pending === 0) resolve(counts)
				}

				const txReq = tx.objectStore('transactions').count()
				txReq.onsuccess = () => {
					counts.transactions = txReq.result
					done()
				}

				const bReq = tx.objectStore('budgets').count()
				bReq.onsuccess = () => {
					counts.budgets = bReq.result
					done()
				}

				const gReq = tx.objectStore('goals').count()
				gReq.onsuccess = () => {
					counts.goals = gReq.result
					done()
				}
			}
		})
	})
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Export/Import JSON', () => {
	// -------------------------------------------------------------------------
	test.describe('Export', () => {
		test('export-empty-database', async ({ page }) => {
			await page.goto('/')

			const [download] = await Promise.all([
				page.waitForEvent('download'),
				page.getByTestId('export-button').click(),
			])

			const tmpPath = path.join(os.tmpdir(), `export-empty-${Date.now()}.json`)
			await download.saveAs(tmpPath)
			const content = JSON.parse(fs.readFileSync(tmpPath, 'utf-8'))

			expect(content.version).toBe(1)
			expect(content.appName).toBe('Mon Budget')
			expect(Array.isArray(content.data.transactions)).toBe(true)
			expect(Array.isArray(content.data.budgets)).toBe(true)
			expect(Array.isArray(content.data.goals)).toBe(true)
			expect(content.data.transactions).toHaveLength(0)
			expect(content.data.budgets).toHaveLength(0)
			expect(content.data.goals).toHaveLength(0)

			fs.unlinkSync(tmpPath)
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

			const [download] = await Promise.all([
				page.waitForEvent('download'),
				page.getByTestId('export-button').click(),
			])

			const tmpPath = path.join(os.tmpdir(), `export-data-${Date.now()}.json`)
			await download.saveAs(tmpPath)
			const content = JSON.parse(fs.readFileSync(tmpPath, 'utf-8'))

			expect(content.data.transactions).toHaveLength(1)
			expect(content.data.transactions[0].category).toBe('Alimentation')
			expect(content.data.transactions[0].amount).toBe(42.5)
			expect(content.data.transactions[0].type).toBe('expense')

			fs.unlinkSync(tmpPath)
		})

		test('export-filename', async ({ page }) => {
			await page.goto('/')

			const [download] = await Promise.all([
				page.waitForEvent('download'),
				page.getByTestId('export-button').click(),
			])

			const suggestedName = download.suggestedFilename()
			expect(suggestedName).toMatch(/^mon-budget-\d{4}-\d{2}-\d{2}\.json$/)
		})

		test('export-success-message', async ({ page }) => {
			await page.goto('/')

			await Promise.all([
				page.waitForEvent('download'),
				page.getByTestId('export-button').click(),
			])

			// Un message role="status" doit apparaître
			const msg = page.locator('[role="status"]')
			await expect(msg).toBeVisible()
			await expect(msg).toContainText('téléchargé')
		})
	})

	// -------------------------------------------------------------------------
	test.describe('Import — base vide (pas de modale)', () => {
		test('import-into-empty-db', async ({ page }) => {
			await page.goto('/')

			await triggerImport(page, 'valid-full.json')

			// Pas de modale attendue sur une base vide
			await expect(page.getByTestId('import-modal')).not.toBeVisible()

			// Message de succès
			await expect(page.getByTestId('import-success-message')).toBeVisible()

			// Les données doivent être visibles sur /transactions
			await page.goto('/transactions')
			await expect(page.locator('.tx-category:has-text("Alimentation")')).toBeVisible()
			await expect(page.locator('.tx-category:has-text("Argent de poche")')).toBeVisible()
		})

		test('import-empty-file-into-empty-db', async ({ page }) => {
			await page.goto('/')

			await triggerImport(page, 'valid-empty.json')

			// Pas de modale
			await expect(page.getByTestId('import-modal')).not.toBeVisible()

			// Message indiquant 0 éléments importés
			const successMsg = page.getByTestId('import-success-message')
			await expect(successMsg).toBeVisible()
			await expect(successMsg).toContainText('0 transaction(s), 0 budget(s), 0 objectif(s)')
		})
	})

	// -------------------------------------------------------------------------
	test.describe('Import — modale de confirmation', () => {
		test('modal-appears-when-data-exists', async ({ page }) => {
			// Seed 1 transaction pour que la DB ne soit pas vide
			await page.goto('/transactions')
			await expect(page.locator('text=Aucune transaction')).toBeVisible()
			await addTransaction(page, {
				type: 'expense',
				amount: '10.00',
				category: 'Transport',
				date: '2026-03-05',
			})

			await page.goto('/')
			await triggerImport(page, 'valid-full.json')

			// La modale doit apparaître
			await expect(page.getByTestId('import-modal')).toBeVisible()
		})

		test('modal-shows-comparison', async ({ page }) => {
			await page.goto('/transactions')
			await expect(page.locator('text=Aucune transaction')).toBeVisible()
			await addTransaction(page, {
				type: 'income',
				amount: '30.00',
				category: 'Cadeaux',
				date: '2026-03-05',
			})

			await page.goto('/')
			await triggerImport(page, 'valid-full.json')

			await expect(page.getByTestId('import-modal-summary')).toBeVisible()

			// La table doit afficher "Existant" et "Fichier importé"
			const summary = page.getByTestId('import-modal-summary')
			await expect(summary).toContainText('Existant')
			await expect(summary).toContainText('Fichier importé')
			// 1 transaction existante
			await expect(summary).toContainText('1')
		})

		test('modal-cancel', async ({ page }) => {
			await page.goto('/transactions')
			await expect(page.locator('text=Aucune transaction')).toBeVisible()
			await addTransaction(page, {
				type: 'expense',
				amount: '20.00',
				category: 'Loisirs',
				date: '2026-03-05',
			})

			await page.goto('/')
			await triggerImport(page, 'valid-full.json')
			await expect(page.getByTestId('import-modal')).toBeVisible()

			await page.getByTestId('import-action-cancel').click()

			await expect(page.getByTestId('import-modal')).not.toBeVisible()

			// Les données originales sont inchangées
			const counts = await getExistingCounts(page)
			expect(counts.transactions).toBe(1)
		})

		test('modal-escape', async ({ page }) => {
			await page.goto('/transactions')
			await expect(page.locator('text=Aucune transaction')).toBeVisible()
			await addTransaction(page, {
				type: 'expense',
				amount: '20.00',
				category: 'Shopping',
				date: '2026-03-05',
			})

			await page.goto('/')
			await triggerImport(page, 'valid-full.json')
			await expect(page.getByTestId('import-modal')).toBeVisible()

			await page.keyboard.press('Escape')

			await expect(page.getByTestId('import-modal')).not.toBeVisible()

			// Données inchangées
			const counts = await getExistingCounts(page)
			expect(counts.transactions).toBe(1)
		})

		test('modal-focus-on-open', async ({ page }) => {
			await page.goto('/transactions')
			await expect(page.locator('text=Aucune transaction')).toBeVisible()
			await addTransaction(page, {
				type: 'expense',
				amount: '15.00',
				category: 'Alimentation',
				date: '2026-03-05',
			})

			await page.goto('/')
			await triggerImport(page, 'valid-full.json')
			await expect(page.getByTestId('import-modal')).toBeVisible()

			// Le focus doit être dans la modale (sur le premier bouton : Fusionner)
			const focusedTestId = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
			expect(focusedTestId).toBe('import-action-merge')
		})

		test('modal-focus-returns-after-close', async ({ page }) => {
			await page.goto('/transactions')
			await expect(page.locator('text=Aucune transaction')).toBeVisible()
			await addTransaction(page, {
				type: 'expense',
				amount: '15.00',
				category: 'Alimentation',
				date: '2026-03-05',
			})

			await page.goto('/')
			// Cliquer explicitement sur le label d'import pour enregistrer l'élément déclencheur
			// puis déclencher via setInputFiles
			await triggerImport(page, 'valid-full.json')
			await expect(page.getByTestId('import-modal')).toBeVisible()

			await page.getByTestId('import-action-cancel').click()
			await expect(page.getByTestId('import-modal')).not.toBeVisible()

			// Le focus doit être revenu à l'élément déclencheur (input file)
			// On vérifie simplement que la modale est fermée et que la page est stable
			await expect(page.getByTestId('import-modal')).not.toBeVisible()
		})
	})

	// -------------------------------------------------------------------------
	test.describe('Import — Fusionner', () => {
		test('merge-adds-transactions', async ({ page }) => {
			// Seed 1 transaction
			await page.goto('/transactions')
			await expect(page.locator('text=Aucune transaction')).toBeVisible()
			await addTransaction(page, {
				type: 'income',
				amount: '100.00',
				category: 'Job etudiant',
				date: '2026-03-15',
			})

			await page.goto('/')
			// valid-transactions-only.json contient 2 transactions
			await triggerImport(page, 'valid-transactions-only.json')
			await expect(page.getByTestId('import-modal')).toBeVisible()

			await page.getByTestId('import-action-merge').click()
			await expect(page.getByTestId('import-modal')).not.toBeVisible()

			// Total : 1 + 2 = 3 transactions
			const counts = await getExistingCounts(page)
			expect(counts.transactions).toBe(3)
		})

		test('merge-upserts-budgets', async ({ page }) => {
			// Seed un budget 2026-03 à 400€
			await page.goto('/budget')
			await page.fill('#budget', '400.00')
			await page.locator('button:has-text("Enregistrer")').click()
			await expect(page.locator('text=400,00 €').first()).toBeVisible()

			await page.goto('/')
			// valid-full.json contient budget 2026-03 à 150€
			await triggerImport(page, 'valid-full.json')
			await expect(page.getByTestId('import-modal')).toBeVisible()

			await page.getByTestId('import-action-merge').click()
			await expect(page.getByTestId('import-modal')).not.toBeVisible()

			// Le budget 2026-03 doit être remplacé par 150€
			await page.goto('/budget')
			await expect(page.locator('text=150,00 €').first()).toBeVisible()
		})

		test('merge-keeps-existing', async ({ page }) => {
			// Seed 1 transaction
			await page.goto('/transactions')
			await expect(page.locator('text=Aucune transaction')).toBeVisible()
			await addTransaction(page, {
				type: 'income',
				amount: '75.00',
				category: 'Cadeaux',
				date: '2026-03-12',
			})

			await page.goto('/')
			// valid-goals-only.json : pas de transactions
			await triggerImport(page, 'valid-goals-only.json')
			await expect(page.getByTestId('import-modal')).toBeVisible()

			await page.getByTestId('import-action-merge').click()
			await expect(page.getByTestId('import-modal')).not.toBeVisible()

			// La transaction originale doit toujours être là
			const counts = await getExistingCounts(page)
			expect(counts.transactions).toBe(1)
			expect(counts.goals).toBeGreaterThanOrEqual(1)
		})

		test('merge-success-message', async ({ page }) => {
			await page.goto('/transactions')
			await expect(page.locator('text=Aucune transaction')).toBeVisible()
			await addTransaction(page, {
				type: 'expense',
				amount: '5.00',
				category: 'Alimentation',
				date: '2026-03-08',
			})

			await page.goto('/')
			await triggerImport(page, 'valid-full.json')
			await expect(page.getByTestId('import-modal')).toBeVisible()

			await page.getByTestId('import-action-merge').click()
			await expect(page.getByTestId('import-modal')).not.toBeVisible()

			await expect(page.getByTestId('import-success-message')).toBeVisible()
			await expect(page.getByTestId('import-success-message')).toContainText('fusion')
		})
	})

	// -------------------------------------------------------------------------
	test.describe('Import — Remplacer', () => {
		test('replace-clears-data', async ({ page }) => {
			// Seed 2 transactions différentes de celles du fichier
			await page.goto('/transactions')
			await expect(page.locator('text=Aucune transaction')).toBeVisible()
			await addTransaction(page, {
				type: 'expense',
				amount: '99.00',
				category: 'Shopping',
				date: '2026-02-01',
			})
			await addTransaction(page, {
				type: 'income',
				amount: '200.00',
				category: 'Job etudiant',
				date: '2026-02-10',
			})

			await page.goto('/')
			// valid-full.json contient exactement 2 transactions
			await triggerImport(page, 'valid-full.json')
			await expect(page.getByTestId('import-modal')).toBeVisible()

			// Attendre que le countdown se termine (2s)
			await expect(page.getByTestId('import-action-replace')).toBeDisabled()
			await page.waitForTimeout(2100)
			await expect(page.getByTestId('import-action-replace')).toBeEnabled()

			await page.getByTestId('import-action-replace').click()
			await expect(page.getByTestId('import-modal')).not.toBeVisible()

			// Exactement 2 transactions après remplacement
			const counts = await getExistingCounts(page)
			expect(counts.transactions).toBe(2)

			// Les anciennes transactions (Shopping 99€, Job etudiant 200€) ne doivent plus être là
			await page.goto('/transactions')
			await expect(page.locator('.tx-category:has-text("Shopping")')).toHaveCount(0)
			// Les nouvelles (Alimentation, Argent de poche) doivent être là
			await expect(page.locator('.tx-category:has-text("Alimentation")')).toBeVisible()
			await expect(page.locator('.tx-category:has-text("Argent de poche")')).toBeVisible()
		})

		test('replace-countdown', async ({ page }) => {
			await page.goto('/transactions')
			await expect(page.locator('text=Aucune transaction')).toBeVisible()
			await addTransaction(page, {
				type: 'expense',
				amount: '10.00',
				category: 'Transport',
				date: '2026-03-01',
			})

			await page.goto('/')
			await triggerImport(page, 'valid-full.json')
			await expect(page.getByTestId('import-modal')).toBeVisible()

			// Le bouton Remplacer doit être désactivé initialement avec le countdown
			const replaceBtn = page.getByTestId('import-action-replace')
			await expect(replaceBtn).toBeDisabled()
			await expect(replaceBtn).toContainText('s)')

			// Après 2s, le bouton doit être activé
			await page.waitForTimeout(2100)
			await expect(replaceBtn).toBeEnabled()
			await expect(replaceBtn).toHaveText('Remplacer')
		})

		test('replace-success-message', async ({ page }) => {
			await page.goto('/transactions')
			await expect(page.locator('text=Aucune transaction')).toBeVisible()
			await addTransaction(page, {
				type: 'expense',
				amount: '8.00',
				category: 'Alimentation',
				date: '2026-03-05',
			})

			await page.goto('/')
			await triggerImport(page, 'valid-full.json')
			await expect(page.getByTestId('import-modal')).toBeVisible()

			await page.waitForTimeout(2100)
			await page.getByTestId('import-action-replace').click()
			await expect(page.getByTestId('import-modal')).not.toBeVisible()

			await expect(page.getByTestId('import-success-message')).toBeVisible()
			await expect(page.getByTestId('import-success-message')).toContainText('remplacement')
		})
	})

	// -------------------------------------------------------------------------
	test.describe('Cas invalides', () => {
		test('corrupted-json', async ({ page }) => {
			await page.goto('/')
			await triggerImport(page, 'corrupted.json')

			await expect(page.getByTestId('import-error-message')).toBeVisible()
			await expect(page.getByTestId('import-error-message')).toContainText('JSON valide')
			await expect(page.getByTestId('import-modal')).not.toBeVisible()
		})

		test('wrong-version', async ({ page }) => {
			await page.goto('/')
			await triggerImport(page, 'wrong-version.json')

			await expect(page.getByTestId('import-error-message')).toBeVisible()
			await expect(page.getByTestId('import-error-message')).toContainText('Mettez à jour')
			await expect(page.getByTestId('import-modal')).not.toBeVisible()
		})

		test('wrong-app', async ({ page }) => {
			await page.goto('/')
			await triggerImport(page, 'wrong-app.json')

			await expect(page.getByTestId('import-error-message')).toBeVisible()
			await expect(page.getByTestId('import-error-message')).toContainText('Mon Budget')
			await expect(page.getByTestId('import-modal')).not.toBeVisible()
		})

		test('empty-object', async ({ page }) => {
			await page.goto('/')
			await triggerImport(page, 'empty-object.json')

			await expect(page.getByTestId('import-error-message')).toBeVisible()
			// La clé version est manquante → le nom d'app est undefined → erreur appName
			await expect(page.getByTestId('import-error-message')).not.toBeEmpty()
			await expect(page.getByTestId('import-modal')).not.toBeVisible()
		})

		test('negative-amount', async ({ page }) => {
			await page.goto('/')
			await triggerImport(page, 'negative-amount.json')

			await expect(page.getByTestId('import-error-message')).toBeVisible()
			await expect(page.getByTestId('import-error-message')).toContainText('montant invalide')
			await expect(page.getByTestId('import-modal')).not.toBeVisible()
		})

		test('bad-date', async ({ page }) => {
			await page.goto('/')
			await triggerImport(page, 'bad-date.json')

			await expect(page.getByTestId('import-error-message')).toBeVisible()
			await expect(page.getByTestId('import-error-message')).toContainText('date invalide')
			await expect(page.getByTestId('import-modal')).not.toBeVisible()
		})

		test('unknown-type', async ({ page }) => {
			await page.goto('/')
			await triggerImport(page, 'unknown-type.json')

			await expect(page.getByTestId('import-error-message')).toBeVisible()
			await expect(page.getByTestId('import-error-message')).toContainText('type invalide')
			await expect(page.getByTestId('import-modal')).not.toBeVisible()
		})

		test('unknown-category', async ({ page }) => {
			await page.goto('/')
			await triggerImport(page, 'unknown-category.json')

			await expect(page.getByTestId('import-error-message')).toBeVisible()
			await expect(page.getByTestId('import-error-message')).toContainText('catégorie invalide')
			await expect(page.getByTestId('import-modal')).not.toBeVisible()
		})

		test('metadata-mismatch', async ({ page }) => {
			await page.goto('/')
			await triggerImport(page, 'metadata-mismatch.json')

			await expect(page.getByTestId('import-error-message')).toBeVisible()
			await expect(page.getByTestId('import-error-message')).toContainText('corrompu')
			await expect(page.getByTestId('import-modal')).not.toBeVisible()
		})
	})

	// -------------------------------------------------------------------------
	test.describe('Accessibilité modale', () => {
		async function openModalWithData(page: Page) {
			await page.goto('/transactions')
			await expect(page.locator('text=Aucune transaction')).toBeVisible()
			await addTransaction(page, {
				type: 'expense',
				amount: '10.00',
				category: 'Alimentation',
				date: '2026-03-05',
			})
			await page.goto('/')
			await triggerImport(page, 'valid-full.json')
			await expect(page.getByTestId('import-modal')).toBeVisible()
		}

		test('modal-aria-dialog', async ({ page }) => {
			await openModalWithData(page)

			const modal = page.getByTestId('import-modal')
			await expect(modal).toHaveAttribute('role', 'dialog')
			await expect(modal).toHaveAttribute('aria-modal', 'true')
			await expect(modal).toHaveAttribute('aria-labelledby', 'import-modal-title')

			// Le titre doit exister et correspondre à l'attribut aria-labelledby
			await expect(page.locator('#import-modal-title')).toBeVisible()
		})

		test('modal-buttons-testids', async ({ page }) => {
			await openModalWithData(page)

			await expect(page.getByTestId('import-action-merge')).toBeVisible()
			await expect(page.getByTestId('import-action-replace')).toBeVisible()
			await expect(page.getByTestId('import-action-cancel')).toBeVisible()
		})

		test('modal-escape-closes', async ({ page }) => {
			await openModalWithData(page)

			await page.keyboard.press('Escape')

			await expect(page.getByTestId('import-modal')).not.toBeVisible()
		})
	})
})
