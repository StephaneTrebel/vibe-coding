<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.js';
	import { api } from '$lib/api.js';

	let goals = [];
	let loading = true;
	let error = null;
	let showForm = false;

	let form = {
		name: '',
		target_amount: ''
	};

	onMount(() => {
		auth.subscribe(async (state) => {
			if (!state.initialized) return;

			if (!state.isAuthenticated) {
				goto('/login');
				return;
			}

			if (goals.length === 0 && loading) {
				await loadGoals();
			}
		});
	});

	async function loadGoals() {
		try {
			goals = await api.getGoals();
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	async function createGoal() {
		try {
			const target = parseFloat(form.target_amount);
			if (!form.name || isNaN(target) || target <= 0) {
				error = 'Veuillez entrer un nom et un montant valides';
				return;
			}
			await api.createGoal(form.name, target);
			form = { name: '', target_amount: '' };
			showForm = false;
			error = null;
			await loadGoals();
		} catch (e) {
			error = e.message;
		}
	}

	async function updateProgress(goal, amount) {
		try {
			const newAmount = Math.max(0, goal.current_amount + amount);
			const achieved = newAmount >= goal.target_amount;
			await api.updateGoal(goal.id, {
				current_amount: newAmount,
				achieved
			});
			await loadGoals();
		} catch (e) {
			error = e.message;
		}
	}

	async function deleteGoal(id) {
		if (confirm('Voulez-vous vraiment supprimer cet objectif ?')) {
			try {
				await api.deleteGoal(id);
				await loadGoals();
			} catch (e) {
				error = e.message;
			}
		}
	}

	function formatEuro(amount) {
		return new Intl.NumberFormat('fr-FR', {
			style: 'currency',
			currency: 'EUR'
		}).format(amount);
	}

	function getProgress(goal) {
		return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
	}
</script>

<svelte:head>
	<title>Objectifs d'epargne - Mon Budget</title>
</svelte:head>

<div class="container">
	<div class="flex-between mb-3">
		<h1>Objectifs d'epargne</h1>
		<button class="primary" onclick={() => showForm = !showForm}>
			{showForm ? 'Annuler' : 'Nouvel objectif'}
		</button>
	</div>

	{#if error}
		<p class="error mb-2">{error}</p>
	{/if}

	{#if showForm}
		<div class="card mb-3">
			<h2 class="mb-2">Creer un objectif</h2>
			<form onsubmit={(e) => { e.preventDefault(); createGoal(); }}>
				<div class="grid grid-2">
					<div class="form-group">
						<label for="name">Nom de l'objectif</label>
						<input type="text" id="name" bind:value={form.name} placeholder="Ex: Nouveau telephone" required />
					</div>
					<div class="form-group">
						<label for="target">Montant cible</label>
						<input type="number" id="target" bind:value={form.target_amount} step="0.01" min="0.01" required />
					</div>
				</div>
				<button type="submit" class="primary">Creer l'objectif</button>
			</form>
		</div>
	{/if}

	{#if loading}
		<p class="text-muted">Chargement...</p>
	{:else if goals.length === 0}
		<div class="card text-center">
			<p class="text-muted">Aucun objectif d'epargne. Creez le premier !</p>
		</div>
	{:else}
		<div class="goals-grid">
			{#each goals as goal}
				<div class="card goal-card" class:achieved={goal.achieved}>
					<div class="goal-header">
						<h3>{goal.name}</h3>
						{#if goal.achieved}
							<span class="badge achieved-badge">Atteint !</span>
						{/if}
					</div>

					<div class="goal-amounts">
						<span class="current">{formatEuro(goal.current_amount)}</span>
						<span class="text-muted">sur {formatEuro(goal.target_amount)}</span>
					</div>

					<div class="progress-bar">
						<div
							class="progress-fill"
							class:complete={goal.achieved}
							style="width: {getProgress(goal)}%"
						></div>
					</div>
					<p class="progress-text text-muted">{getProgress(goal).toFixed(0)}% atteint</p>

					{#if !goal.achieved}
						<div class="goal-actions">
							<button class="small secondary" onclick={() => updateProgress(goal, -10)}>-10</button>
							<button class="small secondary" onclick={() => updateProgress(goal, -1)}>-1</button>
							<button class="small primary" onclick={() => updateProgress(goal, 1)}>+1</button>
							<button class="small primary" onclick={() => updateProgress(goal, 10)}>+10</button>
						</div>
					{/if}

					<button class="small danger delete-btn" onclick={() => deleteGoal(goal.id)}>Supprimer</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.goals-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 20px;
	}

	.goal-card {
		position: relative;
	}

	.goal-card.achieved {
		border: 2px solid var(--secondary);
	}

	.goal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.badge {
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.achieved-badge {
		background: var(--secondary);
		color: white;
	}

	.goal-amounts {
		margin-bottom: 12px;
	}

	.current {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--primary);
	}

	.progress-bar {
		height: 12px;
		background: var(--bg-input);
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 8px;
	}

	.progress-fill {
		height: 100%;
		background: var(--primary);
		transition: width 0.3s ease;
	}

	.progress-fill.complete {
		background: var(--secondary);
	}

	.progress-text {
		font-size: 0.875rem;
		margin-bottom: 16px;
	}

	.goal-actions {
		display: flex;
		gap: 8px;
		justify-content: center;
		margin-bottom: 12px;
	}

	.delete-btn {
		width: 100%;
	}

	.error {
		color: var(--danger);
		background: rgba(239, 68, 68, 0.1);
		padding: 12px;
		border-radius: var(--radius);
	}
</style>
