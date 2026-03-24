import { db, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '$lib/db.js'

export async function exportToJSON() {
	const [transactions, budgets, goals] = await Promise.all([
		db.getTransactions({}),
		db.getAllBudgets(),
		db.getGoals()
	])

	const payload = {
		version: 1,
		appName: 'Mon Budget',
		exportDate: new Date().toISOString(),
		metadata: {
			totalTransactions: transactions.length,
			totalBudgets: budgets.length,
			totalGoals: goals.length
		},
		data: {
			transactions: transactions.map(t => {
				const obj = {
					id: t.id,
					type: t.type,
					amount: t.amount,
					category: t.category,
					date: t.date,
					createdAt: t.createdAt
				}
				if (t.description != null) obj.description = t.description
				return obj
			}),
			budgets,
			goals
		}
	}

	const json = JSON.stringify(payload, null, 2)
	const blob = new Blob([json], { type: 'application/json' })
	const url = URL.createObjectURL(blob)

	const today = new Date().toISOString().slice(0, 10)
	const filename = `mon-budget-${today}.json`

	const a = document.createElement('a')
	a.href = url
	a.download = filename
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)

	return { success: true, filename }
}

export async function readAndValidate(file) {
	const text = await file.text()

	let parsed
	try {
		parsed = JSON.parse(text)
	} catch {
		throw new Error('Le fichier n\'est pas un JSON valide')
	}

	if (parsed.appName !== 'Mon Budget') {
		throw new Error('Ce fichier n\'est pas un export Mon Budget')
	}

	if (parsed.version !== 1) {
		if (parsed.version > 1) {
			throw new Error('Mettez à jour l\'application pour importer ce fichier')
		}
		throw new Error('Version non supportée')
	}

	if (
		!Array.isArray(parsed.data?.transactions) ||
		!Array.isArray(parsed.data?.budgets) ||
		!Array.isArray(parsed.data?.goals)
	) {
		throw new Error('Structure de données manquante')
	}

	if (parsed.metadata?.totalTransactions !== parsed.data.transactions.length) {
		throw new Error('Fichier corrompu : le nombre de transactions ne correspond pas')
	}
	if (parsed.metadata?.totalBudgets !== parsed.data.budgets.length) {
		throw new Error('Fichier corrompu : le nombre de budgets ne correspond pas')
	}
	if (parsed.metadata?.totalGoals !== parsed.data.goals.length) {
		throw new Error('Fichier corrompu : le nombre d\'objectifs ne correspond pas')
	}

	const datePattern = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/
	const monthPattern = /^\d{4}-(?:0[1-9]|1[0-2])$/

	for (let i = 0; i < parsed.data.transactions.length; i++) {
		const t = parsed.data.transactions[i]
		if (t.type !== 'income' && t.type !== 'expense') {
			throw new Error(`Transaction ${i + 1} : type invalide (attendu "income" ou "expense")`)
		}
		if (typeof t.amount !== 'number' || t.amount <= 0) {
			throw new Error(`Transaction ${i + 1} : montant invalide (doit être > 0)`)
		}
		if (!datePattern.test(t.date)) {
			throw new Error(`Transaction ${i + 1} : date invalide (attendu YYYY-MM-DD)`)
		}
		const allowedCategories = t.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
		if (!allowedCategories.includes(t.category)) {
			throw new Error(`Transaction ${i + 1} : catégorie invalide pour le type "${t.type}"`)
		}
	}

	for (let i = 0; i < parsed.data.budgets.length; i++) {
		const b = parsed.data.budgets[i]
		if (!monthPattern.test(b.month)) {
			throw new Error(`Budget ${i + 1} : mois invalide (attendu YYYY-MM)`)
		}
		if (typeof b.amount !== 'number' || b.amount < 0) {
			throw new Error(`Budget ${i + 1} : montant invalide (doit être >= 0)`)
		}
	}

	for (let i = 0; i < parsed.data.goals.length; i++) {
		const g = parsed.data.goals[i]
		if (!g.name || typeof g.name !== 'string' || g.name.trim() === '') {
			throw new Error(`Objectif ${i + 1} : nom vide`)
		}
		if (typeof g.target_amount !== 'number' || g.target_amount <= 0) {
			throw new Error(`Objectif ${i + 1} : montant cible invalide (doit être > 0)`)
		}
	}

	const existing = await db.getMetadata()
	const isEmpty = existing.totalTransactions === 0 && existing.totalBudgets === 0 && existing.totalGoals === 0

	if (isEmpty) {
		await db.replaceAllData(parsed)
		const count = {
			transactions: parsed.data.transactions.length,
			budgets: parsed.data.budgets.length,
			goals: parsed.data.goals.length
		}
		return { success: true, count }
	}

	return {
		requiresConfirmation: true,
		importData: parsed,
		comparison: {
			existing: {
				transactions: existing.totalTransactions,
				budgets: existing.totalBudgets,
				goals: existing.totalGoals
			},
			incoming: {
				transactions: parsed.data.transactions.length,
				budgets: parsed.data.budgets.length,
				goals: parsed.data.goals.length
			}
		}
	}
}

export async function confirmImport(importData, strategy) {
	if (strategy === 'cancel') {
		return { success: false, cancelled: true }
	}
	if (strategy === 'replace') {
		await db.replaceAllData(importData)
	} else if (strategy === 'merge') {
		await db.mergeData(importData)
	}
	return { success: true }
}
