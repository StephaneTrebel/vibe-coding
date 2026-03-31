<script>
	import { onMount } from 'svelte'
	import { db } from '$lib/db.js'
	import PieChart from '$lib/PieChart.svelte'
	import LineChart from '$lib/LineChart.svelte'
	import { createSwipeHandler } from '$lib/swipe.js'

	let budget = $state(null)
	let spent = $state(0)
	let loading = $state(true)
	let error = $state(null)
	let budgetAmount = $state('')
	let currentMonth = $state((() => {
		const d = new Date()
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
	})())

	// Données graphiques
	let pieData = $state([])
	let lineData = $state([])

	// Retour visuel swipe
	let dragOffset = $state(0)
	let showHint = $state(false)

	// Référence DOM pour les listeners touch
	let monthNavEl = $state(null)

	let remaining = $derived((budget?.amount || 0) - spent)
	let percentage = $derived(budget?.amount ? Math.min((spent / budget.amount) * 100, 100) : 0)
	let isOverBudget = $derived(remaining < 0)
	let hasLineData = $derived(lineData.some(d => d.budget > 0 || d.spent > 0))

	onMount(async () => {
		await loadData()
		lineData = await loadLineData()
		const cleanupSwipe = registerSwipe()
		triggerHint()
		return cleanupSwipe
	})

	function registerSwipe() {
		if (!monthNavEl) return

		const handler = createSwipeHandler({
			onSwipeLeft() {
				if (loading) return
				changeMonth(1)
				if (navigator.vibrate) navigator.vibrate(10)
			},
			onSwipeRight() {
				if (loading) return
				changeMonth(-1)
				if (navigator.vibrate) navigator.vibrate(10)
			}
		})

		const onMove = (e) => {
			const dx = handler.handleTouchMove(e)
			dragOffset = dx ?? 0
		}
		const onEnd = (e) => {
			dragOffset = 0
			handler.handleTouchEnd(e)
		}
		const onCancel = () => {
			dragOffset = 0
			handler.handleTouchCancel()
		}

		monthNavEl.addEventListener('touchstart', handler.handleTouchStart, { passive: true })
		monthNavEl.addEventListener('touchmove', onMove, { passive: true })
		monthNavEl.addEventListener('touchend', onEnd, { passive: true })
		monthNavEl.addEventListener('touchcancel', onCancel, { passive: true })

		return () => {
			monthNavEl.removeEventListener('touchstart', handler.handleTouchStart)
			monthNavEl.removeEventListener('touchmove', onMove)
			monthNavEl.removeEventListener('touchend', onEnd)
			monthNavEl.removeEventListener('touchcancel', onCancel)
		}
	}

	function triggerHint() {
		if (typeof localStorage === 'undefined') return
		if (localStorage.getItem('budget-swipe-hint-shown')) return
		localStorage.setItem('budget-swipe-hint-shown', '1')
		showHint = true
		setTimeout(() => { showHint = false }, 800)
	}

	async function loadData() {
		loading = true
		try {
			const [budgetData, transactions] = await Promise.all([
				db.getBudget(currentMonth),
				db.getTransactions({ month: currentMonth, type: 'expense' })
			])

			budget = budgetData
			budgetAmount = budget?.amount?.toString() || ''
			spent = transactions.reduce((sum, tx) => sum + tx.amount, 0)
			pieData = buildPieData(transactions)
		} catch (e) {
			error = e.message
		} finally {
			loading = false
		}
	}

	function buildPieData(transactions) {
		const map = {}
		for (const tx of transactions) {
			map[tx.category] = (map[tx.category] || 0) + tx.amount
		}
		return Object.entries(map)
			.map(([category, amount]) => ({ category, amount }))
			.sort((a, b) => b.amount - a.amount)
	}

	async function loadLineData() {
		const months = getLast12Months()
		const results = await Promise.all(
			months.map(async month => {
				const [b, txs] = await Promise.all([
					db.getBudget(month),
					db.getTransactions({ month, type: 'expense' })
				])
				return {
					month,
					budget: b?.amount || 0,
					spent: txs.reduce((s, t) => s + t.amount, 0),
				}
			})
		)
		return results
	}

	function getLast12Months() {
		const months = []
		const now = new Date()
		for (let i = 11; i >= 0; i--) {
			const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
			months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
		}
		return months
	}

	async function saveBudget() {
		try {
			const amount = parseFloat(budgetAmount)
			if (isNaN(amount) || amount < 0) {
				error = 'Veuillez entrer un montant valide'
				return
			}
			budget = await db.setBudget(currentMonth, amount)
			error = null
			lineData = await loadLineData()
		} catch (e) {
			error = e.message
		}
	}

	async function changeMonth(delta) {
		try {
			const [year, month] = currentMonth.split('-').map(Number)
			const date = new Date(year, month - 1 + delta, 1)
			currentMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
			await loadData()
			lineData = await loadLineData()
		} catch (e) {
			error = e.message
		}
	}

	function formatEuro(amount) {
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
	}

	function formatMonth(monthStr) {
		const [year, month] = monthStr.split('-').map(Number)
		const date = new Date(year, month - 1, 1)
		return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
	}
</script>

<svelte:head>
	<title>Budget - Mon Budget</title>
</svelte:head>

<div class="container">
	<h1 class="mb-3">Budget mensuel</h1>

	<div
		class="month-nav card mb-3"
		class:swipe-hint={showHint}
		bind:this={monthNavEl}
		style="transform: translateX({dragOffset}px) rotate({dragOffset * 0.05}deg);
		       opacity: {Math.abs(dragOffset) > 10 ? 0.85 : 1};
		       transition: {dragOffset === 0 ? 'transform 0.2s ease, opacity 0.2s ease' : 'none'}"
	>
		<button class="secondary" onclick={() => changeMonth(-1)} aria-label="Mois précédent">
			<span class="btn-text">Precedent</span>
			<span class="btn-icon" aria-hidden="true">←</span>
		</button>
		<h2 class="month-title">{formatMonth(currentMonth)}</h2>
		<button class="secondary" onclick={() => changeMonth(1)} aria-label="Mois suivant">
			<span class="btn-text">Suivant</span>
			<span class="btn-icon" aria-hidden="true">→</span>
		</button>
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
			<div class="card mb-3">
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

		{#if pieData.length > 0}
			<div class="card mb-3" data-testid="pie-chart-card">
				<h3 class="mb-3">Dépenses par catégorie — {formatMonth(currentMonth)}</h3>
				<PieChart data={pieData} />
			</div>
		{/if}

		{#if hasLineData}
			<div class="card" data-testid="line-chart-card">
				<h3 class="mb-3">Évolution du budget</h3>
				<LineChart data={lineData} />
			</div>
		{/if}
	{/if}
</div>

<style>
	.month-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		will-change: transform;
		touch-action: pan-y;
	}

	.month-nav h2 {
		text-transform: capitalize;
	}

	.month-nav .btn-icon {
		display: none;
	}

	@media (max-width: 767px) {
		.month-nav {
			gap: 8px;
		}

		.month-nav .btn-text {
			display: none;
		}

		.month-nav .btn-icon {
			display: inline;
			font-size: 1.5rem;
		}

		.month-nav button {
			min-width: 44px;
			min-height: 44px;
			padding: 8px;
		}

		.month-title {
			font-size: 1.1rem;
			text-align: center;
		}
	}

	/* Affordance hint : glisse légèrement à droite puis revient */
	@keyframes swipe-hint {
		0%   { transform: translateX(0) }
		40%  { transform: translateX(12px) rotate(0.6deg) }
		100% { transform: translateX(0) rotate(0) }
	}

	.month-nav.swipe-hint {
		animation: swipe-hint 0.8s ease-in-out;
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
