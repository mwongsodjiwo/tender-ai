<!--
  DocumentCreateModal — popup to create a new document by selecting a type.
-->
<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	export let projectId: string;
	export let documentTypes: { id: string; name: string; description: string | null }[] = [];
	export let onClose: (() => void) | null = null;

	let selectedTypeId = '';
	let loading = false;
	let errorMessage = '';

	$: selectedType = documentTypes.find((dt) => dt.id === selectedTypeId) ?? null;

	async function createDocument(): Promise<void> {
		if (!selectedTypeId) return;
		loading = true;
		errorMessage = '';

		const response = await fetch(`/api/projects/${projectId}/documents`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ document_type_id: selectedTypeId })
		});

		if (response.ok) {
			selectedTypeId = '';
			onClose?.();
			await invalidateAll();
		} else {
			const data = await response.json();
			errorMessage = data.message ?? 'Er is een fout opgetreden';
		}
		loading = false;
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
	on:click|self={() => onClose?.()}
>
	<div
		class="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-200"
		role="dialog"
		aria-modal="true"
		aria-label="Document aanmaken"
	>
		<!-- Header -->
		<div class="mb-5 flex items-center justify-between">
			<h2 class="text-lg font-semibold text-gray-900">Document aanmaken</h2>
			<button
				type="button"
				on:click={() => onClose?.()}
				class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
				aria-label="Sluiten"
			>
				<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M18 6L6 18" /><path d="M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Form -->
		<div class="space-y-4">
			<div>
				<label for="doctype-select" class="block text-sm font-medium text-gray-700">
					Type document
				</label>
				<select
					id="doctype-select"
					bind:value={selectedTypeId}
					class="mt-1 block w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
				>
					<option value="">Selecteer een type...</option>
					{#each documentTypes as dt (dt.id)}
						<option value={dt.id}>{dt.name}</option>
					{/each}
				</select>
			</div>

			{#if selectedType?.description}
				<div class="rounded-lg bg-gray-50 p-3">
					<p class="text-sm text-gray-600">{selectedType.description}</p>
				</div>
			{/if}

			{#if errorMessage}
				<p class="text-sm text-error-600" role="alert">{errorMessage}</p>
			{/if}

			<div class="flex items-center justify-end gap-3 pt-2">
				<button
					type="button"
					on:click={() => onClose?.()}
					class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
				>
					Annuleren
				</button>
				<button
					type="button"
					on:click={createDocument}
					disabled={!selectedTypeId || loading}
					class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
				>
					{loading ? 'Bezig...' : 'Aanmaken'}
				</button>
			</div>
		</div>
	</div>
</div>
