const DB_NAME = 'mon-budget';
const DB_VERSION = 1;

export const EXPENSE_CATEGORIES = ['Alimentation', 'Transport', 'Loisirs', 'Shopping', 'Abonnements', 'Education', 'Autre']
export const INCOME_CATEGORIES = ['Argent de poche', 'Job etudiant', 'Cadeaux', 'Autre']

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

	// Budgets (all)
	async getAllBudgets() {
		const database = await openDB()
		return new Promise((resolve, reject) => {
			const tx = database.transaction('budgets', 'readonly')
			const store = tx.objectStore('budgets')
			const request = store.getAll()
			request.onsuccess = () => resolve(request.result)
			request.onerror = () => reject(request.error)
		})
	},

	// Metadata counts
	async getMetadata() {
		const database = await openDB()
		return new Promise((resolve, reject) => {
			const tx = database.transaction(['transactions', 'budgets', 'goals'], 'readonly')
			const results = {}
			let pending = 3

			function done() {
				pending--
				if (pending === 0) resolve(results)
			}

			const txCount = tx.objectStore('transactions').count()
			txCount.onsuccess = () => { results.totalTransactions = txCount.result; done() }
			txCount.onerror = () => reject(txCount.error)

			const budgetCount = tx.objectStore('budgets').count()
			budgetCount.onsuccess = () => { results.totalBudgets = budgetCount.result; done() }
			budgetCount.onerror = () => reject(budgetCount.error)

			const goalCount = tx.objectStore('goals').count()
			goalCount.onsuccess = () => { results.totalGoals = goalCount.result; done() }
			goalCount.onerror = () => reject(goalCount.error)
		})
	},

	// Replace all data atomically
	async replaceAllData(importData) {
		const database = await openDB()
		return new Promise((resolve, reject) => {
			const tx = database.transaction(['transactions', 'budgets', 'goals'], 'readwrite')

			tx.oncomplete = () => resolve({ success: true })
			tx.onerror = () => reject(tx.error ?? new Error('Erreur lors du remplacement des données'))
			tx.onabort = () => reject(tx.error ?? new Error('Transaction annulée'))

			const txStore = tx.objectStore('transactions')
			const budgetStore = tx.objectStore('budgets')
			const goalStore = tx.objectStore('goals')

			txStore.clear()
			budgetStore.clear()
			goalStore.clear()

			for (const t of importData.data.transactions) {
				// eslint-disable-next-line no-unused-vars
				const { id, createdAt, description, ...rest } = t
				txStore.add({
					...rest,
					description: description ?? null,
					createdAt: createdAt ?? new Date().toISOString()
				})
			}

			for (const b of importData.data.budgets) {
				budgetStore.put(b)
			}

			for (const g of importData.data.goals) {
				// eslint-disable-next-line no-unused-vars
				const { id, createdAt, current_amount, achieved, ...rest } = g
				goalStore.add({
					...rest,
					current_amount: current_amount ?? 0,
					achieved: achieved ?? false,
					createdAt: createdAt ?? new Date().toISOString()
				})
			}
		})
	},

	// Merge data atomically (add transactions/goals without id, put budgets)
	async mergeData(importData) {
		const database = await openDB()
		return new Promise((resolve, reject) => {
			const tx = database.transaction(['transactions', 'budgets', 'goals'], 'readwrite')

			tx.oncomplete = () => resolve({ success: true })
			tx.onerror = () => reject(tx.error ?? new Error('Erreur lors de la fusion des données'))
			tx.onabort = () => reject(tx.error ?? new Error('Transaction annulée'))

			const txStore = tx.objectStore('transactions')
			const budgetStore = tx.objectStore('budgets')
			const goalStore = tx.objectStore('goals')

			for (const t of importData.data.transactions) {
				// eslint-disable-next-line no-unused-vars
				const { id, createdAt, description, ...rest } = t
				txStore.add({
					...rest,
					description: description ?? null,
					createdAt: createdAt ?? new Date().toISOString()
				})
			}

			for (const b of importData.data.budgets) {
				budgetStore.put(b)
			}

			for (const g of importData.data.goals) {
				// eslint-disable-next-line no-unused-vars
				const { id, createdAt, current_amount, achieved, ...rest } = g
				goalStore.add({
					...rest,
					current_amount: current_amount ?? 0,
					achieved: achieved ?? false,
					createdAt: createdAt ?? new Date().toISOString()
				})
			}
		})
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
