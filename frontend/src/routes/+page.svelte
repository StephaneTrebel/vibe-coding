<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { api } from '$lib/api.js';

	let dashboard = null;
	let loading = true;
	let error = null;

	onMount(async () => {
		auth.subscribe((state) => {
			if (!state.isAuthenticated) {
				window.location.href = '/login';
			}
		});

		try {
			dashboard = await api.getDashboard();
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	});

	function formatEuro(amount) {
		return new Intl.NumberFormat('fr-FR', {
			style: 'currency',
			currency: 'EUR'
		}).format(amount);
	}

	function formatDate(dateStr) {
		return new Date(dateStr).toLocaleDateString('fr-FR');
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

		<div class="grid grid-2">
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
					<a href="/transactions">Voir tout</a>
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
	{/if}
</div>

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
</style>
