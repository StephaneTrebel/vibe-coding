<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { api } from '$lib/api.js';

	let budget = null;
	let spent = 0;
	let loading = true;
	let error = null;
	let budgetAmount = '';
	let currentMonth = new Date().toISOString().slice(0, 7);

	onMount(async () => {
		auth.subscribe((state) => {
			if (!state.isAuthenticated) {
				window.location.href = '/login';
			}
		});
		await loadData();
	});

	async function loadData() {
		loading = true;
		try {
			const [budgetData, transactions] = await Promise.all([
				api.getBudget(currentMonth),
				api.getTransactions({ month: currentMonth, type: 'expense' })
			]);

			budget = budgetData;
			budgetAmount = budget?.amount?.toString() || '';
			spent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	async function saveBudget() {
		try {
			const amount = parseFloat(budgetAmount);
			if (isNaN(amount) || amount < 0) {
				error = 'Veuillez entrer un montant valide';
				return;
			}
			budget = await api.setBudget(currentMonth, amount);
			error = null;
		} catch (e) {
			error = e.message;
		}
	}

	async function changeMonth(delta) {
		const date = new Date(currentMonth + '-01');
		date.setMonth(date.getMonth() + delta);
		currentMonth = date.toISOString().slice(0, 7);
		await loadData();
	}

	function formatEuro(amount) {
		return new Intl.NumberFormat('fr-FR', {
			style: 'currency',
			currency: 'EUR'
		}).format(amount);
	}

	function formatMonth(monthStr) {
		const date = new Date(monthStr + '-01');
		return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
	}

	$: remaining = (budget?.amount || 0) - spent;
	$: percentage = budget?.amount ? Math.min((spent / budget.amount) * 100, 100) : 0;
	$: isOverBudget = remaining < 0;
</script>

<svelte:head>
	<title>Budget - Mon Budget</title>
</svelte:head>

<div class="container">
	<h1 class="mb-3">Budget mensuel</h1>

	<div class="month-nav card mb-3">
		<button class="secondary" onclick={() => changeMonth(-1)}>Precedent</button>
		<h2>{formatMonth(currentMonth)}</h2>
		<button class="secondary" onclick={() => changeMonth(1)}>Suivant</button>
	</div>

	{#if error}
		<p class="error mb-2">{error}</p>
	{/if}

	{#if loading}
		<p class="text-muted">Chargement...</p>
	{:else}
		<div class="grid grid-2 mb-3">
			<div class="card">
				<h3 class="mb-2">Definir le budget</h3>
				<div class="form-group">
					<label for="budget">Montant du budget mensuel</label>
					<input
						type="number"
						id="budget"
						bind:value={budgetAmount}
						step="0.01"
						min="0"
						placeholder="Entrer le montant"
					/>
				</div>
				<button class="primary" onclick={saveBudget}>Enregistrer</button>
			</div>

			<div class="card">
				<h3 class="mb-2">Resume</h3>
				<div class="summary-stats">
					<div class="stat-row">
						<span class="text-muted">Budget</span>
						<span>{budget ? formatEuro(budget.amount) : 'Non defini'}</span>
					</div>
					<div class="stat-row">
						<span class="text-muted">Depense</span>
						<span class="text-danger">{formatEuro(spent)}</span>
					</div>
					<div class="stat-row">
						<span class="text-muted">Restant</span>
						<span class:text-success={!isOverBudget} class:text-danger={isOverBudget}>
							{formatEuro(remaining)}
						</span>
					</div>
				</div>
			</div>
		</div>

		{#if budget}
			<div class="card">
				<h3 class="mb-2">Progression</h3>
				<div class="progress-container">
					<div class="progress-bar">
						<div
							class="progress-fill"
							class:warning={percentage > 75 && percentage <= 100}
							class:danger={percentage > 100}
							style="width: {percentage}%"
						></div>
					</div>
					<p class="progress-text text-muted">
						{percentage.toFixed(0)}% du budget utilise
					</p>
				</div>

				{#if isOverBudget}
					<p class="warning-text text-danger mt-2">
						Vous avez depasse votre budget de {formatEuro(Math.abs(remaining))} !
					</p>
				{:else if percentage > 75}
					<p class="warning-text text-warning mt-2">
						Attention, vous approchez de la limite !
					</p>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.month-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.month-nav h2 {
		text-transform: capitalize;
	}

	.summary-stats {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		font-size: 1.1rem;
	}

	.progress-container {
		margin-top: 12px;
	}

	.progress-bar {
		height: 24px;
		background: var(--bg-input);
		border-radius: 12px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--secondary);
		transition: width 0.3s ease;
	}

	.progress-fill.warning {
		background: var(--warning);
	}

	.progress-fill.danger {
		background: var(--danger);
	}

	.progress-text {
		text-align: center;
		margin-top: 8px;
	}

	.warning-text {
		text-align: center;
		font-weight: 500;
	}

	.text-warning {
		color: var(--warning);
	}

	.error {
		color: var(--danger);
		background: rgba(239, 68, 68, 0.1);
		padding: 12px;
		border-radius: var(--radius);
	}
</style>
