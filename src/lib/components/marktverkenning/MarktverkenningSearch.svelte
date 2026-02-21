<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { DeskresearchResult } from '$types';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import MarktverkenningResults from './MarktverkenningResults.svelte';

	export let cpvCodes: string[];
	export let loading: boolean;
	export let error: string;
	export let results: DeskresearchResult[];
	export let summary: string;

	const dispatch = createEventDispatcher<{ search: void }>();
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<p class="text-sm text-gray-500">
			Doorzoek de kennisbank op vergelijkbare aanbestedingen op basis van uw projectprofiel
			(CPV-codes: {(cpvCodes ?? []).join(', ') || 'geen'}).
		</p>
		<button
			on:click={() => dispatch('search')}
			disabled={loading}
			class="inline-flex items-center rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{#if loading}
				<svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
				</svg>
				Zoeken...
			{:else}
				Zoek in kennisbank
			{/if}
		</button>
	</div>

	{#if error}
		<InfoBanner type="error" message={error} />
	{/if}

	{#if loading}
		<LoadingSpinner label="Kennisbank doorzoeken..." />
	{:else if results.length > 0}
		<MarktverkenningResults {results} {summary} />
	{:else if !error}
		<div class="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
			<svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
			</svg>
			<p class="mt-2 text-sm text-gray-500">
				Klik op &quot;Zoek in kennisbank&quot; om vergelijkbare aanbestedingen te vinden.
			</p>
		</div>
	{/if}
</div>
