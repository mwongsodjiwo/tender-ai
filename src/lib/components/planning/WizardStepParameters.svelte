<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let targetStartDate: string;
	export let targetEndDate: string;
	export let bufferDays: number;
	export let parallelActivities: boolean;
	export let includeReviews: boolean;
	export let generating: boolean;
	export let generateError: string;

	const dispatch = createEventDispatcher<{ generate: void }>();
</script>

<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
	<h3 class="text-lg font-semibold text-gray-900">Planning genereren</h3>
	<p class="mt-1 text-sm text-gray-500">
		Stel de parameters in voor de AI-planningsgeneratie. De AI houdt rekening met het
		gekozen procedure-type, wettelijke termijnen en vergelijkbare aanbestedingen.
	</p>

	<div class="mt-6 space-y-5">
		<div>
			<label for="planning-start" class="block text-sm font-medium text-gray-700">
				Gewenste startdatum
			</label>
			<input
				id="planning-start"
				type="date"
				bind:value={targetStartDate}
				class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
			/>
		</div>

		<div>
			<label for="planning-end" class="block text-sm font-medium text-gray-700">
				Gewenste einddatum <span class="text-gray-500">(optioneel)</span>
			</label>
			<input
				id="planning-end"
				type="date"
				bind:value={targetEndDate}
				class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
			/>
			<p class="mt-1 text-xs text-gray-500">
				Laat leeg voor een realistisch voorstel door de AI.
			</p>
		</div>

		<div>
			<label for="planning-buffer" class="block text-sm font-medium text-gray-700">
				Buffer per fase (werkdagen)
			</label>
			<select
				id="planning-buffer"
				bind:value={bufferDays}
				class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
			>
				<option value={0}>Geen buffer</option>
				<option value={3}>3 werkdagen</option>
				<option value={5}>5 werkdagen (aanbevolen)</option>
				<option value={10}>10 werkdagen</option>
				<option value={15}>15 werkdagen</option>
			</select>
		</div>

		<div class="space-y-3">
			<label class="flex items-center gap-2">
				<input
					type="checkbox"
					bind:checked={parallelActivities}
					class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
				/>
				<span class="text-sm text-gray-700">Parallelle activiteiten waar mogelijk</span>
			</label>
			<label class="flex items-center gap-2">
				<input
					type="checkbox"
					bind:checked={includeReviews}
					class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
				/>
				<span class="text-sm text-gray-700">Review-momenten opnemen</span>
			</label>
		</div>
	</div>

	{#if generateError}
		<div class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
			{generateError}
		</div>
	{/if}

	<div class="mt-6 flex justify-end">
		<button
			type="button"
			on:click={() => dispatch('generate')}
			disabled={generating}
			class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
		>
			{#if generating}
				<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				Planning genereren...
			{:else}
				Planning genereren
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
				</svg>
			{/if}
		</button>
	</div>
</div>
