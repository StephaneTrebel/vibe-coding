import { test, expect } from '@playwright/test';

// Helpers réutilisés dans plusieurs tests
async function openTransactionForm(page) {
	// Attendre que la page soit chargée (h1 visible + pas de "Chargement")
	await expect(page.locator('h1')).toBeVisible()
	await expect(page.locator('text=Chargement')).not.toBeVisible()
	const isFormOpen = await page.locator('#type').isVisible()
	if (!isFormOpen) {
		await page.locator('button:has-text("Ajouter")').click()
		await expect(page.locator('#type')).toBeVisible()
	}
}

async function createExpense(page, { amount, category, date }) {
	await openTransactionForm(page)
	await page.selectOption('#type', 'expense');
	await page.fill('#amount', amount);
	await page.selectOption('#category', category);
	await page.fill('#date', date);
	await page.locator('button[type="submit"]:has-text("Ajouter")').click();
	await expect(page.locator('#type')).not.toBeVisible();
}

async function createIncome(page, { amount, category, date }) {
	await openTransactionForm(page)
	await page.selectOption('#type', 'income');
	await page.fill('#amount', amount);
	await page.selectOption('#category', category);
	await page.fill('#date', date);
	await page.locator('button[type="submit"]:has-text("Ajouter")').click();
	await expect(page.locator('#type')).not.toBeVisible();
}

test.describe('Charts - Dashboard', () => {
	test('bar-chart-hidden-when-no-data', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('[data-testid="bar-chart-card"]')).not.toBeAttached();
	});

	test('bar-chart-visible-after-transaction', async ({ page }) => {
		// Créer une transaction
		await page.goto('/transactions');
		await createExpense(page, { amount: '30', category: 'Alimentation', date: new Date().toISOString().slice(0, 10) });

		// Aller sur le dashboard
		await page.goto('/');
		await expect(page.locator('[data-testid="bar-chart-card"]')).toBeVisible();
		await expect(page.locator('[data-testid="bar-chart"]')).toBeVisible();
	});

	test('bar-chart-shows-income-and-expenses', async ({ page }) => {
		const today = new Date().toISOString().slice(0, 10);
		await page.goto('/transactions');
		await createExpense(page, { amount: '50', category: 'Transport', date: today });
		await createIncome(page, { amount: '100', category: 'Argent de poche', date: today });

		await page.goto('/');
		const chart = page.locator('[data-testid="bar-chart"]');
		await expect(chart).toBeVisible();
		// Le SVG contient des barres (rect) pour revenus et dépenses
		const rectCount = await chart.locator('rect').count();
		expect(rectCount).toBeGreaterThanOrEqual(2);
	});
});

test.describe('Charts - Budget', () => {
	test('pie-chart-hidden-when-no-expenses', async ({ page }) => {
		await page.goto('/budget');
		await expect(page.locator('[data-testid="pie-chart-card"]')).not.toBeAttached();
	});

	test('pie-chart-visible-after-expense', async ({ page }) => {
		const today = new Date().toISOString().slice(0, 10);
		await page.goto('/transactions');
		await createExpense(page, { amount: '25', category: 'Alimentation', date: today });

		await page.goto('/budget');
		await expect(page.locator('[data-testid="pie-chart-card"]')).toBeVisible();
		await expect(page.locator('[data-testid="pie-chart"]')).toBeVisible();
	});

	test('pie-chart-groups-by-category', async ({ page }) => {
		const today = new Date().toISOString().slice(0, 10);
		await page.goto('/transactions');
		await createExpense(page, { amount: '20', category: 'Alimentation', date: today });
		await createExpense(page, { amount: '15', category: 'Transport', date: today });

		await page.goto('/budget');
		const pie = page.locator('[data-testid="pie-chart"]');
		await expect(pie).toBeVisible();
		// Deux catégories → deux secteurs (path)
		const pathCount = await pie.locator('path').count();
		expect(pathCount).toBeGreaterThanOrEqual(2);
	});

	test('line-chart-hidden-when-insufficient-data', async ({ page }) => {
		await page.goto('/budget');
		await expect(page.locator('[data-testid="line-chart-card"]')).not.toBeAttached();
	});

	test('line-chart-visible-when-budget-set', async ({ page }) => {
		// Un seul mois suffit pour afficher la courbe
		await page.goto('/budget');
		await page.fill('#budget', '200');
		await page.locator('button:has-text("Enregistrer")').click();
		await expect(page.locator('[data-testid="line-chart-card"]')).toBeVisible();
		await expect(page.locator('[data-testid="line-chart"]')).toBeVisible();
	});

	test('line-chart-period-toggle', async ({ page }) => {
		// Un budget suffit pour afficher la courbe et le toggle
		await page.goto('/budget');
		await page.fill('#budget', '200');
		await page.locator('button:has-text("Enregistrer")').click();

		const lineCard = page.locator('[data-testid="line-chart-card"]');
		await expect(lineCard).toBeVisible();

		// Le toggle 6/12 mois est présent
		await expect(lineCard.locator('button:has-text("6 mois")')).toBeVisible();
		await expect(lineCard.locator('button:has-text("12 mois")')).toBeVisible();

		// "6 mois" est actif par défaut
		await expect(lineCard.locator('button:has-text("6 mois")')).toHaveClass(/active/);

		// Cliquer sur "12 mois"
		await lineCard.locator('button:has-text("12 mois")').click();
		await expect(lineCard.locator('button:has-text("12 mois")')).toHaveClass(/active/);
		await expect(lineCard.locator('button:has-text("6 mois")')).not.toHaveClass(/active/);
	});
});
