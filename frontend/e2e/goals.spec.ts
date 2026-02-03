import { test, expect } from '@playwright/test';

test.describe('Goals', () => {
	test('display-empty-state', async ({ page }) => {
		await page.goto('/goals');
		await expect(page.locator('text=Aucun objectif d\'epargne')).toBeVisible();
	});
});
