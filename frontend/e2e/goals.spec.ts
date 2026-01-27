import { test, expect } from '@playwright/test';
import { authenticateTestUser, cleanupTestData } from './helpers/auth';

test.describe('Goals', () => {
	test.beforeEach(async ({ page }) => {
		await authenticateTestUser(page);
		await cleanupTestData(page);
	});

	test('display-empty-state', async ({ page }) => {
		await page.goto('/goals');
		await expect(page.locator('text=Aucun objectif d\'epargne')).toBeVisible();
	});

});
