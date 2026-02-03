import { test, expect } from '@playwright/test';

test.describe('Transactions', () => {
	test('display-empty-state', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();
	});

	test('categories-change-with-type', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#category')).toBeVisible();

		// Vérifier les catégories de dépense (type par défaut)
		const expenseOptions = await page.locator('#category option').allTextContents();
		expect(expenseOptions).toContain('Alimentation');
		expect(expenseOptions).toContain('Transport');

		// Changer en revenu
		await page.selectOption('#type', 'income');
		await expect(page.locator('#category option:has-text("Argent de poche")')).toBeAttached();

		const incomeOptions = await page.locator('#category option').allTextContents();
		expect(incomeOptions).toContain('Argent de poche');
		expect(incomeOptions).toContain('Job etudiant');
		expect(incomeOptions).not.toContain('Alimentation');
	});
});
