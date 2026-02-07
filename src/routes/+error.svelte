<!-- Root error boundary -->
<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>Fout — Tendermanager</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
	<div class="text-center">
		<p class="text-6xl font-bold text-gray-300">{$page.status}</p>
		<h1 class="mt-4 text-xl font-semibold text-gray-900">
			{#if $page.status === 404}
				Pagina niet gevonden
			{:else if $page.status === 403}
				Geen toegang
			{:else}
				Er is een fout opgetreden
			{/if}
		</h1>
		<p class="mt-2 text-sm text-gray-500">
			{$page.error?.message ?? 'Er ging iets mis. Probeer het opnieuw.'}
		</p>
		<a
			href="/"
			class="mt-6 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
		>
			Naar startpagina
		</a>
	</div>
</div>
