<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	export let data: PageData;

	let email = '';
	let password = '';
	let fullName = '';
	let loading = false;
	let errorMessage = '';

	async function handleRegister() {
		loading = true;
		errorMessage = '';

		const { error } = await data.supabase.auth.signUp({
			email,
			password,
			options: {
				data: { full_name: fullName }
			}
		});

		if (error) {
			errorMessage = error.message;
			loading = false;
			return;
		}

		goto('/dashboard');
	}
</script>

<svelte:head>
	<title>Registreren — Tendermanager</title>
</svelte:head>

<form on:submit|preventDefault={handleRegister} class="mt-8 space-y-6">
	{#if errorMessage}
		<div class="rounded-md bg-red-50 p-4" role="alert">
			<p class="text-sm text-red-700">{errorMessage}</p>
		</div>
	{/if}

	<div class="space-y-4">
		<div>
			<label for="fullName" class="block text-sm font-medium text-gray-700">Volledige naam</label>
			<input
				id="fullName"
				name="fullName"
				type="text"
				required
				bind:value={fullName}
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
				placeholder="Jan de Vries"
			/>
		</div>

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
				autocomplete="new-password"
				required
				minlength="8"
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
		{loading ? 'Bezig met registreren...' : 'Registreren'}
	</button>

	<p class="text-center text-sm text-gray-600">
		Al een account?
		<a href="/login" class="font-medium text-primary-600 hover:text-primary-500">Inloggen</a>
	</p>
</form>
