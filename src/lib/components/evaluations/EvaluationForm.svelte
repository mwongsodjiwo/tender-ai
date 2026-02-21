<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let adding = false;

	let newTendererName = '';

	const dispatch = createEventDispatcher<{ add: string }>();

	function handleSubmit() {
		if (!newTendererName.trim()) return;
		dispatch('add', newTendererName.trim());
		newTendererName = '';
	}
</script>

<form on:submit|preventDefault={handleSubmit} class="flex items-end gap-3">
	<div class="flex-1">
		<label for="new-tenderer" class="block text-sm font-medium text-gray-700">
			Inschrijver toevoegen
		</label>
		<input
			id="new-tenderer"
			type="text"
			bind:value={newTendererName}
			placeholder="Naam van de inschrijver"
			class="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
		/>
	</div>
	<button
		type="submit"
		disabled={adding || !newTendererName.trim()}
		class="inline-flex items-center gap-1.5 rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
	>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
		</svg>
		{adding ? 'Toevoegen...' : 'Toevoegen'}
	</button>
</form>
