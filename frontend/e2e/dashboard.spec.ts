import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
	test('display-total-stats', async ({ page }) => {
		// Créer plusieurs transactions
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		// Transaction 1
		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'income');
		await page.fill('#amount', '500.00');
		await page.selectOption('#category', 'Argent de poche');
		await page.fill('#date', '2024-01-10');
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		await expect(page.locator('text=Argent de poche')).toBeVisible();

		// Transaction 2
		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '349.50');
		await page.selectOption('#category', 'Alimentation');
		await page.fill('#date', '2024-01-15');
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		await expect(page.locator('text=Alimentation')).toBeVisible();

		await page.goto('/');

		// Vérifier l'historique total
		await expect(page.locator('text=Historique')).toBeVisible();
		await expect(page.locator('text=Total revenus')).toBeVisible();
		await expect(page.locator('text=500,00').first()).toBeVisible();
		await expect(page.locator('text=Total depenses')).toBeVisible();
		await expect(page.locator('text=349,50').first()).toBeVisible();
	});

	test('display-recent-transactions', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '15.50');
		await page.selectOption('#category', 'Alimentation');
		await page.fill('#date', '2024-01-15');
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		await expect(page.locator('text=Alimentation')).toBeVisible();

		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'income');
		await page.fill('#amount', '200.00');
		await page.selectOption('#category', 'Argent de poche');
		await page.fill('#date', '2024-01-10');
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		await expect(page.locator('text=Argent de poche')).toBeVisible();

		await page.goto('/');

		// Vérifier que les transactions récentes sont affichées
		await expect(page.locator('text=Transactions recentes')).toBeVisible();
		await expect(page.locator('text=Alimentation')).toBeVisible();
		await expect(page.locator('text=Argent de poche')).toBeVisible();
	});

	test('empty-state', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();
	});

	test('link-to-transactions', async ({ page }) => {
		await page.goto('/');
		await page.locator('text=Voir tout').click();
		await expect(page).toHaveURL('/transactions');
	});
});
