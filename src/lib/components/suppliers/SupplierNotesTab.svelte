<!-- Supplier drawer — Notities tab: private + shared notes -->
<script lang="ts">
	export let notes: string | null = null;
	export let onSave: (notes: string) => void = () => {};

	let editValue = notes ?? '';
	let saving = false;

	$: hasChanges = editValue !== (notes ?? '');

	async function handleSave(): Promise<void> {
		saving = true;
		onSave(editValue);
		saving = false;
	}
</script>

<div class="space-y-4">
	<h4 class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
		Notities
	</h4>

	<div class="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
		<label for="supplier-notes" class="block text-xs font-medium text-gray-600">
			Gedeelde notities (organisatieniveau)
		</label>
		<textarea
			id="supplier-notes"
			bind:value={editValue}
			rows="6"
			class="mt-2 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
			placeholder="Voeg notities toe over deze leverancier..."
		></textarea>
	</div>

	{#if hasChanges}
		<div class="flex justify-end">
			<button
				type="button"
				on:click={handleSave}
				disabled={saving}
				class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
			>
				{#if saving}Opslaan...{:else}Notities opslaan{/if}
			</button>
		</div>
	{/if}
</div>
