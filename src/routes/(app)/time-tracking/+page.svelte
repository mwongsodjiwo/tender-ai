<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { toISOWeekString, getWeekDates, formatDateISO, formatDateDutch, formatWeekRange, getISOWeekNumber } from '$lib/utils/week';
	import type { TimeEntryActivityType } from '$types';
	import TimeWeekView from '$lib/components/time-tracking/TimeWeekView.svelte';

	export let data: PageData;

	let saving = false;
	let saveSuccess = false;
	let error = '';

	$: currentWeek = data.currentWeek;
	$: weekNumber = getISOWeekNumber(new Date(getWeekDates(currentWeek)[0]));
	$: weekRange = formatWeekRange(currentWeek);
	$: weekDates = getWeekDates(currentWeek);
	$: isCurrentWeek = currentWeek === toISOWeekString(new Date());

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

	let lastEntriesRef: unknown[] = [];
	let days: { dateStr: string; label: string; rows: EntryRow[] }[] = [];

	$: if (data.entries !== lastEntriesRef) {
		lastEntriesRef = data.entries;
		days = weekDates.map((date) => {
			const dateStr = formatDateISO(date);
			const existing = (data.entries as Record<string, unknown>[]).filter((e) => e.date === dateStr);
			return {
				dateStr,
				label: formatDateDutch(date),
				rows: existing.map((e) => ({
					id: e.id as string,
					project_id: e.project_id as string,
					activity_type: e.activity_type as TimeEntryActivityType,
					hours: Number(e.hours),
					notes: (e.notes as string) ?? '',
					isNew: false,
					isDirty: false,
					isDeleted: false
				}))
			};
		});
	}

	$: computedWeekTotal = days.reduce((s, d) => s + d.rows.filter((r) => !r.isDeleted).reduce((sum, r) => sum + r.hours, 0), 0);

	function addRow(dayIndex: number): void {
		days = days.map((d, i) =>
			i === dayIndex
				? { ...d, rows: [...d.rows, { id: null, project_id: data.projects[0]?.id ?? '', activity_type: 'preparing' as TimeEntryActivityType, hours: 1, notes: '', isNew: true, isDirty: true, isDeleted: false }] }
				: d
		);
	}

	function updateRow(dayIndex: number, rowIndex: number, field: string, value: unknown): void {
		days = days.map((d, i) =>
			i === dayIndex
				? { ...d, rows: d.rows.map((r, ri) => ri === rowIndex ? { ...r, [field]: value, isDirty: true } : r) }
				: d
		);
	}

	async function removeRow(dayIndex: number, rowIndex: number): Promise<void> {
		const row = days[dayIndex].rows[rowIndex];
		if (row.isNew) {
			days = days.map((d, i) => i === dayIndex ? { ...d, rows: d.rows.filter((_, ri) => ri !== rowIndex) } : d);
			return;
		}
		if (!row.id) return;

		const backup = days;
		days = days.map((d, i) => i === dayIndex ? { ...d, rows: d.rows.filter((_, ri) => ri !== rowIndex) } : d);

		try {
			const response = await fetch(`/api/time-entries/${row.id}`, { method: 'DELETE' });
			if (!response.ok) {
				const body = await response.json().catch(() => ({ message: 'Onbekende fout' }));
				error = `Verwijderen mislukt: ${body.message ?? 'Onbekende fout'}`;
				days = backup;
			} else {
				await invalidateAll();
			}
		} catch {
			error = 'Verwijderen mislukt. Controleer je internetverbinding.';
			days = backup;
		}
	}

	async function saveAll(): Promise<void> {
		saving = true;
		saveSuccess = false;
		error = '';

		try {
			const promises: Promise<Response>[] = [];
			for (const day of days) {
				for (const row of day.rows) {
					if (row.isDeleted) continue;
					if (row.isNew) {
						promises.push(fetch('/api/time-entries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project_id: row.project_id, date: day.dateStr, hours: row.hours, activity_type: row.activity_type, notes: row.notes }) }));
					} else if (row.isDirty && row.id) {
						promises.push(fetch(`/api/time-entries/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project_id: row.project_id, date: day.dateStr, hours: row.hours, activity_type: row.activity_type, notes: row.notes }) }));
					}
				}
			}

			if (promises.length === 0) { error = 'Geen wijzigingen om op te slaan'; return; }

			const results = await Promise.all(promises);
			const failedResults = results.filter((r) => !r.ok);
			if (failedResults.length > 0) {
				const firstError = await failedResults[0].json().catch(() => ({ message: 'Onbekende fout' }));
				error = `${failedResults.length} wijziging(en) mislukt: ${firstError.message ?? 'Onbekende fout'}`;
			} else {
				saveSuccess = true;
				setTimeout(() => { saveSuccess = false; }, 3000);
			}
			await invalidateAll();
		} catch {
			error = 'Er ging iets mis bij het opslaan. Controleer je internetverbinding.';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Urenregistratie — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-semibold text-gray-900">Urenregistratie</h1>
			<p class="mt-1 text-sm text-gray-500">Registreer je gewerkte uren per project.</p>
		</div>
		<a href="/time-tracking/reports" class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M18 20V10M12 20V4M6 20v-6" /></svg>
			Rapportage
		</a>
	</div>

	<div class="flex flex-col gap-6 lg:flex-row">
		<div class="flex-1 space-y-4">
			{#if error}
				<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>
			{/if}
			{#if saveSuccess}
				<div class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" role="status">Uren succesvol opgeslagen!</div>
			{/if}

			<TimeWeekView
				{days}
				projects={data.projects}
				{weekNumber}
				{weekRange}
				{isCurrentWeek}
				{currentWeek}
				onAddRow={addRow}
				onUpdateRow={updateRow}
				onRemoveRow={removeRow}
			/>
		</div>

		<div class="lg:w-72">
			<div class="sticky top-8 space-y-4">
				<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
					<div class="text-center">
						<p class="text-4xl font-semibold text-gray-900">{computedWeekTotal}u</p>
						<p class="mt-1 text-sm text-gray-500">gewerkt deze week</p>
					</div>
					<button on:click={saveAll} disabled={saving} class="mt-6 w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
						{saving ? 'Opslaan...' : 'Opslaan'}
					</button>
					<p class="mt-3 text-center text-xs text-gray-500">Je kunt wijzigingen altijd later aanpassen.</p>
				</div>
				<a href="/time-tracking/reports" class="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
					Exporteer als CSV
				</a>
			</div>
		</div>
	</div>
</div>
