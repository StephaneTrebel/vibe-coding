<script>
	// Props
	// data: [{ month: 'YYYY-MM', income: number, expenses: number }]
	let { data = [] } = $props()

	const WIDTH = 600
	const HEIGHT = 300
	const PADDING = { top: 20, right: 20, bottom: 40, left: 60 }
	const CHART_W = WIDTH - PADDING.left - PADDING.right
	const CHART_H = HEIGHT - PADDING.top - PADDING.bottom

	const COLOR_INCOME = '#34d399'   // --secondary
	const COLOR_EXPENSE = '#fb9494'  // --danger

	function monthLabel(yyyyMM) {
		const [year, month] = yyyyMM.split('-')
		return new Date(year, month - 1, 1).toLocaleDateString('fr-FR', { month: 'short' })
	}

	let maxValue = $derived(data.length === 0 ? 1 : Math.max(...data.flatMap(d => [d.income || 0, d.expenses || 0]), 1))
	let yMax = $derived(Math.ceil(maxValue / 100) * 100 || 100)

	let slotW = $derived(data.length > 0 ? CHART_W / data.length : CHART_W)
	const BAR_GAP = 4
	let barW = $derived(data.length === 0 ? 4 : Math.max((slotW - BAR_GAP * 3) / 2, 4))

	function barX(i, isIncome) {
		const slotStart = i * slotW
		const groupStart = slotStart + (slotW - barW * 2 - BAR_GAP) / 2
		return groupStart + (isIncome ? 0 : barW + BAR_GAP)
	}

	function barH(value) {
		return (value / yMax) * CHART_H
	}

	function barY(value) {
		return CHART_H - barH(value)
	}

	// Y axis ticks (4 steps)
	let yTicks = $derived([0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * yMax)))

	function formatEuro(n) {
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
	}
</script>

<div class="chart-wrapper" data-testid="bar-chart">
	<svg
		viewBox="0 0 {WIDTH} {HEIGHT}"
		width="100%"
		aria-label="Graphique revenus vs dépenses"
		role="img"
	>
		<g transform="translate({PADDING.left}, {PADDING.top})">
			<!-- Grille horizontale -->
			{#each yTicks as tick}
				{@const y = CHART_H - (tick / yMax) * CHART_H}
				<line x1="0" y1={y} x2={CHART_W} y2={y} stroke="rgba(255,255,255,0.08)" stroke-width="1" />
				<text x="-8" y={y + 4} text-anchor="end" font-size="13" fill="#a8b8cc">{formatEuro(tick)}</text>
			{/each}

			<!-- Barres -->
			{#each data as d, i}
				<!-- Revenus -->
				<rect
					x={barX(i, true)}
					y={barY(d.income)}
					width={barW}
					height={barH(d.income)}
					fill={COLOR_INCOME}
					rx="3"
				/>
				<!-- Dépenses -->
				<rect
					x={barX(i, false)}
					y={barY(d.expenses)}
					width={barW}
					height={barH(d.expenses)}
					fill={COLOR_EXPENSE}
					rx="3"
				/>
				<!-- Label mois -->
				<text
					x={i * slotW + slotW / 2}
					y={CHART_H + 16}
					text-anchor="middle"
				font-size="14"
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
			<span class="dot" style="background:{COLOR_INCOME}"></span>
			Revenus
		</span>
		<span class="legend-item">
			<span class="dot" style="background:{COLOR_EXPENSE}"></span>
			Dépenses
		</span>
	</div>
</div>

<style>
	.chart-wrapper {
		width: 100%;
	}

	svg {
		display: block;
	}

	.legend {
		display: flex;
		justify-content: center;
		gap: 24px;
		margin-top: 8px;
		font-size: 1.05rem;
		color: var(--text-muted);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		display: inline-block;
	}
</style>
