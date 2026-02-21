<script lang="ts">
	import TimeProjectSelector from './TimeProjectSelector.svelte';
	import {
		TIME_ENTRY_ACTIVITY_TYPES,
		TIME_ENTRY_ACTIVITY_TYPE_LABELS
	} from '$types';
	import type { TimeEntryActivityType } from '$types';

	interface EntryRow {
		id: string | null;
		project_id: string;
		activity_type: TimeEntryActivityType;
		hours: number;
		notes: string;
		isNew: boolean;
		isDirty: boolean;
		isDeleted: boolean;
	}

	export let row: EntryRow;
	export let projects: { id: string; name: string }[];
	export let dayDateStr: string;
	export let rowIndex: number;
	export let isWeekend = false;
	export let onUpdate: (field: string, value: unknown) => void;
	export let onRemove: () => void;

	$: borderClass = isWeekend ? 'border-gray-200' : 'border-gray-300';
	$: inputClass = `w-full rounded-lg border ${borderClass} bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500`;
</script>

<div class="flex flex-wrap items-center gap-3 py-3">
	<TimeProjectSelector
		value={row.project_id}
		{projects}
		id="project-{dayDateStr}-{rowIndex}"
		{isWeekend}
		onChange={(val) => onUpdate('project_id', val)}
	/>

	<div class="min-w-[150px]">
		<label for="activity-{dayDateStr}-{rowIndex}" class="sr-only">Activiteit</label>
		<select
			id="activity-{dayDateStr}-{rowIndex}"
			value={row.activity_type}
			on:change={(e) => onUpdate('activity_type', e.currentTarget.value)}
			class={inputClass}
		>
			{#each TIME_ENTRY_ACTIVITY_TYPES as actType (actType)}
				<option value={actType}>{TIME_ENTRY_ACTIVITY_TYPE_LABELS[actType]}</option>
			{/each}
		</select>
	</div>

	<div class="w-20">
		<label for="hours-{dayDateStr}-{rowIndex}" class="sr-only">Uren</label>
		<input
			id="hours-{dayDateStr}-{rowIndex}"
			type="number"
			min="0.25"
			max="24"
			step="0.25"
			value={row.hours}
			on:input={(e) => onUpdate('hours', Number(e.currentTarget.value) || 0)}
			class="w-full rounded-lg border {borderClass} bg-white px-3 py-2 text-center text-sm text-gray-900 transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
		/>
	</div>

	<div class="min-w-[120px] flex-1">
		<label for="notes-{dayDateStr}-{rowIndex}" class="sr-only">Notitie</label>
		<input
			id="notes-{dayDateStr}-{rowIndex}"
			type="text"
			placeholder="Notitie"
			value={row.notes}
			on:input={(e) => onUpdate('notes', e.currentTarget.value)}
			class="w-full rounded-lg border {borderClass} bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
		/>
	</div>

	<button
		on:click={onRemove}
		class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
		aria-label="Verwijder urenregistratie"
	>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
		</svg>
	</button>
</div>
