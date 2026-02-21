<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Evaluation } from '$types';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';

	export let letterStatus: string;
	export let projectProfile: unknown;
	export let needsEvaluation: boolean;
	export let evaluations: Evaluation[];
	export let hasContent: boolean;
	export let generating: boolean;
	export let generateError: string;

	let instructions = '';
	let selectedEvaluationId = '';
	let showAiPanel = false;

	const dispatch = createEventDispatcher<{
		generate: { instructions: string; selectedEvaluationId: string };
	}>();

	function handleGenerate() {
		dispatch('generate', { instructions, selectedEvaluationId });
	}
</script>

{#if letterStatus === 'draft' && projectProfile}
	<div class="flex shrink-0 items-center justify-between border-b border-gray-200 bg-primary-50 px-6 py-2">
		<div class="flex items-center gap-2">
			<svg class="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
			</svg>
			<span class="text-sm font-medium text-primary-800">AI Brief-generatie</span>
		</div>
		<button
			type="button"
			on:click={() => showAiPanel = !showAiPanel}
			class="text-xs font-medium text-primary-700 hover:text-primary-900"
		>
			{showAiPanel ? 'Verbergen' : 'Tonen'}
		</button>
	</div>

	{#if showAiPanel}
		<div class="shrink-0 border-b border-gray-200 bg-primary-50/50 px-6 py-4">
			<div class="mx-auto flex max-w-3xl flex-wrap items-end gap-4">
				{#if needsEvaluation && evaluations.length > 0}
					<div class="min-w-[200px] flex-1">
						<label for="evaluation-select" class="mb-1 block text-xs font-medium text-primary-800">
							Inschrijver
						</label>
						<select
							id="evaluation-select"
							bind:value={selectedEvaluationId}
							class="block w-full rounded-md border border-primary-200 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-primary-500"
						>
							<option value="">— Selecteer —</option>
							{#each evaluations as evaluation}
								<option value={evaluation.id}>
									{evaluation.tenderer_name} — Score: {evaluation.total_score}
									{evaluation.ranking ? ` (Rang ${evaluation.ranking})` : ''}
								</option>
							{/each}
						</select>
					</div>
				{/if}

				<div class="min-w-[200px] flex-1">
					<label for="ai-instructions" class="mb-1 block text-xs font-medium text-primary-800">
						Instructies (optioneel)
					</label>
					<input
						id="ai-instructions"
						type="text"
						bind:value={instructions}
						class="block w-full rounded-md border border-primary-200 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-primary-500"
						placeholder="Bijv. 'Gebruik een informele toon'"
					/>
				</div>

				<button
					type="button"
					on:click={handleGenerate}
					disabled={generating || (needsEvaluation && evaluations.length > 0 && !selectedEvaluationId)}
					class="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
				>
					{#if generating}
						<LoadingSpinner />
						Genereren...
					{:else}
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
						{hasContent ? 'Hergenereer' : 'Genereer'}
					{/if}
				</button>
			</div>

			{#if generateError}
				<div class="mx-auto mt-3 max-w-3xl">
					<ErrorAlert message={generateError} />
				</div>
			{/if}
		</div>
	{/if}
{:else if letterStatus === 'draft' && !projectProfile}
	<div class="shrink-0 border-b border-gray-200 bg-warning-50 px-6 py-2">
		<InfoBanner
			type="warning"
			title="Projectprofiel ontbreekt"
			message="Vul eerst het projectprofiel in voordat u een brief kunt genereren."
		/>
	</div>
{/if}
