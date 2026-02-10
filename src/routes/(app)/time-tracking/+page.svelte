<script lang="ts">
	import type { PageData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import {
		toISOWeekString,
		getWeekDates,
		formatDateISO,
		formatDateDutch,
		formatWeekRange,
		previousWeek,
		nextWeek,
		getISOWeekNumber
	} from '$lib/utils/week';
	import {
		TIME_ENTRY_ACTIVITY_TYPES,
		TIME_ENTRY_ACTIVITY_TYPE_LABELS
	} from '$types';
	import type { TimeEntryActivityType } from '$types';

	export let data: PageData;

	// State
	let saving = false;
	let saveSuccess = false;
	let error = '';

	$: currentWeek = data.currentWeek;
	$: weekNumber = getISOWeekNumber(new Date(getWeekDates(currentWeek)[0]));
	$: weekRange = formatWeekRange(currentWeek);
	$: weekDates = getWeekDates(currentWeek);
	$: isCurrentWeek = currentWeek === toISOWeekString(new Date());

	// ── Per-day row state ─────────────────────────────────────────────────
	// We keep a flat array per date-string.  The reactive block below
	// (re)initialises it whenever server data changes (navigation, save).

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

	// Track which data.entries snapshot we already processed so we don't
	// overwrite user edits on every Svelte tick.
	let lastEntriesRef: unknown[] = [];
	let days: { dateStr: string; label: string; rows: EntryRow[] }[] = [];

	$: if (data.entries !== lastEntriesRef) {
		lastEntriesRef = data.entries;
		days = weekDates.map((date) => {
			const dateStr = formatDateISO(date);
			const existing = (data.entries as Record<string, unknown>[]).filter(
				(e) => e.date === dateStr
			);
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

	function dayTotal(rows: EntryRow[]): number {
		return rows.filter((r) => !r.isDeleted).reduce((s, r) => s + r.hours, 0);
	}

	$: computedWeekTotal = days.reduce((s, d) => s + dayTotal(d.rows), 0);

	// ── Row mutations (fully immutable — always reassign `days`) ──────────

	function addRow(dayIndex: number): void {
		days = days.map((d, i) =>
			i === dayIndex
				? {
						...d,
						rows: [
							...d.rows,
							{
								id: null,
								project_id: data.projects[0]?.id ?? '',
								activity_type: 'preparing' as TimeEntryActivityType,
								hours: 1,
								notes: '',
								isNew: true,
								isDirty: true,
								isDeleted: false
							}
						]
					}
				: d
		);
	}

	async function removeRow(dayIndex: number, rowIndex: number): Promise<void> {
		const row = days[dayIndex].rows[rowIndex];

		if (row.isNew) {
			days = days.map((d, i) =>
				i === dayIndex
					? { ...d, rows: d.rows.filter((_, ri) => ri !== rowIndex) }
					: d
			);
			return;
		}

		if (!row.id) return;

		const removedRow = { ...row };
		// Optimistic: remove from UI immediately
		days = days.map((d, i) =>
			i === dayIndex
				? { ...d, rows: d.rows.filter((_, ri) => ri !== rowIndex) }
				: d
		);

		try {
			const response = await fetch(`/api/time-entries/${removedRow.id}`, { method: 'DELETE' });

			if (!response.ok) {
				const body = await response.json().catch(() => ({ message: 'Onbekende fout' }));
				error = `Verwijderen mislukt: ${body.message ?? 'Onbekende fout'}`;
				// Rollback
				days = days.map((d, i) =>
					i === dayIndex
						? {
								...d,
								rows: [
									...d.rows.slice(0, rowIndex),
									removedRow,
									...d.rows.slice(rowIndex)
								]
							}
						: d
				);
			} else {
				// Sync local state with server after successful deletion
				await invalidateAll();
			}
		} catch {
			error = 'Verwijderen mislukt. Controleer je internetverbinding.';
			days = days.map((d, i) =>
				i === dayIndex
					? {
							...d,
							rows: [
								...d.rows.slice(0, rowIndex),
								removedRow,
								...d.rows.slice(rowIndex)
							]
						}
					: d
			);
		}
	}

	/** Immutably update a single field on a row and mark it dirty */
	function updateRow(dayIndex: number, rowIndex: number, field: keyof EntryRow, value: unknown): void {
		days = days.map((d, i) =>
			i === dayIndex
				? {
						...d,
						rows: d.rows.map((r, ri) =>
							ri === rowIndex ? { ...r, [field]: value, isDirty: true } : r
						)
					}
				: d
		);
	}

	// ── Save ──────────────────────────────────────────────────────────────

	async function saveAll(): Promise<void> {
		saving = true;
		saveSuccess = false;
		error = '';

		try {
			const promises: Promise<Response>[] = [];

			for (const day of days) {
				for (const row of day.rows) {
					// Deleted rows are handled immediately by removeRow()
					if (row.isDeleted) continue;

					if (row.isNew) {
						promises.push(
							fetch('/api/time-entries', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({
									project_id: row.project_id,
									date: day.dateStr,
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
									date: day.dateStr,
									hours: row.hours,
									activity_type: row.activity_type,
									notes: row.notes
								})
							})
						);
					}
				}
			}

			if (promises.length === 0) {
				error = 'Geen wijzigingen om op te slaan';
				return;
			}

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
		} catch (err) {
			error = 'Er ging iets mis bij het opslaan. Controleer je internetverbinding.';
		} finally {
			saving = false;
		}
	}

	// ── Navigation ────────────────────────────────────────────────────────

	function goToWeek(week: string): void {
		goto(`/time-tracking?week=${week}`);
	}

	function goToToday(): void {
		goto(`/time-tracking?week=${toISOWeekString(new Date())}`);
	}

	function goToDay(dateStr: string): void {
		goto(`/time-tracking/${dateStr}`);
	}
</script>

<svelte:head>
	<title>Urenregistratie — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Urenregistratie</h1>
			<p class="mt-1 text-sm text-gray-500">Registreer je gewerkte uren per project.</p>
		</div>
		<div class="flex items-center gap-2">
			<a
				href="/time-tracking/reports"
				class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
			>
				<!-- Lucide: BarChart3 -->
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M18 20V10M12 20V4M6 20v-6" />
				</svg>
				Rapportage
			</a>
		</div>
	</div>

	<!-- Week navigation + Summary card side by side -->
	<div class="flex flex-col gap-6 lg:flex-row">
		<!-- Left: Week content -->
		<div class="flex-1 space-y-4">
			<!-- Week header -->
			<div class="flex items-center justify-between px-5 py-4">
				<div class="flex items-center gap-4">
					<h2 class="text-lg font-semibold text-gray-900">
						Week {weekNumber} — {weekRange}
					</h2>
				</div>
				<div class="flex items-center gap-2">
					<button
						on:click={() => goToWeek(previousWeek(currentWeek))}
						class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
						aria-label="Vorige week"
					>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					<button
						on:click={() => goToWeek(nextWeek(currentWeek))}
						class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
						aria-label="Volgende week"
					>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
					{#if !isCurrentWeek}
						<button
							on:click={goToToday}
							class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
						>
							Vandaag
						</button>
					{/if}
				</div>
			</div>

			<!-- Error banner -->
			{#if error}
				<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
					{error}
				</div>
			{/if}

			<!-- Success banner -->
			{#if saveSuccess}
				<div class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" role="status">
					Uren succesvol opgeslagen!
				</div>
			{/if}

			<!-- Day cards -->
			{#if data.projects.length === 0}
				<!-- Empty state: no projects -->
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
						<!-- Day header -->
						<div class="flex items-center justify-between border-b border-gray-100 px-5 py-3">
							<button
								on:click={() => goToDay(day.dateStr)}
								class="text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors"
							>
								{day.label}
							</button>
							<span class="text-sm font-medium text-gray-500">
								{dayTotal(day.rows)}u
							</span>
						</div>

						<!-- Entry rows -->
						<div class="divide-y divide-gray-50 px-5">
							{#each day.rows as row, rowIndex (row.id ?? `new-${dayIndex}-${rowIndex}`)}
								{#if !row.isDeleted}
									<div class="flex flex-wrap items-center gap-3 py-3">
										<!-- Project dropdown -->
										<div class="min-w-[180px] flex-1">
											<label for="project-{day.dateStr}-{rowIndex}" class="sr-only">Project</label>
											<select
												id="project-{day.dateStr}-{rowIndex}"
												value={row.project_id}
												on:change={(e) => updateRow(dayIndex, rowIndex, 'project_id', e.currentTarget.value)}
												class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
											>
												{#each data.projects as project (project.id)}
													<option value={project.id}>{project.name}</option>
												{/each}
											</select>
										</div>

										<!-- Activity type dropdown -->
										<div class="min-w-[150px]">
											<label for="activity-{day.dateStr}-{rowIndex}" class="sr-only">Activiteit</label>
											<select
												id="activity-{day.dateStr}-{rowIndex}"
												value={row.activity_type}
												on:change={(e) => updateRow(dayIndex, rowIndex, 'activity_type', e.currentTarget.value)}
												class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
											>
												{#each TIME_ENTRY_ACTIVITY_TYPES as actType (actType)}
													<option value={actType}>{TIME_ENTRY_ACTIVITY_TYPE_LABELS[actType]}</option>
												{/each}
											</select>
										</div>

										<!-- Hours input -->
										<div class="w-20">
											<label for="hours-{day.dateStr}-{rowIndex}" class="sr-only">Uren</label>
											<input
												id="hours-{day.dateStr}-{rowIndex}"
												type="number"
												min="0.25"
												max="24"
												step="0.25"
												value={row.hours}
												on:input={(e) => updateRow(dayIndex, rowIndex, 'hours', Number(e.currentTarget.value) || 0)}
												class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-sm text-gray-900 transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
											/>
										</div>

										<!-- Notes input -->
										<div class="min-w-[120px] flex-1">
											<label for="notes-{day.dateStr}-{rowIndex}" class="sr-only">Notitie</label>
											<input
												id="notes-{day.dateStr}-{rowIndex}"
												type="text"
												placeholder="Notitie"
												value={row.notes}
												on:input={(e) => updateRow(dayIndex, rowIndex, 'notes', e.currentTarget.value)}
												class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
											/>
										</div>

										<!-- Delete button -->
										<button
											on:click={() => removeRow(dayIndex, rowIndex)}
											class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
											aria-label="Verwijder urenregistratie"
										>
											<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
								{/if}
							{/each}
						</div>

						<!-- Add hours button -->
						<div class="border-t border-gray-50 px-5 py-3">
							<button
								on:click={() => addRow(dayIndex)}
								class="flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-primary-600"
							>
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
							<button
								on:click={() => goToDay(day.dateStr)}
								class="text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors"
							>
								{day.label}
							</button>
							<span class="text-sm text-gray-400">
								{dayTotal(day.rows)}u
							</span>
						</div>
						{#if day.rows.filter(r => !r.isDeleted).length > 0}
							<div class="divide-y divide-gray-50 border-t border-gray-100 px-5">
								{#each day.rows as row, rowIndex (row.id ?? `new-${dayIndex}-${rowIndex}`)}
									{#if !row.isDeleted}
										<div class="flex flex-wrap items-center gap-3 py-3">
											<div class="min-w-[180px] flex-1">
												<label for="project-{day.dateStr}-{rowIndex}" class="sr-only">Project</label>
												<select
													id="project-{day.dateStr}-{rowIndex}"
													value={row.project_id}
													on:change={(e) => updateRow(dayIndex, rowIndex, 'project_id', e.currentTarget.value)}
													class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
												>
													{#each data.projects as project (project.id)}
														<option value={project.id}>{project.name}</option>
													{/each}
												</select>
											</div>
											<div class="min-w-[150px]">
												<label for="activity-{day.dateStr}-{rowIndex}" class="sr-only">Activiteit</label>
												<select
													id="activity-{day.dateStr}-{rowIndex}"
													value={row.activity_type}
													on:change={(e) => updateRow(dayIndex, rowIndex, 'activity_type', e.currentTarget.value)}
													class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
												>
													{#each TIME_ENTRY_ACTIVITY_TYPES as actType (actType)}
														<option value={actType}>{TIME_ENTRY_ACTIVITY_TYPE_LABELS[actType]}</option>
													{/each}
												</select>
											</div>
											<div class="w-20">
												<label for="hours-{day.dateStr}-{rowIndex}" class="sr-only">Uren</label>
												<input
													id="hours-{day.dateStr}-{rowIndex}"
													type="number"
													min="0.25"
													max="24"
													step="0.25"
													value={row.hours}
													on:input={(e) => updateRow(dayIndex, rowIndex, 'hours', Number(e.currentTarget.value) || 0)}
													class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-sm"
												/>
											</div>
											<div class="min-w-[120px] flex-1">
												<label for="notes-{day.dateStr}-{rowIndex}" class="sr-only">Notitie</label>
												<input
													id="notes-{day.dateStr}-{rowIndex}"
													type="text"
													placeholder="Notitie"
													value={row.notes}
													on:input={(e) => updateRow(dayIndex, rowIndex, 'notes', e.currentTarget.value)}
													class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400"
												/>
											</div>
											<button
												on:click={() => removeRow(dayIndex, rowIndex)}
												class="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
												aria-label="Verwijder"
											>
												<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
											</button>
										</div>
									{/if}
								{/each}
							</div>
						{/if}
						<div class="border-t border-gray-100 px-5 py-3">
							<button
								on:click={() => addRow(dayIndex)}
								class="flex items-center gap-2 text-sm text-gray-400 hover:text-primary-600"
							>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
								Uren toevoegen
							</button>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Right: Summary card (sticky) -->
		<div class="lg:w-72">
			<div class="sticky top-8 space-y-4">
				<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
					<div class="text-center">
						<p class="text-4xl font-bold text-gray-900">{computedWeekTotal}u</p>
						<p class="mt-1 text-sm text-gray-500">gewerkt deze week</p>
					</div>

					<button
						on:click={saveAll}
						disabled={saving}
						class="mt-6 w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if saving}
							Opslaan...
						{:else}
							Opslaan
						{/if}
					</button>

					<p class="mt-3 text-center text-xs text-gray-400">
						Je kunt wijzigingen altijd later aanpassen.
					</p>
				</div>

				<!-- Quick export link -->
				<a
					href="/time-tracking/reports"
					class="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
					</svg>
					Exporteer als CSV
				</a>
			</div>
		</div>
	</div>
</div>
