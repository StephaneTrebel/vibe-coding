import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
	test('navbar-visible-on-all-pages', async ({ page }) => {
		const pages = ['/', '/transactions', '/budget', '/goals'];

		for (const path of pages) {
			await page.goto(path);
			const nav = page.locator('.navbar');
			await expect(nav).toBeVisible();
			await expect(nav.locator('a[href="/"]')).toBeVisible();
			await expect(nav.locator('a[href="/transactions"]')).toBeVisible();
			await expect(nav.locator('a[href="/budget"]')).toBeVisible();
			await expect(nav.locator('a[href="/goals"]')).toBeVisible();
		}
	});

	test('navigate-via-navbar', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('h1')).toContainText('Tableau de bord');

		await page.locator('.navbar a[href="/transactions"]').click();
		await expect(page).toHaveURL('/transactions');
		await expect(page.locator('h1')).toContainText('Transactions');

		await page.locator('.navbar a[href="/budget"]').click();
		await expect(page).toHaveURL('/budget');
		await expect(page.locator('h1')).toContainText('Budget');

		await page.locator('.navbar a[href="/goals"]').click();
		await expect(page).toHaveURL('/goals');
		await expect(page.locator('h1')).toContainText('Objectifs');

		await page.locator('.navbar a[href="/"]').click();
		await expect(page).toHaveURL('/');
		await expect(page.locator('h1')).toContainText('Tableau de bord');
	});
});
