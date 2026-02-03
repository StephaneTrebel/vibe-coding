import { test, expect } from '@playwright/test';

function getMonthName(date: Date): string {
	return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function getMonthOffset(offset: number): { month: string; name: string } {
	const date = new Date();
	date.setMonth(date.getMonth() + offset);
	return {
		month: date.toISOString().slice(0, 7),
		name: getMonthName(date),
	};
}

test.describe('Budget', () => {
	test('display-current-month', async ({ page }) => {
		await page.goto('/budget');

		const monthName = getMonthName(new Date());
		await expect(page.locator(`text=${monthName}`)).toBeVisible();
	});

	test('set-budget', async ({ page }) => {
		await page.goto('/budget');

		await page.fill('#budget', '600.00');
		await page.locator('button:has-text("Enregistrer")').click();

		await expect(page.locator('text=600,00 €').first()).toBeVisible();
	});

	test('display-spent-amount', async ({ page }) => {
		const currentMonth = new Date().toISOString().slice(0, 7);

		// Créer un budget
		await page.goto('/budget');
		await page.fill('#budget', '500.00');
		await page.locator('button:has-text("Enregistrer")').click();
		await expect(page.locator('text=500,00 €').first()).toBeVisible();

		// Créer des transactions
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '50.00');
		await page.selectOption('#category', 'Alimentation');
		await page.fill('#date', `${currentMonth}-10`);
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		await expect(page.locator('text=Alimentation')).toBeVisible();

		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '25.50');
		await page.selectOption('#category', 'Transport');
		await page.fill('#date', `${currentMonth}-15`);
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
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
		await expect(page.locator('text=500,00 €').first()).toBeVisible();

		// Créer une transaction
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '100.00');
		await page.selectOption('#category', 'Alimentation');
		await page.fill('#date', `${currentMonth}-10`);
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
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
		await expect(page.locator('text=500,00 €').first()).toBeVisible();

		// Créer une dépense à 50% (250 / 500)
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '250.00');
		await page.selectOption('#category', 'Alimentation');
		await page.fill('#date', `${currentMonth}-10`);
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
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
		await expect(page.locator('text=500,00 €').first()).toBeVisible();

		// Créer une dépense à 80% (400 / 500)
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '400.00');
		await page.selectOption('#category', 'Alimentation');
		await page.fill('#date', `${currentMonth}-10`);
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
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
		await expect(page.locator('text=500,00 €').first()).toBeVisible();

		// Créer une dépense à 120% (600 / 500)
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '600.00');
		await page.selectOption('#category', 'Alimentation');
		await page.fill('#date', `${currentMonth}-10`);
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		await expect(page.locator('text=Alimentation')).toBeVisible();

		// Retourner au budget
		await page.goto('/budget');

		// Vérifier que le message de dépassement est affiché
		await expect(page.locator('text=Vous avez depasse votre budget de 100,00 € !')).toBeVisible();
		await expect(page.locator('text=100% du budget utilise')).toBeVisible();
	});

	// --- Nouveaux tests ---

	test('navigate-previous-month', async ({ page }) => {
		const current = getMonthOffset(0);
		const previous = getMonthOffset(-1);

		await page.goto('/budget');
		// Attendre que la page soit chargée (résumé visible)
		await expect(page.locator('text=Resume')).toBeVisible();
		await expect(page.locator(`h2:has-text("${current.name}")`)).toBeVisible();

		await page.locator('button:has-text("Precedent")').click();
		await expect(page.locator(`h2:has-text("${previous.name}")`)).toBeVisible();
	});

	test('navigate-next-month', async ({ page }) => {
		const current = getMonthOffset(0);
		const next = getMonthOffset(1);

		await page.goto('/budget');
		await expect(page.locator('text=Resume')).toBeVisible();
		await expect(page.locator(`h2:has-text("${current.name}")`)).toBeVisible();

		await page.locator('button:has-text("Suivant")').click();
		await expect(page.locator(`h2:has-text("${next.name}")`)).toBeVisible();
	});

	test('budget-per-month-independent', async ({ page }) => {
		const current = getMonthOffset(0);
		const previous = getMonthOffset(-1);

		// Définir un budget pour le mois courant
		await page.goto('/budget');
		await page.fill('#budget', '500.00');
		await page.locator('button:has-text("Enregistrer")').click();
		await expect(page.locator('text=500,00 €').first()).toBeVisible();

		// Naviguer au mois précédent
		await page.locator('button:has-text("Precedent")').click();
		await expect(page.locator(`h2:has-text("${previous.name}")`)).toBeVisible();

		// Vérifier que le budget est à 0 (pas de budget défini pour ce mois)
		await expect(page.locator('#budget')).toHaveValue('0');

		// Définir un budget différent pour ce mois
		await page.fill('#budget', '300.00');
		await page.locator('button:has-text("Enregistrer")').click();
		await expect(page.locator('text=300,00 €').first()).toBeVisible();

		// Revenir au mois courant
		await page.locator('button:has-text("Suivant")').click();
		await expect(page.locator(`h2:has-text("${current.name}")`)).toBeVisible();

		// Vérifier que le budget du mois courant est toujours 500
		await expect(page.locator('text=500,00 €').first()).toBeVisible();
	});

	test('no-budget-state', async ({ page }) => {
		await page.goto('/budget');
		await expect(page.locator('text=Resume')).toBeVisible();

		// Sans budget défini, le champ est à 0 et le résumé affiche 0,00 €
		await expect(page.locator('#budget')).toHaveValue('0');

		// La barre de progression est visible (budget existe avec amount=0)
		// mais à 0% car aucune dépense
		await expect(page.locator('text=0% du budget utilise')).toBeVisible();
	});

	test('update-existing-budget', async ({ page }) => {
		await page.goto('/budget');

		// Définir un premier budget
		await page.fill('#budget', '500.00');
		await page.locator('button:has-text("Enregistrer")').click();
		await expect(page.locator('text=500,00 €').first()).toBeVisible();

		// Le modifier
		await page.fill('#budget', '800.00');
		await page.locator('button:has-text("Enregistrer")').click();

		// Vérifier la mise à jour
		await expect(page.locator('text=800,00 €').first()).toBeVisible();
	});

	test('income-not-counted-as-spent', async ({ page }) => {
		const currentMonth = new Date().toISOString().slice(0, 7);

		// Définir un budget
		await page.goto('/budget');
		await page.fill('#budget', '500.00');
		await page.locator('button:has-text("Enregistrer")').click();
		await expect(page.locator('text=500,00 €').first()).toBeVisible();

		// Créer un revenu et une dépense
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		// Revenu
		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'income');
		await page.fill('#amount', '1000.00');
		await page.selectOption('#category', 'Argent de poche');
		await page.fill('#date', `${currentMonth}-05`);
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		await expect(page.locator('text=Argent de poche')).toBeVisible();

		// Dépense
		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '75.00');
		await page.selectOption('#category', 'Alimentation');
		await page.fill('#date', `${currentMonth}-10`);
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		await expect(page.locator('text=Alimentation')).toBeVisible();

		// Retourner au budget
		await page.goto('/budget');

		// Seule la dépense doit compter (75€, pas 1075€)
		await expect(page.locator('text=Depense')).toBeVisible();
		await expect(page.locator('text=75,00 €').first()).toBeVisible();

		// Restant = 500 - 75 = 425
		await expect(page.locator('text=425,00 €').first()).toBeVisible();
	});

	test('other-month-expenses-not-counted', async ({ page }) => {
		const current = getMonthOffset(0);
		const previous = getMonthOffset(-1);

		// Définir un budget pour le mois courant
		await page.goto('/budget');
		await page.fill('#budget', '500.00');
		await page.locator('button:has-text("Enregistrer")').click();
		await expect(page.locator('text=500,00 €').first()).toBeVisible();

		// Créer une dépense datée du mois précédent
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '200.00');
		await page.selectOption('#category', 'Shopping');
		await page.fill('#date', `${previous.month}-15`);
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		await expect(page.locator('text=Shopping')).toBeVisible();

		// Retourner au budget du mois courant
		await page.goto('/budget');

		// Le dépensé doit être 0 (la dépense est sur un autre mois)
		await expect(page.locator('text=Depense')).toBeVisible();
		await expect(page.locator('text=0,00 €').first()).toBeVisible();

		// Restant = 500 - 0 = 500
		await expect(page.locator('text=Restant')).toBeVisible();
		await expect(page.locator('text=500,00 €').nth(1)).toBeVisible();
	});

	test('budget-zero-expenses', async ({ page }) => {
		await page.goto('/budget');

		// Définir un budget sans créer de transactions
		await page.fill('#budget', '400.00');
		await page.locator('button:has-text("Enregistrer")').click();
		await expect(page.locator('text=400,00 €').first()).toBeVisible();

		// Vérifier dépensé = 0
		await expect(page.locator('text=Depense')).toBeVisible();
		await expect(page.locator('text=0,00 €').first()).toBeVisible();

		// Vérifier restant = budget
		await expect(page.locator('text=Restant')).toBeVisible();

		// Vérifier barre de progression à 0%
		await expect(page.locator('text=0% du budget utilise')).toBeVisible();
	});
});
