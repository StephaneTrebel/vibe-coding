<script>
	// Props
	// data: [{ category: string, amount: number }]
	export let data = []

	const SIZE = 220
	const CX = SIZE / 2
	const CY = SIZE / 2
	const R = 85
	const R_INNER = 48  // donut

	const PALETTE = [
		'#a5b4fc', // --primary
		'#34d399', // --secondary
		'#f59e0b', // --warning
		'#fb9494', // --danger
		'#60a5fa',
		'#c084fc',
		'#f472b6',
		'#4ade80',
	]

	$: total = data.reduce((s, d) => s + d.amount, 0)

	function polarToCartesian(cx, cy, r, angleDeg) {
		const rad = (angleDeg - 90) * (Math.PI / 180)
		return {
			x: cx + r * Math.cos(rad),
			y: cy + r * Math.sin(rad),
		}
	}

	function slicePath(startAngle, endAngle) {
		const large = endAngle - startAngle > 180 ? 1 : 0
		const s = polarToCartesian(CX, CY, R, startAngle)
		const e = polarToCartesian(CX, CY, R, endAngle)
		const si = polarToCartesian(CX, CY, R_INNER, startAngle)
		const ei = polarToCartesian(CX, CY, R_INNER, endAngle)
		return [
			`M ${s.x} ${s.y}`,
			`A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`,
			`L ${ei.x} ${ei.y}`,
			`A ${R_INNER} ${R_INNER} 0 ${large} 0 ${si.x} ${si.y}`,
			'Z',
		].join(' ')
	}

	$: slices = (() => {
		let angle = 0
		return data.map((d, i) => {
			const sweep = (d.amount / total) * 360
			const path = slicePath(angle, angle + sweep)
			const mid = angle + sweep / 2
			const labelPos = polarToCartesian(CX, CY, (R + R_INNER) / 2, mid)
			const result = {
				path,
				color: PALETTE[i % PALETTE.length],
				category: d.category,
				amount: d.amount,
				pct: Math.round((d.amount / total) * 100),
				labelPos,
				showLabel: sweep > 20,
			}
			angle += sweep
			return result
		})
	})()

	function formatEuro(n) {
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
	}
</script>

<div class="chart-wrapper" data-testid="pie-chart">
	<svg
		viewBox="0 0 {SIZE} {SIZE}"
		width="100%"
		aria-label="Graphique dépenses par catégorie"
		role="img"
	>
		{#each slices as slice}
			<path d={slice.path} fill={slice.color} stroke="var(--bg)" stroke-width="2" />
			{#if slice.showLabel}
				<text
					x={slice.labelPos.x}
					y={slice.labelPos.y}
					text-anchor="middle"
					dominant-baseline="middle"
					font-size="9"
					font-weight="600"
					fill="#0f172a"
				>{slice.pct}%</text>
			{/if}
		{/each}
	</svg>

	<!-- Légende -->
	<ul class="legend">
		{#each slices as slice}
			<li class="legend-item">
				<span class="dot" style="background:{slice.color}"></span>
				<span class="label">{slice.category}</span>
				<span class="amount">{formatEuro(slice.amount)}</span>
			</li>
		{/each}
	</ul>
</div>

<style>
	.chart-wrapper {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}

	svg {
		display: block;
		max-width: 220px;
	}

	.legend {
		list-style: none;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 1.05rem;
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.label {
		flex: 1;
		color: var(--text-muted);
	}

	.amount {
		color: var(--text);
		font-weight: 500;
	}
</style>
