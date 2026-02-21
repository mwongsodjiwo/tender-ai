<script lang="ts">
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { EmviCriterion } from '$types/database';
	import type { CriterionType } from '$types/enums';

	export let criteria: EmviCriterion[];
	export let editingId: string | null;
	export let editName: string;
	export let editDescription: string;
	export let editType: CriterionType;
	export let editWeight: number;
	export let onStartEdit: (criterion: EmviCriterion) => void;
	export let onCancelEdit: () => void;
	export let onSaveEdit: (id: string) => void;
	export let onDelete: (id: string) => void;
</script>

{#each criteria as criterion (criterion.id)}
	{#if editingId === criterion.id}
		<form
			on:submit|preventDefault={() => onSaveEdit(criterion.id)}
			class="rounded-card border border-primary-200 bg-white p-4 shadow-card space-y-3"
		>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div>
					<label for="edit-name-{criterion.id}" class="block text-xs font-medium text-gray-700">Naam</label>
					<input
						id="edit-name-{criterion.id}"
						type="text"
						bind:value={editName}
						class="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
						required
					/>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="edit-type-{criterion.id}" class="block text-xs font-medium text-gray-700">Type</label>
						<select
							id="edit-type-{criterion.id}"
							bind:value={editType}
							class="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
						>
							<option value="price">Prijs</option>
							<option value="quality">Kwaliteit</option>
						</select>
					</div>
					<div>
						<label for="edit-weight-{criterion.id}" class="block text-xs font-medium text-gray-700">Weging %</label>
						<input
							id="edit-weight-{criterion.id}"
							type="number"
							bind:value={editWeight}
							min="0"
							max="100"
							step="0.01"
							class="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
						/>
					</div>
				</div>
			</div>
			<div>
				<label for="edit-description-{criterion.id}" class="block text-xs font-medium text-gray-700">Beschrijving</label>
				<textarea
					id="edit-description-{criterion.id}"
					bind:value={editDescription}
					rows="2"
					class="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
				></textarea>
			</div>
			<div class="flex gap-2">
				<button type="submit" class="rounded-card bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700">
					Opslaan
				</button>
				<button type="button" on:click={onCancelEdit} class="rounded-card border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
					Annuleren
				</button>
			</div>
		</form>
	{:else}
		<div class="rounded-card border border-gray-200 bg-white p-4 shadow-card transition-all hover:shadow-card-hover">
			<div class="flex items-start justify-between">
				<div class="flex items-start gap-3 min-w-0">
					<div class="shrink-0 mt-0.5">
						<StatusBadge status={criterion.criterion_type} />
					</div>
					<div class="min-w-0">
						<h3 class="text-sm font-semibold text-gray-900">{criterion.name}</h3>
						{#if criterion.description}
							<p class="mt-1 text-xs text-gray-500 line-clamp-2">{criterion.description}</p>
						{/if}
					</div>
				</div>
				<div class="flex items-center gap-3 shrink-0 ml-4">
					<span class="text-lg font-semibold {criterion.criterion_type === 'price' ? 'text-primary-600' : 'text-success-600'}">
						{Number(criterion.weight_percentage)}%
					</span>
					<div class="flex gap-1">
						<button type="button" on:click={() => onStartEdit(criterion)} class="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-600" aria-label="Bewerk {criterion.name}">
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
							</svg>
						</button>
						<button type="button" on:click={() => onDelete(criterion.id)} class="rounded-md p-1.5 text-gray-500 hover:bg-error-50 hover:text-error-600" aria-label="Verwijder {criterion.name}">
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
{/each}
