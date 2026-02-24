import { test, expect } from '@playwright/test';

test.describe('Navigation desktop', () => {
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

	test('bottom-nav-hidden-on-desktop', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('[data-testid="bottom-nav"]')).toBeHidden();
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

test.describe('Navigation mobile', () => {
	test.use({ viewport: { width: 375, height: 667 } });

	test('bottom-nav-visible', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible();
	});

	test('navbar-links-hidden', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.nav-links')).toBeHidden();
	});

	test('navigate-via-bottom-nav', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('h1')).toContainText('Tableau de bord');

		await page.locator('[data-testid="bottom-nav"] a[href="/transactions"]').click();
		await expect(page).toHaveURL('/transactions');
		await expect(page.locator('h1')).toContainText('Transactions');

		await page.locator('[data-testid="bottom-nav"] a[href="/budget"]').click();
		await expect(page).toHaveURL('/budget');
		await expect(page.locator('h1')).toContainText('Budget');

		await page.locator('[data-testid="bottom-nav"] a[href="/goals"]').click();
		await expect(page).toHaveURL('/goals');
		await expect(page.locator('h1')).toContainText('Objectifs');

		await page.locator('[data-testid="bottom-nav"] a[href="/"]').click();
		await expect(page).toHaveURL('/');
		await expect(page.locator('h1')).toContainText('Tableau de bord');
	});

	test('active-link-highlighted', async ({ page }) => {
		const routes = [
			{ path: '/', href: '/' },
			{ path: '/transactions', href: '/transactions' },
			{ path: '/budget', href: '/budget' },
			{ path: '/goals', href: '/goals' },
		];

		for (const { path, href } of routes) {
			await page.goto(path);
			const activeLink = page.locator(`[data-testid="bottom-nav"] a[href="${href}"]`);
			await expect(activeLink).toHaveClass(/active/);
		}
	});
});
