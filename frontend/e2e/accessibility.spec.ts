import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
	test('axe-scan-dashboard-empty', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('h1')).toContainText('Tableau de bord');

		const results = await new AxeBuilder({ page }).analyze();

		expect(results.violations).toEqual([]);
	});

	test('axe-scan-dashboard-with-data', async ({ page }) => {
		// Créer des transactions pour que le dashboard affiche du contenu
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'income');
		await page.fill('#amount', '500.00');
		await page.selectOption('#category', 'Argent de poche');
		await page.fill('#date', '2024-01-10');
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		await expect(page.locator('text=Argent de poche')).toBeVisible();

		await page.goto('/');
		await expect(page.locator('.balance')).toBeVisible();

		const results = await new AxeBuilder({ page }).analyze();

		expect(results.violations).toEqual([]);
	});

	test('axe-scan-transactions-empty', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		const results = await new AxeBuilder({ page }).analyze();
		expect(results.violations).toEqual([]);
	});

	test('axe-scan-transactions-with-form', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		// Ouvrir le formulaire d'ajout
		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();

		const results = await new AxeBuilder({ page }).analyze();
		expect(results.violations).toEqual([]);
	});

	test('axe-scan-transactions-with-data', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '42.00');
		await page.selectOption('#category', 'Transport');
		await page.fill('#date', '2024-01-10');
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		await expect(page.locator('text=Transport')).toBeVisible();

		const results = await new AxeBuilder({ page }).analyze();
		expect(results.violations).toEqual([]);
	});

	test('axe-scan-budget', async ({ page }) => {
		await page.goto('/budget');
		await expect(page.locator('h1')).toContainText('Budget');

		const results = await new AxeBuilder({ page }).analyze();
		expect(results.violations).toEqual([]);
	});

	test('axe-scan-budget-with-data', async ({ page }) => {
		await page.goto('/budget');
		await page.fill('#budget', '500.00');
		await page.locator('button:has-text("Enregistrer")').click();
		await expect(page.locator('text=500,00 €').first()).toBeVisible();

		const results = await new AxeBuilder({ page }).analyze();
		expect(results.violations).toEqual([]);
	});

	test('axe-scan-goals-empty', async ({ page }) => {
		await page.goto('/goals');
		await expect(page.locator('text=Aucun objectif')).toBeVisible();

		const results = await new AxeBuilder({ page }).analyze();
		expect(results.violations).toEqual([]);
	});

	test('axe-scan-goals-with-data', async ({ page }) => {
		await page.goto('/goals');
		await expect(page.locator('text=Aucun objectif')).toBeVisible();

		// Créer un objectif
		await page.locator('button:has-text("Nouvel objectif")').click();
		await page.fill('#name', 'Vacances');
		await page.fill('#target', '1000');
		await page.locator('button[type="submit"]').click();
		await expect(page.locator('text=Vacances')).toBeVisible();

		const results = await new AxeBuilder({ page }).analyze();
		expect(results.violations).toEqual([]);
	});
});
