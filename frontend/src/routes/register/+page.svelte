<script>
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.js';
	import { api } from '$lib/api.js';

	let email = '';
	let password = '';
	let confirmPassword = '';
	let error = null;
	let loading = false;

	async function handleSubmit() {
		error = null;

		if (password !== confirmPassword) {
			error = 'Les mots de passe ne correspondent pas';
			return;
		}

		if (password.length < 6) {
			error = 'Le mot de passe doit contenir au moins 6 caracteres';
			return;
		}

		loading = true;

		try {
			const response = await api.register(email, password);
			auth.login(response.user, response.token);
			goto('/');
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Inscription - Mon Budget</title>
</svelte:head>

<div class="auth-container">
	<div class="auth-card card">
		<h1 class="text-center mb-3">Creer un compte</h1>

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

			<div class="form-group">
				<label for="confirmPassword">Confirmer le mot de passe</label>
				<input type="password" id="confirmPassword" bind:value={confirmPassword} required />
			</div>

			<button type="submit" class="primary full-width" disabled={loading}>
				{loading ? 'Creation en cours...' : 'S\'inscrire'}
			</button>
		</form>

		<p class="text-center mt-2 text-muted">
			Deja un compte ? <a href="/login">Se connecter</a>
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
