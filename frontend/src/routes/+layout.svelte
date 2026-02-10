<script>
	import { base } from '$app/paths';
	import '../app.css';

	let menuOpen = false;

	function toggleMenu() {
		menuOpen = !menuOpen;
	}
</script>

<nav class="navbar">
	<div class="nav-brand">Mon Budget</div>

	<!-- Bouton hamburger (mobile uniquement) -->
	<button class="hamburger" class:open={menuOpen} on:click={toggleMenu} aria-label="Menu">
		<span></span>
		<span></span>
		<span></span>
	</button>

	<!-- Menu (responsive) -->
	<div class="nav-links" class:open={menuOpen}>
		<a href="{base}/" on:click={toggleMenu}>Tableau de bord</a>
		<a href="{base}/transactions" on:click={toggleMenu}>Transactions</a>
		<a href="{base}/budget" on:click={toggleMenu}>Budget</a>
		<a href="{base}/goals" on:click={toggleMenu}>Objectifs</a>
	</div>

	<!-- Overlay background (mobile uniquement) -->
	{#if menuOpen}
		<div class="overlay" on:click={toggleMenu} role="button" tabindex="-1"></div>
	{/if}
</nav>

<main>
	<slot />
</main>

<style>
	/* === BASE STYLES (desktop par défaut) === */
	.navbar {
		background: var(--bg-card);
		padding: 16px 24px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--border);
		position: relative;
	}

	.nav-brand {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--primary);
		z-index: 1000;
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

	.nav-links a:hover {
		color: var(--text);
		text-decoration: none;
	}

	/* === HAMBURGER BUTTON (caché sur desktop) === */
	.hamburger {
		display: none;
		flex-direction: column;
		gap: 6px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 8px;
		z-index: 1000;
	}

	.hamburger span {
		display: block;
		width: 25px;
		height: 3px;
		background: var(--text);
		border-radius: 3px;
		transition: all 0.3s ease-in-out;
	}

	/* Animation hamburger → X */
	.hamburger.open span:nth-child(1) {
		transform: rotate(45deg) translate(8px, 8px);
	}

	.hamburger.open span:nth-child(2) {
		opacity: 0;
	}

	.hamburger.open span:nth-child(3) {
		transform: rotate(-45deg) translate(8px, -8px);
	}

	/* === OVERLAY (caché sur desktop) === */
	.overlay {
		display: none;
	}

	/* === MAIN CONTENT === */
	main {
		min-height: calc(100vh - 65px);
	}

	/* === RESPONSIVE : MOBILE (< 768px) === */
	@media (max-width: 767px) {
		/* Afficher le hamburger */
		.hamburger {
			display: flex;
		}

		/* Menu mobile : overlay full-screen */
		.nav-links {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			background: var(--bg-card);
			flex-direction: column;
			gap: 0;
			padding: 80px 24px 24px;
			transform: translateY(-100%);
			transition: transform 0.3s ease-in-out;
			z-index: 999;
			box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
		}

		.nav-links.open {
			transform: translateY(0);
		}

		.nav-links a {
			padding: 16px;
			width: 100%;
			text-align: left;
			border-bottom: 1px solid var(--border);
			font-size: 1.1rem;
		}

		.nav-links a:last-child {
			border-bottom: none;
		}

		/* Overlay semi-transparent */
		.overlay {
			display: block;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.5);
			z-index: 998;
			cursor: pointer;
		}
	}
</style>
