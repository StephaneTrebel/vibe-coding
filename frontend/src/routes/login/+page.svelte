<script>
	import { auth } from '$lib/stores/auth.js';
	import { api } from '$lib/api.js';

	let email = '';
	let password = '';
	let error = null;
	let loading = false;

	async function handleSubmit() {
		error = null;
		loading = true;

		try {
			const response = await api.login(email, password);
			auth.login(response.user, response.token);
			window.location.href = '/';
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Connexion - Mon Budget</title>
</svelte:head>

<div class="auth-container">
	<div class="auth-card card">
		<h1 class="text-center mb-3">Connexion</h1>

		{#if error}
			<p class="error mb-2">{error}</p>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="form-group">
				<label for="email">Email</label>
				<input type="email" id="email" bind:value={email} required />
			</div>

			<div class="form-group">
				<label for="password">Mot de passe</label>
				<input type="password" id="password" bind:value={password} required />
			</div>

			<button type="submit" class="primary full-width" disabled={loading}>
				{loading ? 'Chargement...' : 'Se connecter'}
			</button>
		</form>

		<p class="text-center mt-2 text-muted">
			Pas encore de compte ? <a href="/register">S'inscrire</a>
		</p>
	</div>
</div>

<style>
	.auth-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.auth-card {
		width: 100%;
		max-width: 400px;
	}

	.full-width {
		width: 100%;
	}

	.error {
		color: var(--danger);
		background: rgba(239, 68, 68, 0.1);
		padding: 12px;
		border-radius: var(--radius);
		text-align: center;
	}
</style>
