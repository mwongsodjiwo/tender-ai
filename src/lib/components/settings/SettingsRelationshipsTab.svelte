<!-- Settings Relationships tab — manage external organization relations -->
<script lang="ts">
	import type { OrganizationRelationship } from '$types';
	import {
		ORGANIZATION_RELATIONSHIP_TYPES,
		ORGANIZATION_RELATIONSHIP_TYPE_LABELS,
		RELATIONSHIP_STATUS_LABELS
	} from '$types';
	import StatusBadge from '$components/StatusBadge.svelte';
	import EmptyState from '$components/EmptyState.svelte';

	export let relationships: OrganizationRelationship[] = [];
	export let canEdit = false;
	export let onAdd: (data: {
		target_organization_id: string;
		relationship_type: string;
		contract_reference: string;
	}) => void = () => {};
	export let onUpdate: (id: string, data: Record<string, unknown>) => void = () => {};

	let showAddForm = false;
	let targetOrgId = '';
	let relType = 'consultancy';
	let contractRef = '';

	function handleAdd(): void {
		if (!targetOrgId.trim()) return;
		onAdd({
			target_organization_id: targetOrgId.trim(),
			relationship_type: relType,
			contract_reference: contractRef.trim()
		});
		targetOrgId = '';
		relType = 'consultancy';
		contractRef = '';
		showAddForm = false;
	}

	function handleCancel(): void {
		targetOrgId = '';
		relType = 'consultancy';
		contractRef = '';
		showAddForm = false;
	}

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('nl-NL', {
			day: 'numeric', month: 'short', year: 'numeric'
		});
	}
</script>

<div class="space-y-6">
	<div class="flex items-start justify-between">
		<div>
			<h3 class="text-base font-medium text-gray-900">Relaties</h3>
			<p class="mt-1 text-sm text-gray-500">
				Beheer relaties met externe organisaties.
			</p>
		</div>
		{#if canEdit}
			<button type="button" on:click={() => { showAddForm = !showAddForm; }}
				class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
				+ Relatie toevoegen
			</button>
		{/if}
	</div>

	{#if showAddForm}
		<div class="rounded-card border border-gray-200 bg-white p-6 shadow-card space-y-4">
			<h4 class="text-sm font-semibold text-gray-900">Nieuwe relatie</h4>
			<div>
				<label for="target-org" class="block text-sm font-medium text-gray-700">
					Organisatie-ID
				</label>
				<input id="target-org" type="text" bind:value={targetOrgId}
					placeholder="UUID van de doelorganisatie"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
			</div>
			<div>
				<label for="rel-type" class="block text-sm font-medium text-gray-700">Type</label>
				<select id="rel-type" bind:value={relType}
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
					aria-label="Relatietype">
					{#each ORGANIZATION_RELATIONSHIP_TYPES as t (t)}
						<option value={t}>{ORGANIZATION_RELATIONSHIP_TYPE_LABELS[t]}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="contract-ref" class="block text-sm font-medium text-gray-700">
					Verwerkersovereenkomst referentie
				</label>
				<input id="contract-ref" type="text" bind:value={contractRef}
					placeholder="Optioneel: referentienummer VO"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
			</div>
			<div class="flex justify-end gap-2 pt-2">
				<button type="button" on:click={handleCancel}
					class="rounded-card border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
					Annuleren
				</button>
				<button type="button" on:click={handleAdd} disabled={!targetOrgId.trim()}
					class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
					Toevoegen
				</button>
			</div>
		</div>
	{/if}

	{#if relationships.length === 0}
		<EmptyState
			title="Geen relaties"
			description="Er zijn nog geen organisatierelaties geconfigureerd."
			icon="users"
		/>
	{:else}
		<div class="space-y-3">
			{#each relationships as rel (rel.id)}
				<div class="rounded-card border border-gray-200 bg-white px-6 py-4 shadow-card">
					<div class="flex items-center justify-between">
						<div class="min-w-0">
							<div class="flex items-center gap-2">
								<span class="text-sm font-medium text-gray-900">
									{ORGANIZATION_RELATIONSHIP_TYPE_LABELS[rel.relationship_type]}
								</span>
								<StatusBadge status={rel.status} />
							</div>
							<p class="mt-0.5 text-xs text-gray-500 truncate">
								{rel.target_organization_id}
							</p>
							{#if rel.contract_reference}
								<p class="mt-0.5 text-xs text-gray-400">
									VO: {rel.contract_reference}
								</p>
							{/if}
						</div>
						<div class="text-right text-xs text-gray-400">
							<p>{formatDate(rel.valid_from)} — {formatDate(rel.valid_until)}</p>
							{#if canEdit && rel.status === 'pending'}
								<button type="button"
									on:click={() => onUpdate(rel.id, { status: 'active' })}
									class="mt-1 text-primary-600 hover:text-primary-800">
									Activeren
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
