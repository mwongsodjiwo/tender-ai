<script lang="ts">
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';

	export let requirementsCount: number;
	export let generating: boolean;
	export let generateError: string;
	export let onGenerate: () => void;
	export let onShowNewForm: () => void;
</script>

{#if requirementsCount === 0}
	<div class="rounded-card bg-white p-8 text-center shadow-card">
		<div class="mx-auto max-w-md">
			<svg class="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
			</svg>
			<h3 class="mt-4 text-lg font-semibold text-gray-900">Nog geen eisen</h3>
			<p class="mt-2 text-sm text-gray-500">
				Laat de AI concept-eisen genereren op basis van de briefing, of voeg handmatig eisen toe.
			</p>
			{#if generateError}
				<div class="mt-4">
					<ErrorAlert message={generateError} />
				</div>
			{/if}
			<div class="mt-6 flex items-center justify-center gap-3">
				<button
					type="button"
					on:click={onGenerate}
					disabled={generating}
					class="inline-flex items-center gap-2 rounded-card bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
				>
					{#if generating}
						<LoadingSpinner />
						Eisen genereren...
					{:else}
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
						AI eisen genereren
					{/if}
				</button>
				<button
					type="button"
					on:click={onShowNewForm}
					class="rounded-card border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					Handmatig toevoegen
				</button>
			</div>
		</div>
	</div>
{:else}
	<div class="flex items-center justify-center py-4">
		<button
			type="button"
			on:click={onGenerate}
			disabled={generating}
			class="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
		>
			{#if generating}
				<LoadingSpinner />
				Aanvullende eisen genereren...
			{:else}
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
				AI aanvullende eisen genereren
			{/if}
		</button>
	</div>
{/if}
