<script>
	import { onMount } from 'svelte'
	import { db, EXPENSE_CATEGORIES as expenseCategories, INCOME_CATEGORIES as incomeCategories } from '$lib/db.js'

	function getTodayDate() {
		return new Date().toISOString().split('T')[0]
	}

	let transactions = $state([])
	let loading = $state(true)
	let error = $state(null)
	let showForm = $state(false)
	let editingId = $state(null)

	let form = $state({
		type: 'expense',
		amount: '',
		category: '',
		description: '',
		date: getTodayDate()
	})

	let categories = $derived(form.type === 'expense' ? expenseCategories : incomeCategories)

	onMount(async () => {
		await loadTransactions()
	})

	async function loadTransactions() {
		try {
			transactions = await db.getTransactions()
		} catch (e) {
			error = e.message
		} finally {
			loading = false
		}
	}

	function resetForm() {
		form = {
			type: 'expense',
			amount: '',
			category: '',
			description: '',
			date: getTodayDate()
		}
		editingId = null
		showForm = false
	}

	async function handleSubmit() {
		try {
			const data = {
				type: form.type,
				amount: parseFloat(form.amount),
				category: form.category,
				description: form.description || null,
				date: form.date
			}

			if (editingId) {
				await db.updateTransaction(editingId, data)
			} else {
				await db.createTransaction(data)
			}

			resetForm()
			await loadTransactions()
		} catch (e) {
			error = e.message
		}
	}

	function editTransaction(tx) {
		form = {
			type: tx.type,
			amount: tx.amount.toString(),
			category: tx.category,
			description: tx.description || '',
			date: tx.date
		}
		editingId = tx.id
		showForm = true
	}

	async function deleteTransaction(id) {
		if (confirm('Voulez-vous vraiment supprimer cette transaction ?')) {
			try {
				await db.deleteTransaction(id)
				await loadTransactions()
			} catch (e) {
				error = e.message
			}
		}
	}

	function formatEuro(amount) {
		return new Intl.NumberFormat('fr-FR', {
			style: 'currency',
			currency: 'EUR'
		}).format(amount)
	}

	function formatDate(dateStr) {
		return new Date(dateStr).toLocaleDateString('fr-FR')
	}

	function getTypeLabel(type) {
		return type === 'income' ? 'revenu' : 'depense'
	}
</script>

<svelte:head>
	<title>Transactions - Mon Budget</title>
</svelte:head>

<div class="container">
	<div class="flex-between mb-3">
		<h1>Transactions</h1>
		<button class="primary" onclick={() => showForm = !showForm}>
			{showForm ? 'Annuler' : 'Ajouter'}
		</button>
	</div>

	{#if error}
		<p class="error mb-2">{error}</p>
	{/if}

	{#if showForm}
		<div class="card mb-3">
			<h2 class="mb-2">{editingId ? 'Modifier la' : 'Nouvelle'} transaction</h2>
			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
				<div class="grid grid-2">
					<div class="form-group">
						<label for="type">Type</label>
						<select id="type" bind:value={form.type}>
							<option value="expense">Depense</option>
							<option value="income">Revenu</option>
						</select>
					</div>

					<div class="form-group">
						<label for="amount">Montant</label>
						<input type="number" id="amount" bind:value={form.amount} step="0.01" min="0.01" required />
					</div>

					<div class="form-group">
						<label for="category">Categorie</label>
						<select id="category" bind:value={form.category} required>
							<option value="">Choisir une categorie</option>
							{#each categories as cat}
								<option value={cat}>{cat}</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label for="date">Date</label>
						<input type="date" id="date" bind:value={form.date} required />
					</div>
				</div>

				<div class="form-group">
					<label for="description">Description (optionnel)</label>
					<input type="text" id="description" bind:value={form.description} />
				</div>

				<div class="flex">
					<button type="submit" class="primary">
						{editingId ? 'Modifier' : 'Ajouter'}
					</button>
					{#if editingId}
						<button type="button" class="secondary" onclick={resetForm}>Annuler</button>
					{/if}
				</div>
			</form>
		</div>
	{/if}

	{#if loading}
		<p class="text-muted">Chargement...</p>
	{:else if transactions.length === 0}
		<div class="card text-center">
			<p class="text-muted">Aucune transaction. Ajoutez la premiere !</p>
		</div>
	{:else}
		<div class="transactions-list">
			{#each transactions as tx}
				<div class="card transaction-item">
					<div class="tx-info">
						<div class="tx-main">
							<span class="tx-type" class:income={tx.type === 'income'} class:expense={tx.type === 'expense'}>
								{getTypeLabel(tx.type)}
							</span>
							<span class="tx-category">{tx.category}</span>
						</div>
						{#if tx.description}
							<p class="tx-description text-muted">{tx.description}</p>
						{/if}
						<p class="tx-date text-muted">{formatDate(tx.date)}</p>
					</div>
					<div class="tx-right">
						<p class="tx-amount" class:text-success={tx.type === 'income'} class:text-danger={tx.type === 'expense'}>
							{tx.type === 'income' ? '+' : '-'}{formatEuro(tx.amount)}
						</p>
						<div class="tx-actions">
							<button class="small secondary" onclick={() => editTransaction(tx)} aria-label="Modifier">
								<span class="btn-text">Modifier</span>
								<span class="btn-icon" aria-hidden="true">✏️</span>
							</button>
							<button class="small danger" onclick={() => deleteTransaction(tx.id)} aria-label="Supprimer">
								<span class="btn-text">Supprimer</span>
								<span class="btn-icon" aria-hidden="true">🗑️</span>
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.transactions-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.transaction-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.tx-main {
		display: flex;
		gap: 12px;
		align-items: center;
		margin-bottom: 4px;
	}

	.tx-type {
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.tx-type.income {
		background: rgba(16, 185, 129, 0.2);
		color: var(--secondary);
	}

	.tx-type.expense {
		background: rgba(239, 68, 68, 0.2);
		color: var(--danger);
	}

	.tx-category {
		font-weight: 600;
	}

	.tx-description {
		font-size: 0.875rem;
		margin-bottom: 4px;
	}

	.tx-date {
		font-size: 0.875rem;
	}

	.tx-right {
		text-align: right;
	}

	.tx-amount {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 8px;
	}

	.tx-actions {
		display: flex;
		gap: 8px;
	}

	.tx-actions .btn-icon {
		display: none;
	}

	.error {
		color: var(--danger);
		background: rgba(239, 68, 68, 0.1);
		padding: 12px;
		border-radius: var(--radius);
	}

	/* === RESPONSIVE : MOBILE (< 768px) === */
	@media (max-width: 767px) {
		.transaction-item {
			flex-direction: column;
			gap: 12px;
			align-items: stretch;
		}

		.tx-right {
			text-align: left;
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.tx-actions {
			justify-content: flex-start;
		}

		.tx-actions button {
			min-width: 44px;
			min-height: 44px;
		}

		/* Masquer texte, afficher icône */
		.tx-actions .btn-text {
			display: none;
		}

		.tx-actions .btn-icon {
			display: inline;
			font-size: 1.2rem;
		}
	}
</style>
