import { test, expect, type Page } from '@playwright/test';

async function addTransaction(page: Page, type: 'income' | 'expense', amount: string, category: string, date: string) {
	await page.locator('button:has-text("Ajouter")').click();
	await expect(page.locator('#type')).toBeVisible();
	await page.selectOption('#type', type);
	await page.fill('#amount', amount);
	await page.selectOption('#category', category);
	await page.fill('#date', date);
	await page.locator('button[type="submit"]:has-text("Ajouter")').click();
	await expect(page.locator(`text=${category}`).first()).toBeVisible();
}

test.describe('Dashboard', () => {
	test('display-total-stats', async ({ page }) => {
		// Créer plusieurs transactions
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		// Transaction 1
		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'income');
		await page.fill('#amount', '500.00');
		await page.selectOption('#category', 'Argent de poche');
		await page.fill('#date', '2024-01-10');
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		await expect(page.locator('text=Argent de poche')).toBeVisible();

		// Transaction 2
		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '349.50');
		await page.selectOption('#category', 'Alimentation');
		await page.fill('#date', '2024-01-15');
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		await expect(page.locator('text=Alimentation')).toBeVisible();

		await page.goto('/');

		// Vérifier l'historique total
		await expect(page.locator('text=Historique')).toBeVisible();
		await expect(page.locator('text=Total revenus')).toBeVisible();
		await expect(page.locator('text=500,00').first()).toBeVisible();
		await expect(page.locator('text=Total depenses')).toBeVisible();
		await expect(page.locator('text=349,50').first()).toBeVisible();
	});

	test('display-recent-transactions', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'expense');
		await page.fill('#amount', '15.50');
		await page.selectOption('#category', 'Alimentation');
		await page.fill('#date', '2024-01-15');
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		await expect(page.locator('text=Alimentation')).toBeVisible();

		await page.locator('button:has-text("Ajouter")').click();
		await expect(page.locator('#type')).toBeVisible();
		await page.selectOption('#type', 'income');
		await page.fill('#amount', '200.00');
		await page.selectOption('#category', 'Argent de poche');
		await page.fill('#date', '2024-01-10');
		await page.locator('button[type="submit"]:has-text("Ajouter")').click();
		await expect(page.locator('text=Argent de poche')).toBeVisible();

		await page.goto('/');

		// Vérifier que les transactions récentes sont affichées
		await expect(page.locator('text=Transactions recentes')).toBeVisible();
		await expect(page.locator('text=Alimentation')).toBeVisible();
		await expect(page.locator('text=Argent de poche')).toBeVisible();
	});

	test('empty-state', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();
	});

	test('link-to-transactions', async ({ page }) => {
		await page.goto('/');
		await page.locator('text=Voir tout').click();
		await expect(page).toHaveURL('/transactions');
	});

	test('balance-positive-style', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();
		await addTransaction(page, 'income', '500.00', 'Argent de poche', '2024-01-10');
		await addTransaction(page, 'expense', '100.00', 'Alimentation', '2024-01-10');

		await page.goto('/');
		await expect(page.locator('h1')).toContainText('Tableau de bord');

		const balance = page.locator('.balance');
		await expect(balance).toHaveClass(/positive/);
		await expect(balance).not.toHaveClass(/negative/);
	});

	test('balance-negative-style', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();
		await addTransaction(page, 'expense', '300.00', 'Alimentation', '2024-01-10');
		await addTransaction(page, 'income', '100.00', 'Argent de poche', '2024-01-10');

		await page.goto('/');
		await expect(page.locator('h1')).toContainText('Tableau de bord');

		const balance = page.locator('.balance');
		await expect(balance).toHaveClass(/negative/);
		await expect(balance).not.toHaveClass(/positive/);
	});

	test('limit-5-recent-transactions', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		// Créer 7 transactions avec des dates croissantes
		await addTransaction(page, 'expense', '10.00', 'Alimentation', '2024-01-01');
		await addTransaction(page, 'expense', '20.00', 'Transport', '2024-01-02');
		await addTransaction(page, 'expense', '30.00', 'Loisirs', '2024-01-03');
		await addTransaction(page, 'income', '40.00', 'Argent de poche', '2024-01-04');
		await addTransaction(page, 'expense', '50.00', 'Shopping', '2024-01-05');
		await addTransaction(page, 'expense', '60.00', 'Abonnements', '2024-01-06');
		await addTransaction(page, 'income', '70.00', 'Job etudiant', '2024-01-07');

		await page.goto('/');
		await expect(page.locator('text=Transactions recentes')).toBeVisible();

		// Seules 5 transactions récentes doivent s'afficher
		const items = page.locator('.transaction-item');
		await expect(items).toHaveCount(5);

		// Les 5 plus récentes (triées par date décroissante) : Job etudiant, Abonnements, Shopping, Argent de poche, Loisirs
		await expect(items.nth(0)).toContainText('Job etudiant');
		await expect(items.nth(1)).toContainText('Abonnements');
		await expect(items.nth(2)).toContainText('Shopping');
		await expect(items.nth(3)).toContainText('Argent de poche');
		await expect(items.nth(4)).toContainText('Loisirs');

		// Les 2 plus anciennes ne doivent pas apparaître
		await expect(page.locator('.transaction-item:has-text("Transport")')).toHaveCount(0);
		await expect(page.locator('.transaction-item:has-text("10,00")')).toHaveCount(0);
	});

	test('monthly-stats-isolation', async ({ page }) => {
		const now = new Date();
		const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
		const lastMonth = now.getMonth() === 0
			? `${now.getFullYear() - 1}-12`
			: `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;

		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();

		// Transaction du mois courant
		await addTransaction(page, 'income', '1000.00', 'Job etudiant', `${currentMonth}-15`);
		await addTransaction(page, 'expense', '200.00', 'Alimentation', `${currentMonth}-10`);
		// Transaction du mois dernier
		await addTransaction(page, 'expense', '500.00', 'Transport', `${lastMonth}-05`);
		await addTransaction(page, 'income', '300.00', 'Argent de poche', `${lastMonth}-01`);

		await page.goto('/');
		await expect(page.locator('h1')).toContainText('Tableau de bord');

		// "Ce mois-ci" ne doit compter que le mois courant
		const monthCard = page.locator('.card:has-text("Ce mois-ci")');
		await expect(monthCard.locator('.text-success')).toContainText('1 000,00');
		await expect(monthCard.locator('.text-danger')).toContainText('200,00');

		// "Historique" doit compter tout
		const historyCard = page.locator('.card:has-text("Historique")');
		await expect(historyCard.locator('.text-success')).toContainText('1 300,00');
		await expect(historyCard.locator('.text-danger')).toContainText('700,00');
	});

	test('income-format-in-recent', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();
		await addTransaction(page, 'income', '250.00', 'Job etudiant', '2024-01-10');

		await page.goto('/');
		await expect(page.locator('text=Transactions recentes')).toBeVisible();

		const item = page.locator('.transaction-item');
		await expect(item).toHaveCount(1);
		// Préfixe "+" et style vert
		await expect(item.locator('.text-success')).toContainText('+');
		await expect(item.locator('.text-success')).toContainText('250,00');
	});

	test('expense-format-in-recent', async ({ page }) => {
		await page.goto('/transactions');
		await expect(page.locator('text=Aucune transaction')).toBeVisible();
		await addTransaction(page, 'expense', '75.00', 'Transport', '2024-01-10');

		await page.goto('/');
		await expect(page.locator('text=Transactions recentes')).toBeVisible();

		const item = page.locator('.transaction-item');
		await expect(item).toHaveCount(1);
		// Préfixe "-" et style rouge
		await expect(item.locator('.text-danger')).toContainText('-');
		await expect(item.locator('.text-danger')).toContainText('75,00');
	});
});
