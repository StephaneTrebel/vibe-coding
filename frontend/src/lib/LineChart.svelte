<script>
	// Props
	// data: [{ month: 'YYYY-MM', budget: number, spent: number }]
	export let data = []
	export let period = 6  // 6 | 12

	const WIDTH = 600
	const HEIGHT = 280
	const PADDING = { top: 20, right: 20, bottom: 40, left: 60 }
	const CHART_W = WIDTH - PADDING.left - PADDING.right
	const CHART_H = HEIGHT - PADDING.top - PADDING.bottom

	const COLOR_BUDGET = '#a5b4fc'   // --primary
	const COLOR_SPENT  = '#fb9494'   // --danger

	function monthLabel(yyyyMM) {
		const [year, month] = yyyyMM.split('-')
		return new Date(year, month - 1, 1).toLocaleDateString('fr-FR', { month: 'short' })
	}

	$: displayed = data.slice(-period)

	$: maxValue = Math.max(...displayed.flatMap(d => [d.budget, d.spent]), 1)
	$: yMax = Math.ceil(maxValue / 100) * 100 || 100

	$: yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * yMax))

	function xPos(i) {
		if (displayed.length <= 1) return CHART_W / 2
		return (i / (displayed.length - 1)) * CHART_W
	}

	function yPos(value) {
		return CHART_H - (value / yMax) * CHART_H
	}

	function polyline(key) {
		return displayed.map((d, i) => `${xPos(i)},${yPos(d[key])}`).join(' ')
	}

	function formatEuro(n) {
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
	}
</script>

<div class="chart-wrapper" data-testid="line-chart">
	<div class="toggle">
		<button class:active={period === 6} on:click={() => period = 6}>6 mois</button>
		<button class:active={period === 12} on:click={() => period = 12}>12 mois</button>
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
				<line x1="0" y1={y} x2={CHART_W} y2={y} stroke="rgba(255,255,255,0.08)" stroke-width="1" />
				<text x="-8" y={y + 4} text-anchor="end" font-size="10" fill="#a8b8cc">{formatEuro(tick)}</text>
			{/each}

			<!-- Courbe budget (pointillés) -->
			<polyline
				points={polyline('budget')}
				fill="none"
				stroke={COLOR_BUDGET}
				stroke-width="2"
				stroke-dasharray="6 3"
			/>

			<!-- Courbe dépenses (pleine) -->
			<polyline
				points={polyline('spent')}
				fill="none"
				stroke={COLOR_SPENT}
				stroke-width="2"
			/>

			<!-- Points -->
			{#each displayed as d, i}
				<circle cx={xPos(i)} cy={yPos(d.budget)} r="4" fill={COLOR_BUDGET} />
				<circle cx={xPos(i)} cy={yPos(d.spent)}  r="4" fill={COLOR_SPENT} />
				<!-- Label mois -->
				<text
					x={xPos(i)}
					y={CHART_H + 16}
					text-anchor="middle"
					font-size="11"
					fill="#a8b8cc"
				>{monthLabel(d.month)}</text>
			{/each}

			<!-- Axe X -->
			<line x1="0" y1={CHART_H} x2={CHART_W} y2={CHART_H} stroke="#475569" stroke-width="1" />
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
		color: #1e293b;
		border-color: var(--primary);
	}

	.legend {
		display: flex;
		justify-content: center;
		gap: 24px;
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 6px;
	}
</style>
