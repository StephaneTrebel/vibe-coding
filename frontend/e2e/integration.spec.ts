import { test, expect, type Page } from '@playwright/test';

async function addTransaction(page: Page, type: 'income' | 'expense', amount: string, category: string, date: string) {
	await expect(page.locator('#type')).not.toBeVisible();
	await page.locator('button:has-text("Ajouter")').click();
	await expect(page.locator('#type')).toBeVisible();
	await page.selectOption('#type', type);
	await page.fill('#amount', amount);
	await page.selectOption('#category', category);
	await page.fill('#date', date);
	await page.locator('button[type="submit"]:has-text("Ajouter")').click();
	await expect(page.locator(`.tx-category:has-text("${category}")`)).toBeVisible();
}

test.describe('Integration', () => {
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
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '100.00');
		await page.selectOption('#category', 'Transport');
		await page.fill('#date', `${currentMonth}-10`);
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		await expect(page.locator('text=Transport')).toBeVisible();

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

		const transactions = [
			{ type: 'income', amount: '200.00', category: 'Argent de poche' },
			{ type: 'expense', amount: '50.00', category: 'Alimentation' },
			{ type: 'expense', amount: '30.00', category: 'Transport' },
			{ type: 'income', amount: '100.00', category: 'Job etudiant' },
		];

		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		for (const tx of transactions) {
			// Attendre que le formulaire soit fermé avant de rouvrir
			await expect(page.locator('#type')).not.toBeVisible();
			await page.locator('button:has-text("Ajouter")').click();
			await expect(page.locator('#type')).toBeVisible();
			await page.selectOption('#type', tx.type);
			await page.fill('#amount', tx.amount);
			await page.selectOption('#category', tx.category);
			await page.fill('#date', `${currentMonth}-15`);
			await page.locator('button[type="submit"]:has-text("Ajouter")').click();
			// Attendre que la transaction apparaisse dans la liste
			await expect(page.locator(`.tx-category:has-text("${tx.category}")`)).toBeVisible();
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

	test('delete-transaction-updates-dashboard', async ({ page }) => {
		const currentMonth = new Date().toISOString().slice(0, 7);

		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();
		await addTransaction(page, 'expense', '150.00', 'Alimentation', `${currentMonth}-10`);
		await addTransaction(page, 'income', '400.00', 'Argent de poche', `${currentMonth}-05`);

		// Vérifier le dashboard : solde = 400 - 150 = 250
		await page.goto('/');
		await expect(page.locator('text=250,00 €').first()).toBeVisible();

		// Supprimer la dépense
		await page.goto('/transactions');
		const alimentationRow = page.locator('.transaction-item:has-text("Alimentation")');
		page.on('dialog', dialog => dialog.accept());
		await alimentationRow.locator('button:has-text("Supprimer")').click();
		await expect(alimentationRow).not.toBeVisible();

		// Dashboard mis à jour : solde = 400
		await page.goto('/');
		await expect(page.locator('text=400,00 €').first()).toBeVisible();
	});

	test('edit-transaction-updates-budget', async ({ page }) => {
		const currentMonth = new Date().toISOString().slice(0, 7);

		// Budget de 500
		await page.goto('/budget');
		await page.fill('#budget', '500.00');
		await page.locator('button:has-text("Enregistrer")').click();
		await expect(page.locator('text=500,00 €').first()).toBeVisible();

		// Dépense de 100
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();
		await addTransaction(page, 'expense', '100.00', 'Transport', `${currentMonth}-10`);

		// Budget : dépensé = 100, restant = 400
		await page.goto('/budget');
		await expect(page.locator('text=100,00 €').first()).toBeVisible();
		await expect(page.locator('text=400,00 €').first()).toBeVisible();

		// Modifier la dépense à 200
		await page.goto('/transactions');
		const transportRow = page.locator('.transaction-item:has-text("Transport")');
		await transportRow.locator('button:has-text("Modifier")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.fill('#amount', '200.00');
		await page.locator('button[type="submit"]:has-text("Modifier")').click();
		await expect(page.locator('text=200,00').first()).toBeVisible();

		// Budget : dépensé = 200, restant = 300
		await page.goto('/budget');
		await expect(page.locator('text=200,00 €').first()).toBeVisible();
		await expect(page.locator('text=300,00 €').first()).toBeVisible();
	});

	test('delete-transaction-updates-budget', async ({ page }) => {
		const currentMonth = new Date().toISOString().slice(0, 7);

		// Budget de 500
		await page.goto('/budget');
		await page.fill('#budget', '500.00');
		await page.locator('button:has-text("Enregistrer")').click();
		await expect(page.locator('text=500,00 €').first()).toBeVisible();

		// Dépense de 150
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();
		await addTransaction(page, 'expense', '150.00', 'Loisirs', `${currentMonth}-10`);

		// Budget : dépensé = 150
		await page.goto('/budget');
		await expect(page.locator('text=150,00 €').first()).toBeVisible();

		// Supprimer la dépense
		await page.goto('/transactions');
		const loisirsRow = page.locator('.transaction-item:has-text("Loisirs")');
		page.on('dialog', dialog => dialog.accept());
		await loisirsRow.locator('button:has-text("Supprimer")').click();
		await expect(loisirsRow).not.toBeVisible();

		// Budget : dépensé revient à 0
		await page.goto('/budget');
		await expect(page.locator('text=0,00 €').first()).toBeVisible();
		await expect(page.locator('text=500,00 €').first()).toBeVisible();
	});

	test('income-does-not-affect-budget', async ({ page }) => {
		const currentMonth = new Date().toISOString().slice(0, 7);

		// Budget de 500
		await page.goto('/budget');
		await page.fill('#budget', '500.00');
		await page.locator('button:has-text("Enregistrer")').click();
		await expect(page.locator('text=500,00 €').first()).toBeVisible();

		// Ajouter un revenu
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();
		await addTransaction(page, 'income', '1000.00', 'Job etudiant', `${currentMonth}-10`);

		// Budget : dépensé reste à 0, restant = 500
		await page.goto('/budget');
		await expect(page.locator('text=0,00 €').first()).toBeVisible();
		await expect(page.locator('text=500,00 €').first()).toBeVisible();
		await expect(page.locator('text=0% du budget utilise')).toBeVisible();
	});
});
