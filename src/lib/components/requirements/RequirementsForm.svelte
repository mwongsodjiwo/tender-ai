<script lang="ts">
	import {
		REQUIREMENT_TYPES,
		REQUIREMENT_CATEGORIES,
		REQUIREMENT_TYPE_LABELS,
		REQUIREMENT_CATEGORY_LABELS
	} from '$types';
	import type { RequirementType, RequirementCategory } from '$types';

	export let saving = false;
	export let onCreate: (form: {
		title: string;
		description: string;
		requirement_type: RequirementType;
		category: RequirementCategory;
		priority: number;
	}) => void;
	export let onCancel: () => void;

	let title = '';
	let description = '';
	let requirementType: RequirementType = 'eis';
	let category: RequirementCategory = 'functional';
	let priority = 3;

	function handleCreate() {
		onCreate({ title, description, requirement_type: requirementType, category, priority });
		title = '';
		description = '';
		requirementType = 'eis';
		category = 'functional';
		priority = 3;
	}
</script>

<div class="rounded-card bg-white p-6 shadow-card">
	<h3 class="text-base font-semibold text-gray-900">Nieuwe eis toevoegen</h3>
	<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
		<div class="sm:col-span-2">
			<label for="new-title" class="block text-sm font-medium text-gray-700">Titel</label>
			<input
				id="new-title"
				type="text"
				bind:value={title}
				class="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
				placeholder="Korte omschrijving van de eis"
			/>
		</div>
		<div class="sm:col-span-2">
			<label for="new-desc" class="block text-sm font-medium text-gray-700">Beschrijving</label>
			<textarea
				id="new-desc"
				bind:value={description}
				rows="3"
				class="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
				placeholder="Uitgebreide beschrijving met toetsbare criteria..."
			></textarea>
		</div>
		<div>
			<label for="new-type" class="block text-sm font-medium text-gray-700">Type</label>
			<select
				id="new-type"
				bind:value={requirementType}
				class="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
			>
				{#each REQUIREMENT_TYPES as t}
					<option value={t}>{REQUIREMENT_TYPE_LABELS[t]}</option>
				{/each}
			</select>
		</div>
		<div>
			<label for="new-category" class="block text-sm font-medium text-gray-700">Categorie</label>
			<select
				id="new-category"
				bind:value={category}
				class="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
			>
				{#each REQUIREMENT_CATEGORIES as c}
					<option value={c}>{REQUIREMENT_CATEGORY_LABELS[c]}</option>
				{/each}
			</select>
		</div>
		<div>
			<label for="new-priority" class="block text-sm font-medium text-gray-700">Prioriteit (1-5)</label>
			<input
				id="new-priority"
				type="number"
				bind:value={priority}
				min="1"
				max="5"
				class="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
			/>
		</div>
	</div>
	<div class="mt-4 flex items-center justify-end gap-2">
		<button
			type="button"
			on:click={onCancel}
			class="rounded-card border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
		>
			Annuleren
		</button>
		<button
			type="button"
			on:click={handleCreate}
			disabled={saving || !title.trim()}
			class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
		>
			{saving ? 'Opslaan...' : 'Eis toevoegen'}
		</button>
	</div>
</div>
