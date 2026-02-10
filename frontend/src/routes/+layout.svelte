<script>
	import { base } from '$app/paths';
	import '../app.css';
</script>

<nav class="navbar">
	<div class="nav-brand">Mon Budget</div>
	<div class="nav-links">
		<a href="{base}/">Tableau de bord</a>
		<a href="{base}/transactions">Transactions</a>
		<a href="{base}/budget">Budget</a>
		<a href="{base}/goals">Objectifs</a>
	</div>
</nav>

<main>
	<slot />
</main>

<style>
	.navbar {
		background: var(--bg-card);
		padding: 16px 24px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--border);
	}

	.nav-brand {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--primary);
	}

	.nav-links {
		display: flex;
		gap: 24px;
		align-items: center;
	}

	.nav-links a {
		color: var(--text-muted);
		font-weight: 500;
	}

	.nav-links a:hover {
		color: var(--text);
		text-decoration: none;
	}

	main {
		min-height: calc(100vh - 65px);
	}
</style>
