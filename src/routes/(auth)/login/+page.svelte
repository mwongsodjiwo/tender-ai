<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	export let data: PageData;

	let email = '';
	let password = '';
	let loading = false;
	let errorMessage = '';

	async function handleLogin() {
		loading = true;
		errorMessage = '';

		const { error } = await data.supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			errorMessage = error.message === 'Invalid login credentials'
				? 'Ongeldige inloggegevens'
				: error.message;
			loading = false;
			return;
		}

		goto('/dashboard');
	}
</script>

<svelte:head>
	<title>Inloggen — Tendermanager</title>
</svelte:head>

<form on:submit|preventDefault={handleLogin} class="mt-8 space-y-6">
	{#if errorMessage}
		<div class="rounded-badge bg-error-50 p-4" role="alert">
			<p class="text-sm text-error-700">{errorMessage}</p>
		</div>
	{/if}

	<div class="space-y-4">
		<div>
			<label for="email" class="block text-sm font-medium text-gray-700">E-mailadres</label>
			<input
				id="email"
				name="email"
				type="email"
				autocomplete="email"
				required
				bind:value={email}
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
				placeholder="naam@organisatie.nl"
			/>
		</div>

		<div>
			<label for="password" class="block text-sm font-medium text-gray-700">Wachtwoord</label>
			<input
				id="password"
				name="password"
				type="password"
				autocomplete="current-password"
				required
				bind:value={password}
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
				placeholder="Minimaal 8 tekens"
			/>
		</div>
	</div>

	<button
		type="submit"
		disabled={loading}
		class="flex w-full justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
	>
		{loading ? 'Bezig met inloggen...' : 'Inloggen'}
	</button>

	<p class="text-center text-sm text-gray-600">
		Nog geen account?
		<a href="/register" class="font-medium text-primary-600 hover:text-primary-500">Registreren</a>
	</p>
</form>
