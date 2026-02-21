<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	export let description: string;
	export let content: string;
	export let placeholder: string;
	export let status: string;
	export let loading = false;
	export let error = '';
	export let saving = false;
	export let saved = false;
	export let canGenerate = false;
	export let generateLabel = 'Genereer';
	export let loadingLabel = 'Bezig met genereren...';
	export let rows = 20;

	const dispatch = createEventDispatcher<{
		generate: void;
		save: void;
		input: string;
	}>();

	function handleInput(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		dispatch('input', target.value);
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<p class="text-sm text-gray-500">{description}</p>
		<div class="flex items-center gap-2">
			{#if saved}
				<span class="text-sm text-success-600">Opgeslagen</span>
			{/if}
			<StatusBadge {status} />
		</div>
	</div>

	{#if error}
		<InfoBanner type="error" message={error} />
	{/if}

	{#if canGenerate}
		<div class="flex gap-2">
			<button
				on:click={() => dispatch('generate')}
				disabled={loading}
				class="inline-flex items-center rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if loading}
					<svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
					</svg>
					Genereren...
				{:else}
					{generateLabel}
				{/if}
			</button>
			{#if content}
				<button
					on:click={() => dispatch('save')}
					disabled={saving}
					class="inline-flex items-center rounded-card border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
				>
					{saving ? 'Opslaan...' : 'Opslaan'}
				</button>
			{/if}
		</div>
	{/if}

	{#if loading}
		<LoadingSpinner label={loadingLabel} />
	{:else}
		<textarea
			value={content}
			on:input={handleInput}
			{rows}
			class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 font-mono"
			{placeholder}
		></textarea>
	{/if}

	{#if !canGenerate}
		<div class="flex justify-end">
			<button
				on:click={() => dispatch('save')}
				disabled={saving || !content}
				class="inline-flex items-center rounded-card border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
			>
				{saving ? 'Opslaan...' : 'Opslaan'}
			</button>
		</div>
	{/if}
</div>
