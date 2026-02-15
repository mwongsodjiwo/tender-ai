<script lang="ts">
	import {
		CONTRACT_TYPE_LABELS,
		GENERAL_CONDITIONS_LABELS,
		GENERAL_CONDITIONS_DESCRIPTIONS
	} from '$types';
	import type { ContractType, GeneralConditionsType } from '$types';

	export let projectId: string;
	export let contractType: ContractType | null = null;
	export let generalConditions: GeneralConditionsType | null = null;

	let saving = false;

	async function saveSettings() {
		saving = true;
		await fetch(`/api/projects/${projectId}/contract/settings`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ contract_type: contractType, general_conditions: generalConditions })
		});
		saving = false;
	}
</script>

<div class="shrink-0 border-b border-gray-200 p-4">
	<h3 class="text-xs font-semibold uppercase tracking-wide text-gray-500">Instellingen</h3>

	<label for="contract-type" class="mt-3 block text-xs font-medium text-gray-700">Type opdracht</label>
	<select
		id="contract-type"
		bind:value={contractType}
		on:change={saveSettings}
		disabled={saving}
		class="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50"
	>
		<option value={null}>Selecteer...</option>
		{#each Object.entries(CONTRACT_TYPE_LABELS) as [value, label]}
			<option {value}>{label}</option>
		{/each}
	</select>

	<label for="general-conditions" class="mt-3 block text-xs font-medium text-gray-700">Algemene voorwaarden</label>
	<select
		id="general-conditions"
		bind:value={generalConditions}
		on:change={saveSettings}
		disabled={saving}
		class="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50"
	>
		<option value={null}>Selecteer...</option>
		{#each Object.entries(GENERAL_CONDITIONS_LABELS) as [value, label]}
			<option {value}>{label}</option>
		{/each}
	</select>
	{#if generalConditions && generalConditions !== 'custom'}
		<p class="mt-1 text-[10px] text-gray-400">
			{GENERAL_CONDITIONS_DESCRIPTIONS[generalConditions] ?? ''}
		</p>
	{/if}
</div>
