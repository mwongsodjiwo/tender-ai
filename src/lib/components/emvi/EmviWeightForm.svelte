<script lang="ts">
	import type { CriterionType } from '$types/enums';

	export let saving = false;
	export let onCreate: (form: {
		name: string;
		description: string;
		criterion_type: CriterionType;
		weight_percentage: number;
	}) => void;
	export let onCancel: () => void;

	let name = '';
	let description = '';
	let criterionType: CriterionType = 'quality';
	let weight = 0;

	function handleCreate() {
		if (!name.trim()) return;
		onCreate({ name: name.trim(), description: description.trim(), criterion_type: criterionType, weight_percentage: weight });
		name = '';
		description = '';
		criterionType = 'quality';
		weight = 0;
	}
</script>

<form
	on:submit|preventDefault={handleCreate}
	class="rounded-card border border-primary-200 bg-primary-50 p-4 space-y-3"
>
	<h3 class="text-sm font-semibold text-gray-900">Nieuw criterium</h3>
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<div>
			<label for="new-name" class="block text-xs font-medium text-gray-700">Naam</label>
			<input
				id="new-name"
				type="text"
				bind:value={name}
				placeholder="Bijv. Prijs, Plan van Aanpak"
				class="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
				required
			/>
		</div>
		<div class="grid grid-cols-2 gap-3">
			<div>
				<label for="new-type" class="block text-xs font-medium text-gray-700">Type</label>
				<select
					id="new-type"
					bind:value={criterionType}
					class="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
				>
					<option value="price">Prijs</option>
					<option value="quality">Kwaliteit</option>
				</select>
			</div>
			<div>
				<label for="new-weight" class="block text-xs font-medium text-gray-700">Weging %</label>
				<input
					id="new-weight"
					type="number"
					bind:value={weight}
					min="0"
					max="100"
					step="0.01"
					class="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
				/>
			</div>
		</div>
	</div>
	<div>
		<label for="new-description" class="block text-xs font-medium text-gray-700">Beschrijving</label>
		<textarea
			id="new-description"
			bind:value={description}
			rows="2"
			placeholder="Toelichting op het criterium..."
			class="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
		></textarea>
	</div>
	<div class="flex gap-2">
		<button
			type="submit"
			disabled={saving || !name.trim()}
			class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
		>
			{saving ? 'Opslaan...' : 'Toevoegen'}
		</button>
		<button
			type="button"
			on:click={onCancel}
			class="rounded-card border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
		>
			Annuleren
		</button>
	</div>
</form>
