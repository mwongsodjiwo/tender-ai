<!-- Modal for creating a new template from the editor -->
<script lang="ts">
	import type { DocumentType } from '$types';

	export let documentTypes: Pick<DocumentType, 'id' | 'name' | 'slug'>[] = [];
	export let loading = false;
	export let onConfirm: (data: { name: string; document_type_id: string; description?: string }) => Promise<void>;
	export let onCancel: () => void;

	let name = '';
	let documentTypeId = '';
	let description = '';

	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape') onCancel();
	}

	async function handleSubmit(): Promise<void> {
		if (!name || !documentTypeId || loading) return;
		await onConfirm({
			name,
			document_type_id: documentTypeId,
			description: description || undefined
		});
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true"
	aria-label="Nieuw sjabloon schrijven">
	<!-- Backdrop -->
	<button type="button" class="absolute inset-0 bg-black/40" on:click={onCancel} aria-label="Sluiten" />

	<!-- Dialog -->
	<div class="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
		<h3 class="text-lg font-semibold text-gray-900">Nieuw sjabloon schrijven</h3>

		<form on:submit|preventDefault={handleSubmit} class="mt-4 space-y-4">
			<div>
				<label for="editor-tpl-name" class="block text-sm font-medium text-gray-700">Naam</label>
				<input id="editor-tpl-name" type="text" bind:value={name} required
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
					placeholder="Bijv. Aanbestedingsleidraad" />
			</div>

			<div>
				<label for="editor-tpl-doctype" class="block text-sm font-medium text-gray-700">Documenttype</label>
				<select id="editor-tpl-doctype" bind:value={documentTypeId} required
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
					<option value="">Selecteer documenttype</option>
					{#each documentTypes as dt (dt.id)}
						<option value={dt.id}>{dt.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="editor-tpl-desc" class="block text-sm font-medium text-gray-700">
					Beschrijving (optioneel)
				</label>
				<input id="editor-tpl-desc" type="text" bind:value={description}
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
			</div>

			<div class="mt-5 flex justify-end gap-3">
				<button type="button" on:click={onCancel} disabled={loading}
					class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
					Annuleren
				</button>
				<button type="submit" disabled={!name || !documentTypeId || loading}
					class="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50">
					{loading ? 'Aanmaken...' : 'Aanmaken en bewerken'}
				</button>
			</div>
		</form>
	</div>
</div>
