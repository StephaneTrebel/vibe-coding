import { test, expect } from '@playwright/test';
import { authenticateTestUser, cleanupTestData } from './helpers/auth';

test.describe('Transactions', () => {
	test.beforeEach(async ({ page }) => {
		await authenticateTestUser(page);
		await cleanupTestData(page);
	});

	test('display-empty-state', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();
	});

	// test('categories-change-with-type', async ({ page }) => {
		// await page.goto('/transactions');

		// await page.locator('button:has-text("Ajouter")').click();

		// await page.selectOption('#type', 'expense');
		// const expenseOptions = await page.locator('#category option').allTextContents();
		// expect(expenseOptions).toContain('Alimentation');
		// expect(expenseOptions).toContain('Transport');

		// await page.selectOption('#type', 'income');
		// const incomeOptions = await page.locator('#category option').allTextContents();
		// expect(incomeOptions).toContain('Argent de poche');
		// expect(incomeOptions).toContain('Job etudiant');
		// expect(incomeOptions).not.toContain('Alimentation');
	// });

});
