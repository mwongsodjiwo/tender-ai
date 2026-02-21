<!-- Error boundary for authenticated app pages -->
<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>Fout — Tendermanager</title>
</svelte:head>

<div class="flex min-h-[50vh] items-center justify-center">
	<div class="text-center">
		<p class="text-6xl font-semibold text-gray-300">{$page.status}</p>
		<h1 class="mt-4 text-xl font-semibold text-gray-900">
			{#if $page.status === 404}
				Pagina niet gevonden
			{:else if $page.status === 403}
				Geen toegang
			{:else if $page.status === 500}
				Serverfout
			{:else}
				Er is een fout opgetreden
			{/if}
		</h1>
		<p class="mt-2 text-sm text-gray-500">
			{$page.error?.message ?? 'Er ging iets mis. Probeer het opnieuw.'}
		</p>
		<div class="mt-6 flex justify-center gap-3">
			<a
				href="/dashboard"
				class="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
			>
				Naar dashboard
			</a>
			<button
				on:click={() => window.location.reload()}
				class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
			>
				Opnieuw laden
			</button>
		</div>
	</div>
</div>
