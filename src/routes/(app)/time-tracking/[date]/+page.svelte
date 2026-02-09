<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { formatDateDutch, toISOWeekString } from '$lib/utils/week';
	import {
		TIME_ENTRY_ACTIVITY_TYPES,
		TIME_ENTRY_ACTIVITY_TYPE_LABELS
	} from '$types';
	import type { TimeEntryActivityType } from '$types';

	export let data: PageData;

	let saving = false;
	let saveSuccess = false;
	let error = '';

	$: dateObj = new Date(data.date + 'T00:00:00');
	$: dateLabel = formatDateDutch(dateObj);
	$: weekStr = toISOWeekString(dateObj);

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

	// Only rebuild rows when server data reference changes (after save / navigation)
	let lastEntriesRef: unknown[] = [];
	let rows: EntryRow[] = [];

	$: if (data.entries !== lastEntriesRef) {
		lastEntriesRef = data.entries;
		rows = data.entries.map((e: Record<string, unknown>) => ({
			id: e.id as string,
			project_id: e.project_id as string,
			activity_type: e.activity_type as TimeEntryActivityType,
			hours: Number(e.hours),
			notes: (e.notes as string) ?? '',
			isNew: false,
			isDirty: false,
			isDeleted: false
		}));
	}

	$: dayTotal = rows.filter(r => !r.isDeleted).reduce((sum, r) => sum + r.hours, 0);

	function addRow(): void {
		rows = [
			...rows,
			{
				id: null,
				project_id: data.projects[0]?.id ?? '',
				activity_type: 'specifying',
				hours: 1,
				notes: '',
				isNew: true,
				isDirty: true,
				isDeleted: false
			}
		];
	}

	async function removeRow(index: number): Promise<void> {
		const row = rows[index];

		if (row.isNew) {
			rows = rows.filter((_, i) => i !== index);
			return;
		}

		if (!row.id) return;

		// Optimistic: hide row immediately
		rows[index] = { ...row, isDeleted: true };
		rows = [...rows];

		try {
			const response = await fetch(`/api/time-entries/${row.id}`, { method: 'DELETE' });

			if (!response.ok) {
				const body = await response.json().catch(() => ({ message: 'Onbekende fout' }));
				error = `Verwijderen mislukt: ${body.message ?? 'Onbekende fout'}`;
				rows[index] = { ...row, isDeleted: false };
				rows = [...rows];
				return;
			}

			// Remove from array entirely
			rows = rows.filter((_, i) => i !== index);
		} catch {
			error = 'Verwijderen mislukt. Controleer je internetverbinding.';
			rows[index] = { ...row, isDeleted: false };
			rows = [...rows];
		}
	}

	function markDirty(index: number): void {
		rows[index] = { ...rows[index], isDirty: true };
		rows = [...rows];
	}

	async function saveAll(): Promise<void> {
		saving = true;
		saveSuccess = false;
		error = '';

		try {
			const promises: Promise<Response>[] = [];

			for (const row of rows) {
				if (row.isDeleted) continue;

				if (row.isNew) {
					promises.push(
						fetch('/api/time-entries', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								project_id: row.project_id,
								date: data.date,
								hours: row.hours,
								activity_type: row.activity_type,
								notes: row.notes
							})
						})
					);
				} else if (row.isDirty && row.id) {
					promises.push(
						fetch(`/api/time-entries/${row.id}`, {
							method: 'PUT',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								project_id: row.project_id,
								date: data.date,
								hours: row.hours,
								activity_type: row.activity_type,
								notes: row.notes
							})
						})
					);
				}
			}

			if (promises.length === 0) {
				error = 'Geen wijzigingen om op te slaan';
				return;
			}

			const results = await Promise.all(promises);
			const failedResults = results.filter(r => !r.ok);

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
	<title>{dateLabel} — Urenregistratie — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<!-- Breadcrumb -->
	<nav class="flex items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
		<a href="/time-tracking?week={weekStr}" class="hover:text-gray-700 transition-colors">
			Urenregistratie
		</a>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
		</svg>
		<span class="font-medium text-gray-900">{dateLabel}</span>
	</nav>

	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">{dateLabel}</h1>
			<p class="mt-1 text-sm text-gray-500">
				{dayTotal}u geregistreerd
			</p>
		</div>
		<button
			on:click={saveAll}
			disabled={saving}
			class="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{saving ? 'Opslaan...' : 'Opslaan'}
		</button>
	</div>

	<!-- Error -->
	{#if error}
		<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
			{error}
		</div>
	{/if}

	<!-- Success -->
	{#if saveSuccess}
		<div class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" role="status">
			Uren succesvol opgeslagen!
		</div>
	{/if}

	<!-- Entries -->
	{#if data.projects.length === 0}
		<div class="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
			<p class="text-sm font-medium text-gray-900">Geen projecten beschikbaar</p>
			<p class="mt-1 text-sm text-gray-500">Maak eerst een project aan om uren te registreren.</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each rows as row, index (row.id ?? `new-${index}`)}
				{#if !row.isDeleted}
					<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
							<!-- Project -->
							<div>
								<label for="day-project-{index}" class="mb-1.5 block text-xs font-medium text-gray-500">Project</label>
								<select
									id="day-project-{index}"
									bind:value={row.project_id}
									on:change={() => markDirty(index)}
									class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
								>
									{#each data.projects as project (project.id)}
										<option value={project.id}>{project.name}</option>
									{/each}
								</select>
							</div>

							<!-- Activity -->
							<div>
								<label for="day-activity-{index}" class="mb-1.5 block text-xs font-medium text-gray-500">Activiteit</label>
								<select
									id="day-activity-{index}"
									bind:value={row.activity_type}
									on:change={() => markDirty(index)}
									class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
								>
									{#each TIME_ENTRY_ACTIVITY_TYPES as actType (actType)}
										<option value={actType}>{TIME_ENTRY_ACTIVITY_TYPE_LABELS[actType]}</option>
									{/each}
								</select>
							</div>

							<!-- Hours -->
							<div>
								<label for="day-hours-{index}" class="mb-1.5 block text-xs font-medium text-gray-500">Uren</label>
								<input
									id="day-hours-{index}"
									type="number"
									min="0.25"
									max="24"
									step="0.25"
									bind:value={row.hours}
									on:input={() => markDirty(index)}
									class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
								/>
							</div>

							<!-- Delete -->
							<div class="flex items-end">
								<button
									on:click={() => removeRow(index)}
									class="rounded-lg p-2.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
									aria-label="Verwijder urenregistratie"
								>
									<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
								</button>
							</div>
						</div>

						<!-- Notes (full width below) -->
						<div class="mt-3">
							<label for="day-notes-{index}" class="mb-1.5 block text-xs font-medium text-gray-500">Notitie</label>
							<textarea
								id="day-notes-{index}"
								placeholder="Optionele notitie over de werkzaamheden..."
								bind:value={row.notes}
								on:input={() => markDirty(index)}
								rows="2"
								class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
							></textarea>
						</div>
					</div>
				{/if}
			{/each}

			<!-- Empty state -->
			{#if rows.filter(r => !r.isDeleted).length === 0}
				<div class="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
					<svg class="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1" aria-hidden="true">
						<circle cx="12" cy="12" r="10" />
						<polyline points="12 6 12 12 16 14" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
					<p class="mt-3 text-sm text-gray-500">Nog geen uren geregistreerd voor deze dag.</p>
				</div>
			{/if}

			<!-- Add button -->
			<button
				on:click={addRow}
				class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
				Uren toevoegen
			</button>
		</div>
	{/if}
</div>
