const DB_NAME = 'mon-budget';
const DB_VERSION = 1;

let dbInstance = null;

function openDB() {
	return new Promise((resolve, reject) => {
		if (dbInstance) {
			resolve(dbInstance);
			return;
		}

		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);

		request.onsuccess = () => {
			dbInstance = request.result;
			resolve(dbInstance);
		};

		request.onupgradeneeded = (event) => {
			const db = event.target.result;

			// Store: transactions
			if (!db.objectStoreNames.contains('transactions')) {
				const txStore = db.createObjectStore('transactions', {
					keyPath: 'id',
					autoIncrement: true
				});
				txStore.createIndex('date', 'date');
				txStore.createIndex('type', 'type');
				txStore.createIndex('category', 'category');
			}

			// Store: budgets
			if (!db.objectStoreNames.contains('budgets')) {
				db.createObjectStore('budgets', { keyPath: 'month' });
			}

			// Store: goals
			if (!db.objectStoreNames.contains('goals')) {
				db.createObjectStore('goals', {
					keyPath: 'id',
					autoIncrement: true
				});
			}
		};
	});
}

export const db = {
	// Transactions
	async getTransactions(params = {}) {
		const database = await openDB();
		return new Promise((resolve, reject) => {
			const tx = database.transaction('transactions', 'readonly');
			const store = tx.objectStore('transactions');
			const request = store.getAll();

			request.onsuccess = () => {
				let results = request.result;

				// Filtrer par type si demandé
				if (params.type) {
					results = results.filter(t => t.type === params.type);
				}

				// Filtrer par mois si demandé
				if (params.month) {
					results = results.filter(t => t.date && t.date.startsWith(params.month));
				}

				// Trier par date décroissante
				results.sort((a, b) => new Date(b.date) - new Date(a.date));

				resolve(results);
			};

			request.onerror = () => reject(request.error);
		});
	},

	async createTransaction(data) {
		const database = await openDB();
		return new Promise((resolve, reject) => {
			const tx = database.transaction('transactions', 'readwrite');
			const store = tx.objectStore('transactions');

			const transaction = {
				...data,
				createdAt: new Date().toISOString()
			};

			const request = store.add(transaction);

			request.onsuccess = () => {
				resolve({ ...transaction, id: request.result });
			};

			request.onerror = () => reject(request.error);
		});
	},

	async updateTransaction(id, data) {
		const database = await openDB();
		return new Promise((resolve, reject) => {
			const tx = database.transaction('transactions', 'readwrite');
			const store = tx.objectStore('transactions');

			const getRequest = store.get(id);

			getRequest.onsuccess = () => {
				const existing = getRequest.result;
				if (!existing) {
					reject(new Error('Transaction not found'));
					return;
				}

				const updated = { ...existing, ...data, id };
				const putRequest = store.put(updated);

				putRequest.onsuccess = () => resolve(updated);
				putRequest.onerror = () => reject(putRequest.error);
			};

			getRequest.onerror = () => reject(getRequest.error);
		});
	},

	async deleteTransaction(id) {
		const database = await openDB();
		return new Promise((resolve, reject) => {
			const tx = database.transaction('transactions', 'readwrite');
			const store = tx.objectStore('transactions');
			const request = store.delete(id);

			request.onsuccess = () => resolve({ success: true });
			request.onerror = () => reject(request.error);
		});
	},

	// Budgets
	async getBudget(month) {
		const database = await openDB();
		return new Promise((resolve, reject) => {
			const tx = database.transaction('budgets', 'readonly');
			const store = tx.objectStore('budgets');
			const request = store.get(month);

			request.onsuccess = () => {
				resolve(request.result || { month, amount: 0 });
			};

			request.onerror = () => reject(request.error);
		});
	},

	async setBudget(month, amount) {
		const database = await openDB();
		return new Promise((resolve, reject) => {
			const tx = database.transaction('budgets', 'readwrite');
			const store = tx.objectStore('budgets');
			const budget = { month, amount };
			const request = store.put(budget);

			request.onsuccess = () => resolve(budget);
			request.onerror = () => reject(request.error);
		});
	},

	// Goals
	async getGoals() {
		const database = await openDB();
		return new Promise((resolve, reject) => {
			const tx = database.transaction('goals', 'readonly');
			const store = tx.objectStore('goals');
			const request = store.getAll();

			request.onsuccess = () => {
				// Trier par date de création décroissante
				const results = request.result.sort(
					(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
				);
				resolve(results);
			};

			request.onerror = () => reject(request.error);
		});
	},

	async createGoal(name, target_amount) {
		const database = await openDB();
		return new Promise((resolve, reject) => {
			const tx = database.transaction('goals', 'readwrite');
			const store = tx.objectStore('goals');

			const goal = {
				name,
				target_amount,
				current_amount: 0,
				achieved: false,
				createdAt: new Date().toISOString()
			};

			const request = store.add(goal);

			request.onsuccess = () => {
				resolve({ ...goal, id: request.result });
			};

			request.onerror = () => reject(request.error);
		});
	},

	async updateGoal(id, data) {
		const database = await openDB();
		return new Promise((resolve, reject) => {
			const tx = database.transaction('goals', 'readwrite');
			const store = tx.objectStore('goals');

			const getRequest = store.get(id);

			getRequest.onsuccess = () => {
				const existing = getRequest.result;
				if (!existing) {
					reject(new Error('Goal not found'));
					return;
				}

				const updated = { ...existing, ...data, id };
				const putRequest = store.put(updated);

				putRequest.onsuccess = () => resolve(updated);
				putRequest.onerror = () => reject(putRequest.error);
			};

			getRequest.onerror = () => reject(getRequest.error);
		});
	},

	async deleteGoal(id) {
		const database = await openDB();
		return new Promise((resolve, reject) => {
			const tx = database.transaction('goals', 'readwrite');
			const store = tx.objectStore('goals');
			const request = store.delete(id);

			request.onsuccess = () => resolve({ success: true });
			request.onerror = () => reject(request.error);
		});
	},

	// Dashboard
	async getDashboard() {
		const transactions = await this.getTransactions();
		const currentMonth = new Date().toISOString().slice(0, 7);

		let total_income = 0;
		let total_expenses = 0;
		let monthly_income = 0;
		let monthly_expenses = 0;

		for (const tx of transactions) {
			const amount = parseFloat(tx.amount) || 0;
			const isCurrentMonth = tx.date && tx.date.startsWith(currentMonth);

			if (tx.type === 'income') {
				total_income += amount;
				if (isCurrentMonth) monthly_income += amount;
			} else if (tx.type === 'expense') {
				total_expenses += amount;
				if (isCurrentMonth) monthly_expenses += amount;
			}
		}

		// Transactions récentes (5 dernières)
		const recent_transactions = transactions.slice(0, 5).map(tx => ({
			...tx,
			transaction_type: tx.type
		}));

		return {
			balance: total_income - total_expenses,
			monthly_income,
			monthly_expenses,
			total_income,
			total_expenses,
			recent_transactions
		};
	}
};
