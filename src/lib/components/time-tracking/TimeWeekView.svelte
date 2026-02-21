<script lang="ts">
	import { goto } from '$app/navigation';
	import TimeEntryForm from './TimeEntryForm.svelte';
	import {
		formatDateISO,
		formatDateDutch,
		previousWeek,
		nextWeek,
		toISOWeekString
	} from '$lib/utils/week';
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

	interface DayData {
		dateStr: string;
		label: string;
		rows: EntryRow[];
	}

	export let days: DayData[];
	export let projects: { id: string; name: string }[];
	export let weekNumber: number;
	export let weekRange: string;
	export let isCurrentWeek: boolean;
	export let currentWeek: string;
	export let onAddRow: (dayIndex: number) => void;
	export let onUpdateRow: (dayIndex: number, rowIndex: number, field: string, value: unknown) => void;
	export let onRemoveRow: (dayIndex: number, rowIndex: number) => void;

	function dayTotal(rows: EntryRow[]): number {
		return rows.filter((r) => !r.isDeleted).reduce((s, r) => s + r.hours, 0);
	}
</script>

<!-- Week header -->
<div class="flex items-center justify-between px-5 py-4">
	<h2 class="text-lg font-semibold text-gray-900">Week {weekNumber} — {weekRange}</h2>
	<div class="flex items-center gap-2">
		<button
			on:click={() => goto(`/time-tracking?week=${previousWeek(currentWeek)}`)}
			class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
			aria-label="Vorige week"
		>
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
		</button>
		<button
			on:click={() => goto(`/time-tracking?week=${nextWeek(currentWeek)}`)}
			class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
			aria-label="Volgende week"
		>
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
			</svg>
		</button>
		{#if !isCurrentWeek}
			<button
				on:click={() => goto(`/time-tracking?week=${toISOWeekString(new Date())}`)}
				class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
			>
				Vandaag
			</button>
		{/if}
	</div>
</div>

{#if projects.length === 0}
	<div class="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
		<svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1" aria-hidden="true">
			<circle cx="12" cy="12" r="10" />
			<polyline points="12 6 12 12 16 14" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
		<p class="mt-4 text-sm font-medium text-gray-900">Geen projecten beschikbaar</p>
		<p class="mt-1 text-sm text-gray-500">Maak eerst een project aan om uren te registreren.</p>
	</div>
{:else}
	<!-- Weekdays (Mon-Fri) -->
	{#each days.slice(0, 5) as day, dayIndex (day.dateStr)}
		<div class="rounded-xl border border-gray-200 bg-white shadow-sm">
			<div class="flex items-center justify-between border-b border-gray-100 px-5 py-3">
				<button on:click={() => goto(`/time-tracking/${day.dateStr}`)} class="text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors">
					{day.label}
				</button>
				<span class="text-sm font-medium text-gray-500">{dayTotal(day.rows)}u</span>
			</div>
			<div class="divide-y divide-gray-50 px-5">
				{#each day.rows as row, rowIndex (row.id ?? `new-${dayIndex}-${rowIndex}`)}
					{#if !row.isDeleted}
						<TimeEntryForm
							{row}
							{projects}
							dayDateStr={day.dateStr}
							{rowIndex}
							onUpdate={(field, value) => onUpdateRow(dayIndex, rowIndex, field, value)}
							onRemove={() => onRemoveRow(dayIndex, rowIndex)}
						/>
					{/if}
				{/each}
			</div>
			<div class="border-t border-gray-50 px-5 py-3">
				<button on:click={() => onAddRow(dayIndex)} class="flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-primary-600">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>
					Uren toevoegen
				</button>
			</div>
		</div>
	{/each}

	<!-- Weekend (Sat-Sun) -->
	{#each days.slice(5) as day, i (day.dateStr)}
		{@const dayIndex = 5 + i}
		<div class="rounded-xl border border-gray-100 bg-gray-50/50 shadow-sm">
			<div class="flex items-center justify-between px-5 py-3">
				<button on:click={() => goto(`/time-tracking/${day.dateStr}`)} class="text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors">
					{day.label}
				</button>
				<span class="text-sm text-gray-500">{dayTotal(day.rows)}u</span>
			</div>
			{#if day.rows.filter(r => !r.isDeleted).length > 0}
				<div class="divide-y divide-gray-50 border-t border-gray-100 px-5">
					{#each day.rows as row, rowIndex (row.id ?? `new-${dayIndex}-${rowIndex}`)}
						{#if !row.isDeleted}
							<TimeEntryForm
								{row}
								{projects}
								dayDateStr={day.dateStr}
								{rowIndex}
								isWeekend
								onUpdate={(field, value) => onUpdateRow(dayIndex, rowIndex, field, value)}
								onRemove={() => onRemoveRow(dayIndex, rowIndex)}
							/>
						{/if}
					{/each}
				</div>
			{/if}
			<div class="border-t border-gray-100 px-5 py-3">
				<button on:click={() => onAddRow(dayIndex)} class="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>
					Uren toevoegen
				</button>
			</div>
		</div>
	{/each}
{/if}
