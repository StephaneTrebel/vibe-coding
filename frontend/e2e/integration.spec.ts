import { test, expect } from '@playwright/test';
import { authenticateTestUser, cleanupTestData } from './helpers/auth';

test.describe('Integration', () => {
	test.beforeEach(async ({ page }) => {
		await authenticateTestUser(page);
		await cleanupTestData(page);
	});

	test('expense-affects-budget', async ({ page }) => {
		const currentMonth = new Date().toISOString().slice(0, 7);

		// Créer un budget
		await page.goto('/budget');
		await page.fill('#budget', '500.00');
		await page.locator('button:has-text("Enregistrer")').click();

		// Vérifier le budget initial
		await expect(page.locator('text=500,00 €').first()).toBeVisible();
		await expect(page.locator('text=0,00 €').first()).toBeVisible(); // Dépensé

		// Créer une dépense
		await page.goto('/transactions');
		await page.locator('button:has-text("Ajouter")').click();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '100.00');
		await page.selectOption('#category', 'Transport');
		await page.fill('#date', `${currentMonth}-10`);
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();

		// Retourner au budget
		await page.goto('/budget');

		// Vérifier que le montant dépensé est mis à jour
		await expect(page.locator('text=100,00 €').first()).toBeVisible();

		// Vérifier que le restant est correct (500 - 100 = 400)
		await expect(page.locator('text=400,00 €').first()).toBeVisible();

		// Vérifier la barre de progression (20%)
		await expect(page.locator('text=20% du budget utilise')).toBeVisible();
	});

	test('multiple-transactions-cumulative', async ({ page }) => {
		const currentMonth = new Date().toISOString().slice(0, 7);

		// Créer plusieurs transactions
		const transactions = [
			{ type: 'income', amount: '200.00', category: 'Argent de poche' },
			{ type: 'expense', amount: '50.00', category: 'Alimentation' },
			{ type: 'expense', amount: '30.00', category: 'Transport' },
			{ type: 'income', amount: '100.00', category: 'Job etudiant' },
		];

		await page.goto('/transactions');

		for (const tx of transactions) {
			await page.locator('button:has-text("Ajouter")').click();
			await page.selectOption('#type', tx.type);
			await page.fill('#amount', tx.amount);
			await page.selectOption('#category', tx.category);
			await page.fill('#date', `${currentMonth}-15`);
			await page.locator('button[type="submit"]:has-text("Ajouter")').click();

			// Attendre un peu pour être sûr que la transaction est créée
			await page.waitForTimeout(500);
		}

		// Retourner au dashboard
		await page.goto('/');

		// Vérifier le solde final (200 - 50 - 30 + 100 = 220)
		await expect(page.locator('text=220,00 €').first()).toBeVisible();

		// Vérifier les revenus du mois (300€)
		await expect(page.locator('text=300,00 €').first()).toBeVisible();

		// Vérifier les dépenses du mois (80€)
		await expect(page.locator('text=80,00 €').first()).toBeVisible();
	});
});
