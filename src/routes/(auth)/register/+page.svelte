<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { PageData } from './$types';

	export let data: PageData;

	const RETURNING_USER_KEY = 'tm_returning_user';

	let email = '';
	let password = '';
	let firstName = '';
	let lastName = '';
	let loading = false;
	let errorMessage = '';
	let showPassword = false;

	function togglePasswordVisibility(): void {
		showPassword = !showPassword;
	}

	async function handleRegister(): Promise<void> {
		loading = true;
		errorMessage = '';

		const { error } = await data.supabase.auth.signUp({
			email,
			password,
			options: {
				data: { first_name: firstName, last_name: lastName }
			}
		});

		if (error) {
			errorMessage = error.message;
			loading = false;
			return;
		}

		// Mark user as returning for future logins
		if (browser) {
			localStorage.setItem(RETURNING_USER_KEY, 'true');
		}

		goto('/dashboard');
	}
</script>

<svelte:head>
	<title>Registreren — Tendermanager</title>
</svelte:head>

<!-- Logo + brand -->
<div class="mb-10 flex items-center gap-3">
	<div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600">
		<svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
			<circle cx="8" cy="12" r="2.5" />
			<circle cx="16" cy="12" r="2.5" />
		</svg>
	</div>
	<span class="text-lg font-semibold text-gray-900">Tendermanager</span>
</div>

<!-- Heading -->
<h1 class="text-3xl font-bold tracking-tight text-gray-900">Account aanmaken</h1>

<!-- Form -->
<form on:submit|preventDefault={handleRegister} class="mt-8 space-y-5">
	{#if errorMessage}
		<div class="rounded-lg bg-error-50 p-4" role="alert">
			<p class="text-sm text-error-700">{errorMessage}</p>
		</div>
	{/if}

	<!-- First name -->
	<div>
		<label for="firstName" class="sr-only">Voornaam</label>
		<input
			id="firstName"
			name="firstName"
			type="text"
			required
			minlength="1"
			maxlength="50"
			bind:value={firstName}
			class="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
			placeholder="Voornaam"
		/>
	</div>

	<!-- Last name -->
	<div>
		<label for="lastName" class="sr-only">Achternaam</label>
		<input
			id="lastName"
			name="lastName"
			type="text"
			required
			minlength="1"
			maxlength="50"
			bind:value={lastName}
			class="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
			placeholder="Achternaam"
		/>
	</div>

	<!-- Email -->
	<div>
		<label for="email" class="sr-only">E-mail</label>
		<input
			id="email"
			name="email"
			type="email"
			autocomplete="email"
			required
			bind:value={email}
			class="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
			placeholder="E-mail"
		/>
	</div>

	<!-- Password with toggle -->
	<div class="relative">
		<label for="password" class="sr-only">Wachtwoord</label>
		<input
			id="password"
			name="password"
			type={showPassword ? 'text' : 'password'}
			autocomplete="new-password"
			required
			minlength="8"
			bind:value={password}
			class="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-12 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
			placeholder="Wachtwoord (minimaal 8 tekens)"
		/>
		<button
			type="button"
			on:click={togglePasswordVisibility}
			class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
			aria-label={showPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
		>
			{#if showPassword}
				<!-- Eye-off icon -->
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
				</svg>
			{:else}
				<!-- Eye icon -->
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
				</svg>
			{/if}
		</button>
	</div>

	<!-- Submit button -->
	<button
		type="submit"
		disabled={loading}
		class="flex w-full justify-center rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50"
	>
		{loading ? 'Bezig met registreren...' : 'Registreren'}
	</button>

	<p class="text-center text-sm text-gray-500">
		Al een account?
		<a href="/login" class="font-medium text-gray-900 underline hover:text-gray-700">Inloggen</a>
	</p>
</form>
