import { Page } from '@playwright/test';

const TEST_USER = {
	email: 'test-e2e@example.com',
	password: 'test-password-123',
};

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Authentifie l'utilisateur de test en s'inscrivant ou en se connectant
 */
export async function authenticateTestUser(page: Page): Promise<void> {
	// Essayer de se connecter
	const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(TEST_USER),
	});

	let token: string;
	let user: any;

	if (loginResponse.ok) {
		// L'utilisateur existe déjà, connexion réussie
		const data = await loginResponse.json();
		token = data.token;
		user = data.user;
	} else {
		// L'utilisateur n'existe pas, inscription
		const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(TEST_USER),
		});

		if (!registerResponse.ok) {
			throw new Error('Failed to register test user');
		}

		const data = await registerResponse.json();
		token = data.token;
		user = data.user;
	}

	// Injecter le token et user dans le localStorage du navigateur
	await page.goto('/');
	await page.evaluate(
		({ token, user }) => {
			localStorage.setItem('token', token);
			localStorage.setItem('user', JSON.stringify(user));
		},
		{ token, user }
	);
}

/**
 * Nettoie toutes les données créées par l'utilisateur de test
 */
export async function cleanupTestData(page: Page): Promise<void> {
	// Récupérer le token depuis localStorage
	const token = await page.evaluate(() => localStorage.getItem('token'));

	if (!token) return;

	// Supprimer toutes les transactions
	const transactionsResponse = await fetch(`${API_URL}/api/transactions`, {
		headers: { 'Authorization': `Bearer ${token}` },
	});

	if (transactionsResponse.ok) {
		const transactions = await transactionsResponse.json();
		for (const tx of transactions) {
			await fetch(`${API_URL}/api/transactions/${tx.id}`, {
				method: 'DELETE',
				headers: { 'Authorization': `Bearer ${token}` },
			});
		}
	}

	// Supprimer tous les objectifs
	const goalsResponse = await fetch(`${API_URL}/api/goals`, {
		headers: { 'Authorization': `Bearer ${token}` },
	});

	if (goalsResponse.ok) {
		const goals = await goalsResponse.json();
		for (const goal of goals) {
			await fetch(`${API_URL}/api/goals/${goal.id}`, {
				method: 'DELETE',
				headers: { 'Authorization': `Bearer ${token}` },
			});
		}
	}

	// Supprimer tous les budgets
	// On essaie de supprimer les budgets pour plusieurs mois
	const currentDate = new Date();
	for (let i = -2; i <= 2; i++) {
		const date = new Date(currentDate);
		date.setMonth(date.getMonth() + i);
		const month = date.toISOString().slice(0, 7);

		await fetch(`${API_URL}/api/budget/${month}`, {
			method: 'DELETE',
			headers: { 'Authorization': `Bearer ${token}` },
		});
	}
}
