<!-- NewLetterDialog — Dialog for choosing and creating a new letter type -->
<script lang="ts">
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import { PROJECT_PHASE_LABELS } from '$types';
	import { LETTER_TYPE_PHASES } from './correspondence-helpers';

	export let projectId: string;
	export let displayLetterTypes: { value: string; label: string }[];
	export let onClose: () => void;

	let selectedLetterType = '';
	let creating = false;
	let createError = '';

	async function createNewLetter() {
		if (!selectedLetterType) return;
		creating = true;
		createError = '';

		try {
			const phases = LETTER_TYPE_PHASES[selectedLetterType] ?? ['tendering'];
			const phase = phases[0];
			const response = await fetch(`/api/projects/${projectId}/correspondence`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					phase,
					letter_type: selectedLetterType,
					subject: '',
					body: '',
					recipient: ''
				})
			});

			if (!response.ok) {
				const result = await response.json();
				createError = result.message ?? 'Er is een fout opgetreden.';
				creating = false;
				return;
			}

			const result = await response.json();
			onClose();
			creating = false;
			window.location.href = `/projects/${projectId}/correspondence/${result.data.id}`;
			return;
		} catch {
			createError = 'Netwerkfout bij het aanmaken van de brief.';
		}
		creating = false;
	}
</script>

<div class="rounded-card bg-white p-6 shadow-card" role="region" aria-label="Nieuw brieftype kiezen">
	<h3 class="text-base font-semibold text-gray-900">Kies een brieftype</h3>
	<p class="mt-1 text-sm text-gray-500">Selecteer het type brief dat u wilt aanmaken.</p>
	{#if createError}
		<div class="mt-3"><ErrorAlert message={createError} /></div>
	{/if}
	<div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
		{#each displayLetterTypes as letterType}
			<button
				type="button"
				on:click={() => { selectedLetterType = letterType.value; }}
				class="rounded-card border px-4 py-3 text-left text-sm transition-colors
					{selectedLetterType === letterType.value
						? 'border-primary-500 bg-primary-50 text-primary-700'
						: 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'}"
			>
				<span class="font-medium">{letterType.label}</span>
				{#if LETTER_TYPE_PHASES[letterType.value]}
					<span class="ml-2 text-xs text-gray-500">
						{LETTER_TYPE_PHASES[letterType.value].map((p) => PROJECT_PHASE_LABELS[p]).join(', ')}
					</span>
				{/if}
			</button>
		{/each}
	</div>
	<div class="mt-4 flex items-center justify-end gap-2">
		<button type="button" on:click={onClose}
			class="rounded-card border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
			Annuleren
		</button>
		<button type="button" on:click={createNewLetter} disabled={!selectedLetterType || creating}
			class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
			{#if creating}<LoadingSpinner />{:else}Brief aanmaken{/if}
		</button>
	</div>
</div>
