import { test, expect } from '@playwright/test';

test.describe('Goals', () => {
	test('display-empty-state', async ({ page }) => {
		await page.goto('/goals');
		await expect(page.locator('text=Aucun objectif d\'epargne')).toBeVisible();
	});

	test('create-goal', async ({ page }) => {
		await page.goto('/goals');
		await expect(page.locator('text=Aucun objectif d\'epargne')).toBeVisible();

		await page.locator('button:has-text("Nouvel objectif")').click();
		await expect(page.locator('#name')).toBeVisible();

		await page.fill('#name', 'Nouveau telephone');
		await page.fill('#target', '800');
		await page.locator('button[type="submit"]').click();

		// Vérifier que l'état vide a disparu
		await expect(page.locator('text=Aucun objectif d\'epargne')).not.toBeVisible();

		// Vérifier la carte
		await expect(page.locator('.goal-name')).toHaveText('Nouveau telephone');
		await expect(page.locator('.current')).toContainText('0,00');
		await expect(page.locator('text=sur')).toContainText('800,00');
		await expect(page.locator('.progress-text')).toHaveText('0% atteint');

		// Vérifier les boutons de progression
		await expect(page.getByRole('button', { name: '+1', exact: true })).toBeVisible();
		await expect(page.getByRole('button', { name: '+10' })).toBeVisible();
		await expect(page.getByRole('button', { name: '-1', exact: true })).toBeVisible();
		await expect(page.getByRole('button', { name: '-10' })).toBeVisible();
	});

	test('toggle-form', async ({ page }) => {
		await page.goto('/goals');
		await expect(page.locator('text=Aucun objectif d\'epargne')).toBeVisible();

		// Vérifier que le formulaire est fermé
		await expect(page.locator('#name')).not.toBeVisible();

		// Ouvrir
		const toggleButton = page.locator('.flex-between button.primary');
		await expect(toggleButton).toHaveText('Nouvel objectif');
		await toggleButton.click();
		await expect(page.locator('#name')).toBeVisible();
		await expect(page.locator('text=Creer un objectif')).toBeVisible();
		await expect(toggleButton).toHaveText('Annuler');

		// Fermer
		await toggleButton.click();
		await expect(page.locator('#name')).not.toBeVisible();
		await expect(toggleButton).toHaveText('Nouvel objectif');
	});

	test('form-resets-after-create', async ({ page }) => {
		await page.goto('/goals');
		await expect(page.locator('text=Aucun objectif d\'epargne')).toBeVisible();

		// Créer un objectif
		await page.locator('button:has-text("Nouvel objectif")').click();
		await expect(page.locator('#name')).toBeVisible();
		await page.fill('#name', 'Vacances');
		await page.fill('#target', '500');
		await page.locator('button[type="submit"]').click();
		await expect(page.locator('.goal-name')).toHaveText('Vacances');

		// Rouvrir le formulaire
		await page.locator('button:has-text("Nouvel objectif")').click();
		await expect(page.locator('#name')).toBeVisible();

		// Vérifier que les champs sont vides
		await expect(page.locator('#name')).toHaveValue('');
		await expect(page.locator('#target')).toHaveValue('');
	});

	test('increment-plus-1', async ({ page }) => {
		await page.goto('/goals');
		await expect(page.locator('text=Aucun objectif d\'epargne')).toBeVisible();

		// Créer un objectif cible 100
		await page.locator('button:has-text("Nouvel objectif")').click();
		await expect(page.locator('#name')).toBeVisible();
		await page.fill('#name', 'Test');
		await page.fill('#target', '100');
		await page.locator('button[type="submit"]').click();
		await expect(page.locator('.current')).toContainText('0,00');

		// Cliquer +1
		await page.getByRole('button', { name: '+1', exact: true }).click();

		await expect(page.locator('.current')).toContainText('1,00');
		await expect(page.locator('.progress-text')).toHaveText('1% atteint');
	});

	test('increment-plus-10', async ({ page }) => {
		await page.goto('/goals');
		await expect(page.locator('text=Aucun objectif d\'epargne')).toBeVisible();

		// Créer un objectif cible 100
		await page.locator('button:has-text("Nouvel objectif")').click();
		await expect(page.locator('#name')).toBeVisible();
		await page.fill('#name', 'Test');
		await page.fill('#target', '100');
		await page.locator('button[type="submit"]').click();
		await expect(page.locator('.current')).toContainText('0,00');

		// Cliquer +10
		await page.locator('button:has-text("+10")').click();

		await expect(page.locator('.current')).toContainText('10,00');
		await expect(page.locator('.progress-text')).toHaveText('10% atteint');
	});

	test('decrement-minus-1', async ({ page }) => {
		await page.goto('/goals');
		await expect(page.locator('text=Aucun objectif d\'epargne')).toBeVisible();

		// Créer un objectif et ajouter de la progression
		await page.locator('button:has-text("Nouvel objectif")').click();
		await expect(page.locator('#name')).toBeVisible();
		await page.fill('#name', 'Test');
		await page.fill('#target', '100');
		await page.locator('button[type="submit"]').click();
		await expect(page.locator('.current')).toContainText('0,00');

		await page.locator('button:has-text("+10")').click();
		await expect(page.locator('.current')).toContainText('10,00');

		// Cliquer -1
		await page.getByRole('button', { name: '-1', exact: true }).click();

		await expect(page.locator('.current')).toContainText('9,00');
		await expect(page.locator('.progress-text')).toHaveText('9% atteint');
	});

	test('decrement-minus-10', async ({ page }) => {
		await page.goto('/goals');
		await expect(page.locator('text=Aucun objectif d\'epargne')).toBeVisible();

		// Créer un objectif et ajouter de la progression
		await page.locator('button:has-text("Nouvel objectif")').click();
		await expect(page.locator('#name')).toBeVisible();
		await page.fill('#name', 'Test');
		await page.fill('#target', '100');
		await page.locator('button[type="submit"]').click();
		await expect(page.locator('.current')).toContainText('0,00');

		// Ajouter 2x +10 = 20
		await page.locator('button:has-text("+10")').click();
		await expect(page.locator('.current')).toContainText('10,00');
		await page.locator('button:has-text("+10")').click();
		await expect(page.locator('.current')).toContainText('20,00');

		// Cliquer -10
		await page.locator('button:has-text("-10")').click();

		await expect(page.locator('.current')).toContainText('10,00');
		await expect(page.locator('.progress-text')).toHaveText('10% atteint');
	});

	test('floor-at-zero', async ({ page }) => {
		await page.goto('/goals');
		await expect(page.locator('text=Aucun objectif d\'epargne')).toBeVisible();

		// Créer un objectif à 0
		await page.locator('button:has-text("Nouvel objectif")').click();
		await expect(page.locator('#name')).toBeVisible();
		await page.fill('#name', 'Test');
		await page.fill('#target', '100');
		await page.locator('button[type="submit"]').click();
		await expect(page.locator('.current')).toContainText('0,00');

		// Cliquer -1 : doit rester à 0
		await page.getByRole('button', { name: '-1', exact: true }).click();
		await expect(page.locator('.current')).toContainText('0,00');
		await expect(page.locator('.progress-text')).toHaveText('0% atteint');

		// Cliquer -10 : doit rester à 0
		await page.getByRole('button', { name: '-10' }).click();
		await expect(page.locator('.current')).toContainText('0,00');
		await expect(page.locator('.progress-text')).toHaveText('0% atteint');
	});

	test('achieve-goal', async ({ page }) => {
		await page.goto('/goals');
		await expect(page.locator('text=Aucun objectif d\'epargne')).toBeVisible();

		// Créer un objectif cible 10
		await page.locator('button:has-text("Nouvel objectif")').click();
		await expect(page.locator('#name')).toBeVisible();
		await page.fill('#name', 'Petit objectif');
		await page.fill('#target', '10');
		await page.locator('button[type="submit"]').click();
		await expect(page.locator('.current')).toContainText('0,00');

		// Atteindre l'objectif avec +10
		await page.locator('button:has-text("+10")').click();

		// Vérifier le badge "Atteint !"
		await expect(page.locator('.achieved-badge')).toBeVisible();
		await expect(page.locator('.achieved-badge')).toHaveText('Atteint !');

		// Vérifier la classe achieved sur la carte
		await expect(page.locator('.goal-card.achieved')).toBeVisible();

		// Vérifier la barre de progression avec classe complete
		await expect(page.locator('.progress-fill.complete')).toBeVisible();

		// Vérifier 100% atteint
		await expect(page.locator('.progress-text')).toHaveText('100% atteint');
	});

	test('buttons-hidden-when-achieved', async ({ page }) => {
		await page.goto('/goals');
		await expect(page.locator('text=Aucun objectif d\'epargne')).toBeVisible();

		// Créer et atteindre un objectif
		await page.locator('button:has-text("Nouvel objectif")').click();
		await expect(page.locator('#name')).toBeVisible();
		await page.fill('#name', 'Petit objectif');
		await page.fill('#target', '10');
		await page.locator('button[type="submit"]').click();
		await expect(page.locator('.current')).toContainText('0,00');

		await page.locator('button:has-text("+10")').click();
		await expect(page.locator('.achieved-badge')).toBeVisible();

		// Les boutons +/- doivent avoir disparu
		await expect(page.locator('.goal-actions')).not.toBeVisible();
		await expect(page.getByRole('button', { name: '+1', exact: true })).not.toBeVisible();
		await expect(page.getByRole('button', { name: '+10' })).not.toBeVisible();
		await expect(page.getByRole('button', { name: '-1', exact: true })).not.toBeVisible();
		await expect(page.getByRole('button', { name: '-10' })).not.toBeVisible();

		// Le bouton Supprimer doit toujours être visible
		await expect(page.locator('button:has-text("Supprimer")')).toBeVisible();
	});

	test('delete-goal', async ({ page }) => {
		await page.goto('/goals');
		await expect(page.locator('text=Aucun objectif d\'epargne')).toBeVisible();

		// Créer un objectif
		await page.locator('button:has-text("Nouvel objectif")').click();
		await expect(page.locator('#name')).toBeVisible();
		await page.fill('#name', 'A supprimer');
		await page.fill('#target', '100');
		await page.locator('button[type="submit"]').click();
		await expect(page.locator('.goal-name')).toHaveText('A supprimer');

		// Accepter le dialog de confirmation
		page.on('dialog', (dialog) => dialog.accept());

		// Supprimer
		await page.locator('button:has-text("Supprimer")').click();

		// Vérifier le retour à l'état vide
		await expect(page.locator('text=Aucun objectif d\'epargne')).toBeVisible();
	});

	test('multiple-goals', async ({ page }) => {
		await page.goto('/goals');
		await expect(page.locator('text=Aucun objectif d\'epargne')).toBeVisible();

		const goals = [
			{ name: 'Telephone', target: '800' },
			{ name: 'Vacances', target: '1500' },
			{ name: 'Velo', target: '300' },
		];

		for (const goal of goals) {
			await page.locator('button:has-text("Nouvel objectif")').click();
			await expect(page.locator('#name')).toBeVisible();
			await page.fill('#name', goal.name);
			await page.fill('#target', goal.target);
			await page.locator('button[type="submit"]').click();
			await expect(page.locator(`.goal-name:has-text("${goal.name}")`)).toBeVisible();
		}

		// Vérifier les 3 cartes
		await expect(page.locator('.goal-card')).toHaveCount(3);
		await expect(page.locator('.goal-name:has-text("Telephone")')).toBeVisible();
		await expect(page.locator('.goal-name:has-text("Vacances")')).toBeVisible();
		await expect(page.locator('.goal-name:has-text("Velo")')).toBeVisible();

		// Vérifier que chaque objectif a ses propres boutons de progression
		await expect(page.locator('.goal-actions')).toHaveCount(3);
	});

	test('validation-empty-name', async ({ page }) => {
		await page.goto('/goals');
		await expect(page.locator('text=Aucun objectif d\'epargne')).toBeVisible();

		await page.locator('button:has-text("Nouvel objectif")').click();
		await expect(page.locator('#name')).toBeVisible();

		// Laisser le nom vide, remplir le montant
		await page.fill('#target', '100');

		// Vider le champ name explicitement (au cas où) et soumettre via JS pour contourner la validation HTML5
		await page.locator('#name').evaluate((el) => { (el as HTMLInputElement).removeAttribute('required'); });
		await page.locator('#target').evaluate((el) => { (el as HTMLInputElement).removeAttribute('required'); });
		await page.locator('button[type="submit"]').click();

		// Vérifier le message d'erreur
		await expect(page.locator('text=Veuillez entrer un nom et un montant valides')).toBeVisible();

		// Vérifier qu'aucun objectif n'a été créé
		await expect(page.locator('.goal-card')).toHaveCount(0);
	});

	test('validation-invalid-amount', async ({ page }) => {
		await page.goto('/goals');
		await expect(page.locator('text=Aucun objectif d\'epargne')).toBeVisible();

		await page.locator('button:has-text("Nouvel objectif")').click();
		await expect(page.locator('#name')).toBeVisible();

		// Remplir le nom, laisser le montant vide
		await page.fill('#name', 'Test');

		// Contourner la validation HTML5
		await page.locator('#name').evaluate((el) => { (el as HTMLInputElement).removeAttribute('required'); });
		await page.locator('#target').evaluate((el) => { (el as HTMLInputElement).removeAttribute('required'); });
		await page.locator('button[type="submit"]').click();

		// Vérifier le message d'erreur
		await expect(page.locator('text=Veuillez entrer un nom et un montant valides')).toBeVisible();

		// Vérifier qu'aucun objectif n'a été créé
		await expect(page.locator('.goal-card')).toHaveCount(0);
	});
});
