import { test, expect } from '@playwright/test';

test.describe('Transactions', () => {
	test('display-empty-state', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();
	});

	test('categories-change-with-type', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#category')).toBeVisible();

		// Vérifier les catégories de dépense (type par défaut)
		const expenseOptions = await page.locator('#category option').allTextContents();
		expect(expenseOptions).toContain('Alimentation');
		expect(expenseOptions).toContain('Transport');

		// Changer en revenu
		await page.selectOption('#type', 'income');
		await expect(page.locator('#category option:has-text("Argent de poche")')).toBeAttached();

		const incomeOptions = await page.locator('#category option').allTextContents();
		expect(incomeOptions).toContain('Argent de poche');
		expect(incomeOptions).toContain('Job etudiant');
		expect(incomeOptions).not.toContain('Alimentation');
	});

	test('create-expense', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '42.50');
		await page.selectOption('#category', 'Alimentation');
		await page.fill('#date', '2024-03-15');
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();

		// Vérifier que le message vide a disparu
		await expect(page.locator('text=Aucune transaction')).not.toBeVisible();

		// Vérifier le badge type
		const typeBadge = page.locator('.tx-type.expense');
		await expect(typeBadge).toBeVisible();
		await expect(typeBadge).toHaveText('depense');

		// Vérifier la catégorie
		await expect(page.locator('.tx-category')).toHaveText('Alimentation');

		// Vérifier le montant avec préfixe "-" et style rouge
		const amount = page.locator('.tx-amount');
		await expect(amount).toHaveClass(/text-danger/);
		await expect(amount).toContainText('-');
		await expect(amount).toContainText('42,50');

		// Vérifier la date formatée
		await expect(page.locator('.tx-date')).toHaveText('15/03/2024');
	});

	test('create-income', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'income');
		await page.fill('#amount', '150.00');
		await page.selectOption('#category', 'Argent de poche');
		await page.fill('#date', '2024-03-10');
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();

		// Vérifier le badge type
		const typeBadge = page.locator('.tx-type.income');
		await expect(typeBadge).toBeVisible();
		await expect(typeBadge).toHaveText('revenu');

		// Vérifier la catégorie
		await expect(page.locator('.tx-category')).toHaveText('Argent de poche');

		// Vérifier le montant avec préfixe "+" et style vert
		const amount = page.locator('.tx-amount');
		await expect(amount).toHaveClass(/text-success/);
		await expect(amount).toContainText('+');
		await expect(amount).toContainText('150,00');
	});

	test('create-with-description', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '25.00');
		await page.selectOption('#category', 'Alimentation');
		await page.fill('#description', 'Courses au marché');
		await page.fill('#date', '2024-03-15');
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();

		// Vérifier que la description est affichée
		await expect(page.locator('.tx-description')).toBeVisible();
		await expect(page.locator('.tx-description')).toHaveText('Courses au marché');
	});

	test('create-without-description', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '25.00');
		await page.selectOption('#category', 'Alimentation');
		await page.fill('#date', '2024-03-15');
		// Pas de description
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();

		// Vérifier que la transaction est créée
		await expect(page.locator('.tx-category')).toHaveText('Alimentation');
		// Vérifier qu'aucune description n'est rendue
		await expect(page.locator('.tx-description')).not.toBeVisible();
	});

	test('edit-prefills-form', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		// Créer une transaction
		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '50.00');
		await page.selectOption('#category', 'Transport');
		await page.fill('#description', 'Ticket de bus');
		await page.fill('#date', '2024-06-20');
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		await expect(page.locator('.tx-category')).toHaveText('Transport');

		// Cliquer "Modifier"
		await page.locator('button:has-text("Modifier")').click();
		await expect(page.locator('#type')).toBeVisible();

		// Vérifier le titre du formulaire
		await expect(page.locator('text=Modifier la transaction')).toBeVisible();

		// Vérifier le bouton submit
		await expect(page.locator('button[type="submit"]:has-text("Modifier")')).toBeVisible();

		// Vérifier le bouton Annuler dans le formulaire
		await expect(page.locator('button[type="button"]:has-text("Annuler")')).toBeVisible();

		// Vérifier le pré-remplissage
		await expect(page.locator('#type')).toHaveValue('expense');
		await expect(page.locator('#amount')).toHaveValue('50');
		await expect(page.locator('#category')).toHaveValue('Transport');
		await expect(page.locator('#description')).toHaveValue('Ticket de bus');
		await expect(page.locator('#date')).toHaveValue('2024-06-20');
	});

	test('edit-submit-changes', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		// Créer une transaction
		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '50.00');
		await page.selectOption('#category', 'Alimentation');
		await page.fill('#date', '2024-06-20');
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		await expect(page.locator('.tx-category')).toHaveText('Alimentation');
		await expect(page.locator('.tx-amount')).toContainText('50,00');

		// Cliquer "Modifier"
		await page.locator('button:has-text("Modifier")').click();
		await expect(page.locator('#type')).toBeVisible();

		// Changer montant et catégorie
		await page.fill('#amount', '75.00');
		await page.selectOption('#category', 'Transport');
		await page.locator('button[type="submit"]:has-text("Modifier")').click();

		// Vérifier la mise à jour
		await expect(page.locator('.tx-category')).toHaveText('Transport');
		await expect(page.locator('.tx-amount')).toContainText('75,00');
	});

	test('edit-cancel', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		// Créer une transaction
		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '50.00');
		await page.selectOption('#category', 'Alimentation');
		await page.fill('#date', '2024-06-20');
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		await expect(page.locator('.tx-category')).toHaveText('Alimentation');

		// Ouvrir le formulaire d'édition
		await page.locator('button:has-text("Modifier")').click();
		await expect(page.locator('#type')).toBeVisible();

		// Annuler
		await page.locator('button[type="button"]:has-text("Annuler")').click();

		// Vérifier que le formulaire est fermé
		await expect(page.locator('#type')).not.toBeVisible();

		// Vérifier que la transaction est inchangée
		await expect(page.locator('.tx-category')).toHaveText('Alimentation');
		await expect(page.locator('.tx-amount')).toContainText('50,00');
	});

	test('delete-transaction', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		// Créer une transaction
		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '30.00');
		await page.selectOption('#category', 'Loisirs');
		await page.fill('#date', '2024-06-20');
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		await expect(page.locator('.tx-category')).toHaveText('Loisirs');

		// Accepter le dialog de confirmation
		page.on('dialog', (dialog) => dialog.accept());

		// Supprimer
		await page.locator('button:has-text("Supprimer")').click();

		// Vérifier le retour à l'état vide
		await expect(page.locator('text=Aucune transaction')).toBeVisible();
	});

	test('toggle-form', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		// Vérifier que le formulaire est fermé
		await expect(page.locator('#type')).not.toBeVisible();

		// Ouvrir le formulaire
		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await expect(page.locator('text=Nouvelle transaction')).toBeVisible();

		// Le bouton doit afficher "Annuler"
		const toggleButton = page.locator('.flex-between button.primary');
		await expect(toggleButton).toHaveText('Annuler');

		// Fermer le formulaire
		await toggleButton.click();
		await expect(page.locator('#type')).not.toBeVisible();

		// Le bouton doit afficher "Ajouter"
		await expect(toggleButton).toHaveText('Ajouter');
	});

	test('form-resets-after-submit', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		// Créer un revenu
		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'income');
		await page.fill('#amount', '100.00');
		await page.selectOption('#category', 'Cadeaux');
		await page.fill('#description', 'Anniversaire');
		await page.fill('#date', '2024-05-01');
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();

		// Le formulaire doit être fermé
		await expect(page.locator('#type')).not.toBeVisible();

		// Rouvrir le formulaire
		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();

		// Vérifier les valeurs par défaut
		await expect(page.locator('#type')).toHaveValue('expense');
		await expect(page.locator('#amount')).toHaveValue('');
		await expect(page.locator('#category')).toHaveValue('');
		await expect(page.locator('#description')).toHaveValue('');
	});

	test('multiple-transactions-display', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		const txData = [
			{ type: 'expense', amount: '25.00', category: 'Alimentation', date: '2024-03-15' },
			{ type: 'income', amount: '500.00', category: 'Job etudiant', date: '2024-03-10' },
			{ type: 'expense', amount: '12.00', category: 'Transport', date: '2024-03-20' },
		];

		for (const tx of txData) {
			await expect(page.locator('#type')).not.toBeVisible();
			await page.locator('button:has-text("Ajouter")').click();
			await expect(page.locator('#type')).toBeVisible();
			await page.selectOption('#type', tx.type);
			await page.fill('#amount', tx.amount);
			await page.selectOption('#category', tx.category);
			await page.fill('#date', tx.date);
			await page.locator('button[type="submit"]:has-text("Ajouter")').click();
			await expect(page.locator(`.tx-category:has-text("${tx.category}")`)).toBeVisible();
		}

		// Vérifier que les 3 transactions sont affichées
		await expect(page.locator('.transaction-item')).toHaveCount(3);

		// Vérifier chaque catégorie
		await expect(page.locator('.tx-category:has-text("Alimentation")')).toBeVisible();
		await expect(page.locator('.tx-category:has-text("Job etudiant")')).toBeVisible();
		await expect(page.locator('.tx-category:has-text("Transport")')).toBeVisible();

		// Vérifier les types de badges
		await expect(page.locator('.tx-type.expense')).toHaveCount(2);
		await expect(page.locator('.tx-type.income')).toHaveCount(1);
	});
});
