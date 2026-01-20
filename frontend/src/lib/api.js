const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request(endpoint, options = {}) {
	const token = localStorage.getItem('token');

	const headers = {
		'Content-Type': 'application/json',
		...options.headers
	};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const response = await fetch(`${API_URL}${endpoint}`, {
		...options,
		headers
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Request failed' }));
		throw new Error(error.error || 'Request failed');
	}

	return response.json();
}

export const api = {
	// Auth
	register: (email, password) =>
		request('/api/auth/register', {
			method: 'POST',
			body: JSON.stringify({ email, password })
		}),

	login: (email, password) =>
		request('/api/auth/login', {
			method: 'POST',
			body: JSON.stringify({ email, password })
		}),

	// Dashboard
	getDashboard: () => request('/api/dashboard/summary'),

	// Transactions
	getTransactions: (params = {}) => {
		const query = new URLSearchParams(params).toString();
		return request(`/api/transactions${query ? `?${query}` : ''}`);
	},

	createTransaction: (data) =>
		request('/api/transactions', {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	updateTransaction: (id, data) =>
		request(`/api/transactions/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data)
		}),

	deleteTransaction: (id) =>
		request(`/api/transactions/${id}`, { method: 'DELETE' }),

	// Budget
	getBudget: (month) => request(`/api/budget/${month}`),

	setBudget: (month, amount) =>
		request('/api/budget', {
			method: 'POST',
			body: JSON.stringify({ month, amount })
		}),

	// Goals
	getGoals: () => request('/api/goals'),

	createGoal: (name, target_amount) =>
		request('/api/goals', {
			method: 'POST',
			body: JSON.stringify({ name, target_amount })
		}),

	updateGoal: (id, data) =>
		request(`/api/goals/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data)
		}),

	deleteGoal: (id) =>
		request(`/api/goals/${id}`, { method: 'DELETE' })
};
