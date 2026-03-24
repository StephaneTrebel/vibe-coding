<script>
	import { onMount, tick } from 'svelte'
	import { base } from '$app/paths'
	import { db } from '$lib/db.js'
	import { exportToJSON, readAndValidate, confirmImport } from '$lib/export.js'
	import BarChart from '$lib/BarChart.svelte'

	let dashboard = $state(null)
	let loading = $state(true)
	let error = $state(null)
	let barData = $state([])

	// Export/import state
	let importFileInput = $state(null)
	let importError = $state(null)
	let importSuccess = $state(null)
	let exportSuccess = $state(null)
	let showImportModal = $state(false)
	let pendingImportData = $state(null)
	let pendingComparison = $state(null)
	let replaceCountdown = $state(0)
	let countdownTimer = null
	let triggerElement = null
	let modalFirstButton = $state(null)

	onMount(async () => {
		try {
			dashboard = await db.getDashboard()
			barData = await loadBarData()
		} catch (e) {
			error = e.message
		} finally {
			loading = false
		}

		function handleKeydown(e) {
			if (e.key === 'Escape' && showImportModal) {
				closeModal('cancel')
			}
		}
		document.addEventListener('keydown', handleKeydown)
		return () => document.removeEventListener('keydown', handleKeydown)
	})

	$effect(() => {
		if (importFileInput) {
			importFileInput.addEventListener('change', handleImportFile)
			importFileInput.dataset.listenerReady = 'true'
			return () => {
				importFileInput.removeEventListener('change', handleImportFile)
				delete importFileInput.dataset.listenerReady
			}
		}
	})

	async function loadBarData() {
		const transactions = await db.getTransactions({})
		const months = getLast6Months()
		return months.map(month => {
			const txs = transactions.filter(t => t.date.startsWith(month))
			const income   = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
			const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
			return { month, income, expenses }
		})
	}

	function getLast6Months() {
		const months = []
		const now = new Date()
		for (let i = 5; i >= 0; i--) {
			const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
			const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
			months.push(month)
		}
		return months
	}

	let hasBarData = $derived(barData.some(d => d.income > 0 || d.expenses > 0))

	function formatEuro(amount) {
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
	}

	function formatDate(dateStr) {
		return new Date(dateStr).toLocaleDateString('fr-FR')
	}

	async function handleExport() {
		importError = null
		exportSuccess = null
		try {
			const result = await exportToJSON()
			exportSuccess = `Fichier "${result.filename}" téléchargé avec succès.`
		} catch (e) {
			importError = e.message
		}
	}

	async function handleImportFile(e) {
		const file = e.target.files?.[0]
		if (!file) return

		importError = null
		importSuccess = null
		exportSuccess = null
		e.target.value = ''

		try {
			const result = await readAndValidate(file)

			if (result.success) {
				const c = result.count
				importSuccess = `Import réussi : ${c.transactions} transaction(s), ${c.budgets} budget(s), ${c.goals} objectif(s).`
				dashboard = await db.getDashboard()
				barData = await loadBarData()
			} else if (result.requiresConfirmation) {
				pendingImportData = result.importData
				pendingComparison = result.comparison
				openModal()
			}
		} catch (e) {
			importError = e.message
		}
	}

	function openModal() {
		triggerElement = document.activeElement
		showImportModal = true
		replaceCountdown = 2
		clearInterval(countdownTimer)
		countdownTimer = setInterval(() => {
			replaceCountdown--
			if (replaceCountdown <= 0) {
				replaceCountdown = 0
				clearInterval(countdownTimer)
			}
		}, 1000)
		tick().then(() => {
			modalFirstButton?.focus()
		})
	}

	async function closeModal(strategy) {
		showImportModal = false
		clearInterval(countdownTimer)

		if (strategy && strategy !== 'cancel') {
			importError = null
			importSuccess = null
			try {
				await confirmImport($state.snapshot(pendingImportData), strategy)
				importSuccess = `Import réussi (${strategy === 'replace' ? 'remplacement' : 'fusion'}).`
				dashboard = await db.getDashboard()
				barData = await loadBarData()
			} catch (e) {
				importError = e.message
			}
		}

		pendingImportData = null
		pendingComparison = null
		await tick()
		triggerElement?.focus()
	}
</script>

<svelte:head>
	<title>Tableau de bord - Mon Budget</title>
</svelte:head>

<div class="container">
	<h1 class="mb-3">Tableau de bord</h1>

	{#if loading}
		<p class="text-muted">Chargement...</p>
	{:else if error}
		<p class="text-danger">{error}</p>
	{:else if dashboard}
		<div class="grid grid-2 mb-3">
			<div class="card balance-card">
				<p class="text-muted mb-1">Solde actuel</p>
				<p class="balance" class:positive={dashboard.balance >= 0} class:negative={dashboard.balance < 0}>
					{formatEuro(dashboard.balance)}
				</p>
			</div>

			<div class="card">
				<p class="text-muted mb-1">Ce mois-ci</p>
				<div class="month-stats">
					<div>
						<p class="stat-label">Revenus</p>
						<p class="text-success">{formatEuro(dashboard.monthly_income)}</p>
					</div>
					<div>
						<p class="stat-label">Depenses</p>
						<p class="text-danger">{formatEuro(dashboard.monthly_expenses)}</p>
					</div>
				</div>
			</div>
		</div>

		<div class="grid grid-2 mb-3">
			<div class="card">
				<h2 class="mb-2">Historique</h2>
				<div class="all-time-stats">
					<div class="stat-row">
						<span class="text-muted">Total revenus</span>
						<span class="text-success">{formatEuro(dashboard.total_income)}</span>
					</div>
					<div class="stat-row">
						<span class="text-muted">Total depenses</span>
						<span class="text-danger">{formatEuro(dashboard.total_expenses)}</span>
					</div>
				</div>
			</div>

			<div class="card">
				<div class="flex-between mb-2">
					<h2>Transactions recentes</h2>
					<a href="{base}/transactions">Voir tout</a>
				</div>

				{#if dashboard.recent_transactions.length === 0}
					<p class="text-muted">Aucune transaction</p>
				{:else}
					<div class="transactions-list">
						{#each dashboard.recent_transactions.slice(0, 5) as tx}
							<div class="transaction-item">
								<div>
									<p class="tx-category">{tx.category}</p>
									<p class="tx-date text-muted">{formatDate(tx.date)}</p>
								</div>
								<p class:text-success={tx.transaction_type === 'income'} class:text-danger={tx.transaction_type === 'expense'}>
									{tx.transaction_type === 'income' ? '+' : '-'}{formatEuro(tx.amount)}
								</p>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		{#if hasBarData}
			<div class="card" data-testid="bar-chart-card">
				<h2 class="mb-3">Revenus vs Dépenses — 6 derniers mois</h2>
				<BarChart data={barData} />
			</div>
		{/if}
	{/if}

	<section class="card mt-3" aria-labelledby="data-management-title">
		<h2 id="data-management-title" class="mb-2">Gestion des données</h2>

		<div class="data-actions">
			<button class="primary" data-testid="export-button" onclick={handleExport}>
				Exporter les données
			</button>

			<label class="btn-label secondary" for="import-file-trigger">
				Importer des données
			</label>
			<input
				type="file"
				id="import-file-trigger"
				accept=".json"
				class="sr-only"
				data-testid="import-file-input"
				bind:this={importFileInput}
				tabindex="-1"
			/>
		</div>

		{#if importError}
			<p role="alert" class="text-danger mt-2" data-testid="import-error-message">{importError}</p>
		{/if}
		{#if importSuccess}
			<p role="status" class="text-success mt-2" data-testid="import-success-message">{importSuccess}</p>
		{/if}
		{#if exportSuccess}
			<p role="status" class="text-success mt-2">{exportSuccess}</p>
		{/if}
	</section>
</div>

{#if showImportModal}
	<div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="import-modal-title" data-testid="import-modal">
		<div class="modal-content">
			<h2 id="import-modal-title" data-testid="import-modal-title" class="mb-2">Importer des données</h2>

			{#if pendingComparison}
				<div class="mb-2" data-testid="import-modal-summary">
					<table class="comparison-table">
						<thead>
							<tr>
								<th></th>
								<th>Existant</th>
								<th>Fichier importé</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Transactions</td>
								<td>{pendingComparison.existing.transactions}</td>
								<td>{pendingComparison.incoming.transactions}</td>
							</tr>
							<tr>
								<td>Budgets</td>
								<td>{pendingComparison.existing.budgets}</td>
								<td>{pendingComparison.incoming.budgets}</td>
							</tr>
							<tr>
								<td>Objectifs</td>
								<td>{pendingComparison.existing.goals}</td>
								<td>{pendingComparison.incoming.goals}</td>
							</tr>
						</tbody>
					</table>
					<p class="text-muted mt-2" style="font-size:0.875rem">
						Note : lors d'une fusion, le budget de chaque mois sera remplacé par celui du fichier importé.
					</p>
				</div>
			{/if}

			<div class="modal-actions">
				<button
					class="primary modal-btn"
					data-testid="import-action-merge"
					bind:this={modalFirstButton}
					onclick={() => closeModal('merge')}
				>
					Fusionner
				</button>
				<button
					class="danger modal-btn"
					data-testid="import-action-replace"
					disabled={replaceCountdown > 0}
					onclick={() => closeModal('replace')}
				>
					{replaceCountdown > 0 ? `Remplacer (${replaceCountdown}s)` : 'Remplacer'}
				</button>
				<button
					class="secondary modal-btn"
					data-testid="import-action-cancel"
					onclick={() => closeModal('cancel')}
				>
					Annuler
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.balance-card {
		text-align: center;
	}

	.balance {
		font-size: 2.5rem;
		font-weight: 700;
	}

	.balance.positive {
		color: var(--secondary);
	}

	.balance.negative {
		color: var(--danger);
	}

	.month-stats {
		display: flex;
		justify-content: space-around;
		text-align: center;
	}

	.month-stats p:last-child {
		font-size: 1.5rem;
		font-weight: 600;
	}

	.stat-label {
		color: var(--text-muted);
		margin-bottom: 4px;
	}

	.all-time-stats {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		font-size: 1.1rem;
	}

	.transactions-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.transaction-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px;
		background: var(--bg-input);
		border-radius: 8px;
	}

	.tx-category {
		font-weight: 500;
	}

	.tx-date {
		font-size: 0.875rem;
	}

	/* Data management section */
	.data-actions {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.btn-label {
		display: inline-flex;
		align-items: center;
		cursor: pointer;
		border: none;
		border-radius: var(--radius);
		padding: 12px 24px;
		font-size: 1rem;
		font-weight: 600;
		transition: all 0.2s;
		background: var(--bg-input);
		color: var(--text);
		min-height: 48px;
	}

	.btn-label:hover {
		background: var(--border);
	}

	/* Modal overlay */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 20px;
	}

	.modal-content {
		background: var(--bg-card);
		border-radius: var(--radius);
		padding: 32px;
		max-width: 520px;
		width: 100%;
		border: 1px solid var(--border);
	}

	.modal-actions {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
		margin-top: 24px;
	}

	.modal-btn {
		min-height: 48px;
	}

	/* Comparison table */
	.comparison-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	.comparison-table th,
	.comparison-table td {
		padding: 8px 12px;
		text-align: left;
		border-bottom: 1px solid var(--border);
	}

	.comparison-table th {
		color: var(--text-muted);
		font-weight: 600;
	}

	/* Mobile modal */
	@media (max-width: 767px) {
		.modal-overlay {
			align-items: flex-end;
			padding: 0;
		}

		.modal-content {
			border-radius: var(--radius) var(--radius) 0 0;
			max-width: 100%;
			padding: 24px;
		}

		.modal-actions {
			flex-direction: column;
		}

		.modal-btn {
			width: 100%;
		}
	}
</style>
