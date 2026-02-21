<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let projectId: string;
	export let saving: boolean;
	export let calculating: boolean;

	const dispatch = createEventDispatcher<{ save: void; calculate: void }>();
</script>

<div class="flex flex-wrap items-center gap-3">
	<button
		type="button"
		on:click={() => dispatch('save')}
		disabled={saving}
		class="inline-flex items-center gap-2 rounded-card bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
	>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
		</svg>
		{saving ? 'Opslaan...' : 'Scores opslaan'}
	</button>

	<button
		type="button"
		on:click={() => dispatch('calculate')}
		disabled={calculating}
		class="inline-flex items-center gap-2 rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
	>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
		</svg>
		{calculating ? 'Berekenen...' : 'Ranking berekenen'}
	</button>

	<a
		href="/projects/{projectId}/correspondence"
		class="inline-flex items-center gap-2 rounded-card bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
	>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
		</svg>
		Genereer afwijzingsbrieven
	</a>
</div>
