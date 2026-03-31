<script>
	// Props
	// data: [{ month: 'YYYY-MM', budget: number, spent: number }]
	// period: 6 | 12
	let { data = [], period = 6 } = $props()

	let selectedPeriod = $state(6)

	$effect(() => {
		selectedPeriod = period
	})

	const WIDTH = 600
	const HEIGHT = 280
	const PADDING = { top: 20, right: 20, bottom: 60, left: 90 }
	const CHART_W = WIDTH - PADDING.left - PADDING.right
	const CHART_H = HEIGHT - PADDING.top - PADDING.bottom

	const COLOR_BUDGET = 'var(--chart-budget)'
	const COLOR_SPENT  = 'var(--chart-expense)'

	function monthLabel(yyyyMM) {
		const [year, month] = yyyyMM.split('-')
		return new Date(year, month - 1, 1).toLocaleDateString('fr-FR', { month: 'short' })
	}

	let displayed = $derived(data.slice(-selectedPeriod))

	let maxValue = $derived(displayed.length === 0 ? 1 : Math.max(...displayed.flatMap(d => [d.budget || 0, d.spent || 0]), 1))
	let yMax = $derived(Math.ceil(maxValue / 100) * 100 || 100)

	let yTicks = $derived([0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * yMax)))

	let points = $derived(displayed.map((d, i) => ({
		x: displayed.length <= 1 ? CHART_W / 2 : displayed.length === 2 ? i * CHART_W : (i / (displayed.length - 1)) * CHART_W,
		yBudget: CHART_H - (d.budget / yMax) * CHART_H,
		ySpent:  CHART_H - (d.spent  / yMax) * CHART_H,
		label: monthLabel(d.month),
	})))

	let pointsBudget = $derived(points.map(p => `${p.x},${p.yBudget}`).join(' '))
	let pointsSpent  = $derived(points.map(p => `${p.x},${p.ySpent}`).join(' '))

	function formatEuro(n) {
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
	}
</script>

<div class="chart-wrapper" data-testid="line-chart">
	<div class="toggle">
		<button class:active={selectedPeriod === 6} onclick={() => selectedPeriod = 6}>6 mois</button>
		<button class:active={selectedPeriod === 12} onclick={() => selectedPeriod = 12}>12 mois</button>
	</div>

	<svg
		viewBox="0 0 {WIDTH} {HEIGHT}"
		width="100%"
		aria-label="Graphique évolution du budget"
		role="img"
	>
		<g transform="translate({PADDING.left}, {PADDING.top})">
			<!-- Grille horizontale -->
			{#each yTicks as tick}
				{@const y = CHART_H - (tick / yMax) * CHART_H}
				<line x1="0" y1={y} x2={CHART_W} y2={y} stroke="var(--chart-grid)" stroke-width="1" />
				<text x="-8" y={y + 4} text-anchor="end" font-size="26" fill="var(--chart-axis)">{formatEuro(tick)}</text>
			{/each}

			<!-- Courbe budget (pointillés) -->
			<polyline
				points={pointsBudget}
				fill="none"
				stroke={COLOR_BUDGET}
				stroke-width="2"
				stroke-dasharray="6 3"
			/>

			<!-- Courbe dépenses (pleine) -->
			<polyline
				points={pointsSpent}
				fill="none"
				stroke={COLOR_SPENT}
				stroke-width="2"
			/>

			<!-- Points et labels -->
			{#each points as p}
				<circle cx={p.x} cy={p.yBudget} r="4" fill={COLOR_BUDGET} />
				<circle cx={p.x} cy={p.ySpent}  r="4" fill={COLOR_SPENT} />
				<text
					x={p.x}
					y={CHART_H + 16}
					text-anchor="middle"
				font-size="28"
				fill="var(--chart-axis)"
				>{p.label}</text>
			{/each}

			<!-- Axe X -->
			<line x1="0" y1={CHART_H} x2={CHART_W} y2={CHART_H} stroke="var(--border)" stroke-width="1" />
		</g>
	</svg>

	<!-- Légende -->
	<div class="legend">
		<span class="legend-item">
			<svg width="20" height="10" aria-hidden="true">
				<line x1="0" y1="5" x2="20" y2="5" stroke={COLOR_BUDGET} stroke-width="2" stroke-dasharray="4 2" />
			</svg>
			Budget alloué
		</span>
		<span class="legend-item">
			<svg width="20" height="10" aria-hidden="true">
				<line x1="0" y1="5" x2="20" y2="5" stroke={COLOR_SPENT} stroke-width="2" />
			</svg>
			Dépenses réelles
		</span>
	</div>
</div>

<style>
	.chart-wrapper {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	svg {
		display: block;
	}

	.toggle {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
	}

	.toggle button {
		padding: 4px 12px;
		font-size: 0.8rem;
		border-radius: 20px;
		background: var(--bg-input);
		color: var(--text-muted);
		border: 1px solid var(--border);
		cursor: pointer;
		transition: all 0.2s;
	}

	.toggle button.active {
		background: var(--primary);
		color: var(--text-on-light);
		border-color: var(--primary);
	}

	.legend {
		display: flex;
		justify-content: center;
		gap: 24px;
		font-size: 1.05rem;
		color: var(--text-muted);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 6px;
	}
</style>
