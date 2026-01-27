import { test, expect } from '@playwright/test';
import { authenticateTestUser, cleanupTestData } from './helpers/auth';

test.describe('Budget', () => {
	test.beforeEach(async ({ page }) => {
		await authenticateTestUser(page);
		await cleanupTestData(page);
	});

	test('display-current-month', async ({ page }) => {
		await page.goto('/budget');

		// Vérifier que le mois actuel est affiché en français
		const monthName = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
		await expect(page.locator(`text=${monthName}`)).toBeVisible();
	});

	test('set-budget', async ({ page }) => {
		await page.goto('/budget');

		// Remplir le montant
		await page.fill('#budget', '600.00');

		// Enregistrer
		await page.locator('button:has-text("Enregistrer")').click();

		// Vérifier que le résumé est mis à jour (utiliser first() pour éviter strict mode)
		await expect(page.locator('text=600,00 €').first()).toBeVisible();
	});

	test('display-spent-amount', async ({ page }) => {
		const currentMonth = new Date().toISOString().slice(0, 7);

		// Créer un budget
		await page.goto('/budget');
		await page.fill('#budget', '500.00');
		await page.locator('button:has-text("Enregistrer")').click();

		// Créer des transactions
		await page.goto('/transactions');

		await page.locator('button:has-text("Ajouter")').click();
		// Attendre que le formulaire soit visible
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '50.00');
		await page.selectOption('#category', 'Alimentation');
		await page.fill('#date', `${currentMonth}-10`);
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		// Attendre que la transaction apparaisse
		await expect(page.locator('text=Alimentation')).toBeVisible();

		await page.locator('button:has-text("Ajouter")').click();
		// Attendre que le formulaire soit visible
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '25.50');
		await page.selectOption('#category', 'Transport');
		await page.fill('#date', `${currentMonth}-15`);
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		// Attendre que la transaction apparaisse
		await expect(page.locator('text=Transport')).toBeVisible();

		// Retourner au budget
		await page.goto('/budget');

		// Vérifier que le montant dépensé est correct (50 + 25.50 = 75.50)
		await expect(page.locator('text=Depense')).toBeVisible();
		await expect(page.locator('text=75,50 €').first()).toBeVisible();
	});

	test('display-remaining', async ({ page }) => {
		const currentMonth = new Date().toISOString().slice(0, 7);

		// Créer un budget
		await page.goto('/budget');
		await page.fill('#budget', '500.00');
		await page.locator('button:has-text("Enregistrer")').click();

		// Créer une transaction
		await page.goto('/transactions');
		await page.locator('button:has-text("Ajouter")').click();
		// Attendre que le formulaire soit visible
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '100.00');
		await page.selectOption('#category', 'Alimentation');
		await page.fill('#date', `${currentMonth}-10`);
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		// Attendre que la transaction apparaisse
		await expect(page.locator('text=Alimentation')).toBeVisible();

		// Retourner au budget
		await page.goto('/budget');

		// Vérifier le restant (500 - 100 = 400)
		await expect(page.locator('text=Restant')).toBeVisible();
		await expect(page.locator('text=400,00 €').first()).toBeVisible();
	});

	test('progress-bar-normal', async ({ page }) => {
		const currentMonth = new Date().toISOString().slice(0, 7);

		// Créer un budget
		await page.goto('/budget');
		await page.fill('#budget', '500.00');
		await page.locator('button:has-text("Enregistrer")').click();

		// Créer une dépense à 50% (250 / 500)
		await page.goto('/transactions');
		await page.locator('button:has-text("Ajouter")').click();
		// Attendre que le formulaire soit visible
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '250.00');
		await page.selectOption('#category', 'Alimentation');
		await page.fill('#date', `${currentMonth}-10`);
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		// Attendre que la transaction apparaisse
		await expect(page.locator('text=Alimentation')).toBeVisible();

		// Retourner au budget
		await page.goto('/budget');

		// Vérifier que la barre de progression existe et n'a pas les classes warning/danger
		const progressBar = page.locator('.progress-fill');
		await expect(progressBar).toBeVisible();
		await expect(progressBar).not.toHaveClass(/warning/);
		await expect(progressBar).not.toHaveClass(/danger/);
		await expect(page.locator('text=50% du budget utilise')).toBeVisible();
	});

	test('progress-bar-warning', async ({ page }) => {
		const currentMonth = new Date().toISOString().slice(0, 7);

		// Créer un budget
		await page.goto('/budget');
		await page.fill('#budget', '500.00');
		await page.locator('button:has-text("Enregistrer")').click();

		// Créer une dépense à 80% (400 / 500)
		await page.goto('/transactions');
		await page.locator('button:has-text("Ajouter")').click();
		// Attendre que le formulaire soit visible
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '400.00');
		await page.selectOption('#category', 'Alimentation');
		await page.fill('#date', `${currentMonth}-10`);
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		// Attendre que la transaction apparaisse
		await expect(page.locator('text=Alimentation')).toBeVisible();

		// Retourner au budget
		await page.goto('/budget');

		// Vérifier la classe warning
		const progressBar = page.locator('.progress-fill.warning');
		await expect(progressBar).toBeVisible();
		await expect(page.locator('text=Attention, vous approchez de la limite !')).toBeVisible();
	});

	test('progress-bar-danger', async ({ page }) => {
		const currentMonth = new Date().toISOString().slice(0, 7);

		// Créer un budget
		await page.goto('/budget');
		await page.fill('#budget', '500.00');
		await page.locator('button:has-text("Enregistrer")').click();

		// Créer une dépense à 120% (600 / 500)
		await page.goto('/transactions');
		await page.locator('button:has-text("Ajouter")').click();
		// Attendre que le bouton change de texte
		await expect(page.locator('button:has-text("Annuler")')).toBeVisible();
		// Attendre que le formulaire soit visible
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '600.00');
		await page.selectOption('#category', 'Alimentation');
		await page.fill('#date', `${currentMonth}-10`);
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		// Attendre que la transaction apparaisse
		await expect(page.locator('text=Alimentation')).toBeVisible();

		// Retourner au budget
		await page.goto('/budget');

		// Vérifier que le message de dépassement est affiché
		await expect(page.locator('text=Vous avez depasse votre budget de 100,00 € !')).toBeVisible();
		// Vérifier que la barre de progression est à 100%
		await expect(page.locator('text=100% du budget utilise')).toBeVisible();
	});
});
