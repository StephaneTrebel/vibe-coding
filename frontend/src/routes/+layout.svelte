<script>
	import { base } from '$app/paths'
	import { page } from '$app/stores'
	import '../app.css'

	const navItems = [
		{ href: `${base}/`, label: 'Accueil', icon: '🏠' },
		{ href: `${base}/transactions`, label: 'Transactions', icon: '💸' },
		{ href: `${base}/budget`, label: 'Budget', icon: '💰' },
		{ href: `${base}/goals`, label: 'Objectifs', icon: '🎯' },
	]

	function isActive(href) {
		const path = $page.url.pathname
		if (href === `${base}/`) return path === `${base}/` || path === `${base}`
		return path.startsWith(href)
	}
</script>

<nav class="navbar">
	<div class="nav-brand">Mon Budget</div>
	<div class="nav-links">
		{#each navItems as item}
			<a href={item.href} class:active={isActive(item.href)}>{item.label}</a>
		{/each}
	</div>
</nav>

<main>
	<slot />
</main>

<nav class="bottom-nav" data-testid="bottom-nav">
	{#each navItems as item}
		<a href={item.href} class:active={isActive(item.href)} aria-label={item.label}>
			<span class="icon">{item.icon}</span>
			<span class="label">{item.label}</span>
		</a>
	{/each}
</nav>

<style>
	/* === NAVBAR (desktop) === */
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
		transition: color 0.2s;
	}

	.nav-links a:hover,
	.nav-links a.active {
		color: var(--text);
		text-decoration: none;
	}

	/* === MAIN CONTENT === */
	main {
		min-height: calc(100vh - 65px);
	}

	/* === BOTTOM NAV (mobile uniquement) === */
	.bottom-nav {
		display: none;
	}

	/* === MOBILE (< 768px) === */
	@media (max-width: 767px) {
		.nav-links {
			display: none;
		}

		.bottom-nav {
			display: flex;
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			height: var(--bottom-nav-height);
			padding-bottom: env(safe-area-inset-bottom);
			background: var(--bg-card);
			border-top: 1px solid var(--border);
			z-index: 100;
		}

		.bottom-nav a {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 2px;
			color: var(--text-muted);
			text-decoration: none;
			transition: color 0.2s, transform 0.2s;
		}

		.bottom-nav a:hover {
			text-decoration: none;
		}

		.bottom-nav a.active {
			color: var(--primary);
		}

		.bottom-nav a.active .icon {
			display: inline-block;
			transform: scale(1.2);
		}

		.bottom-nav .icon {
			font-size: 1.5rem;
			transition: transform 0.2s;
		}

		.bottom-nav .label {
			font-size: 0.65rem;
			font-weight: 500;
		}
	}
</style>
