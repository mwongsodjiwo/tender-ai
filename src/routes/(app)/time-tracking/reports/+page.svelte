<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { TIME_ENTRY_ACTIVITY_TYPE_LABELS } from '$types';
	import type { TimeEntryActivityType } from '$types';

	export let data: PageData;

	const PERIOD_OPTIONS = [
		{ value: 'week', label: 'Week' },
		{ value: 'month', label: 'Maand' },
		{ value: 'quarter', label: 'Kwartaal' },
		{ value: 'year', label: 'Jaar' }
	] as const;

	const ACTIVITY_COLORS: Record<string, string> = {
		preparing: '#2563EB',
		exploring: '#7C3AED',
		specifying: '#059669',
		tendering: '#D97706',
		contracting: '#DC2626'
	};

	const PROJECT_COLORS = [
		'#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626',
		'#EC4899', '#0891B2', '#4F46E5', '#16A34A', '#CA8A04'
	];

	let selectedPeriod = data.period;
	let selectedProject = data.projectFilter ?? '';

	// Export panel state
	let showExportPanel = false;
	let exportFrom = data.fromDate;
	let exportTo = data.toDate;
	let exporting = false;
	let exportError = '';

	function applyFilters(): void {
		const params = new URLSearchParams();
		params.set('period', selectedPeriod);
		if (selectedProject) {
			params.set('project_id', selectedProject);
		}
		goto(`/time-tracking/reports?${params.toString()}`);
	}

	function toggleExportPanel(): void {
		showExportPanel = !showExportPanel;
		if (showExportPanel) {
			exportFrom = data.fromDate;
			exportTo = data.toDate;
			exportError = '';
		}
	}

	/** Build CSV string from an array of time entry records */
	function buildCSV(entries: Record<string, unknown>[], fromDate: string, toDate: string): void {
		const headers = ['Datum', 'Project', 'Activiteit', 'Uren', 'Notitie'];
		const rows = entries.map((e) => {
			const project = e.project as { name: string } | null;
			const actType = e.activity_type as TimeEntryActivityType;
			return [
				e.date as string,
				project?.name ?? '',
				TIME_ENTRY_ACTIVITY_TYPE_LABELS[actType] ?? actType,
				String(e.hours),
				`"${((e.notes as string) ?? '').replace(/"/g, '""')}"`
			].join(',');
		});

		const csv = [headers.join(','), ...rows].join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.setAttribute('href', url);
		link.setAttribute('download', `urenregistratie_${fromDate}_${toDate}.csv`);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	async function exportCSV(): Promise<void> {
		exporting = true;
		exportError = '';

		try {
			const params = new URLSearchParams({ from: exportFrom, to: exportTo });
			const response = await fetch(`/api/time-entries?${params.toString()}`);

			if (!response.ok) {
				const body = await response.json().catch(() => ({ message: 'Onbekende fout' }));
				exportError = body.message ?? 'Fout bij ophalen uren';
				return;
			}

			const result = await response.json();
			const entries = (result.data ?? []) as Record<string, unknown>[];

			if (entries.length === 0) {
				exportError = 'Geen uren gevonden in de geselecteerde periode.';
				return;
			}

			buildCSV(entries, exportFrom, exportTo);
			showExportPanel = false;
		} catch {
			exportError = 'Er ging iets mis. Controleer je internetverbinding.';
		} finally {
			exporting = false;
		}
	}

	// Bar chart calculations
	$: maxProjectHours = Math.max(...data.byProject.map((p: { hours: number }) => p.hours), 1);
	$: maxWeekHours = Math.max(...data.byWeek.map((w: { hours: number }) => w.hours), 1);
</script>

<svelte:head>
	<title>Rapportage — Urenregistratie — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<!-- Breadcrumb -->
	<nav class="flex items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
		<a href="/time-tracking" class="hover:text-gray-700 transition-colors">Urenregistratie</a>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
		</svg>
		<span class="font-medium text-gray-900">Rapportage</span>
	</nav>

	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Rapportage</h1>
			<p class="mt-1 text-sm text-gray-500">
				{data.fromDate} t/m {data.toDate} — {data.totalHours}u totaal
			</p>
		</div>
		<button
			on:click={toggleExportPanel}
			class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
			</svg>
			Exporteer CSV
		</button>
	</div>

	<!-- Export panel -->
	{#if showExportPanel}
		<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
			<h3 class="text-sm font-semibold text-gray-900">Exporteer uren als CSV</h3>
			<p class="mt-1 text-xs text-gray-500">Kies de periode waarvoor je uren wilt exporteren.</p>

			{#if exportError}
				<div class="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">
					{exportError}
				</div>
			{/if}

			<div class="mt-4 flex flex-wrap items-end gap-4">
				<div>
					<label for="export-from" class="mb-1.5 block text-xs font-medium text-gray-500">Van</label>
					<input
						id="export-from"
						type="date"
						bind:value={exportFrom}
						class="min-w-[160px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
					/>
				</div>
				<div>
					<label for="export-to" class="mb-1.5 block text-xs font-medium text-gray-500">Tot</label>
					<input
						id="export-to"
						type="date"
						bind:value={exportTo}
						class="min-w-[160px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
					/>
				</div>
				<div class="flex items-center gap-2">
					<button
						on:click={exportCSV}
						disabled={exporting}
						class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if exporting}
							Exporteren...
						{:else}
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
							</svg>
							Download CSV
						{/if}
					</button>
					<button
						on:click={toggleExportPanel}
						class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
					>
						Annuleren
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Filters -->
	<div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
		<div class="flex flex-wrap items-end gap-4">
			<div>
				<label for="filter-period" class="mb-1.5 block text-xs font-medium text-gray-500">Periode</label>
				<select
					id="filter-period"
					bind:value={selectedPeriod}
					on:change={applyFilters}
					class="min-w-[140px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
				>
					{#each PERIOD_OPTIONS as opt (opt.value)}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="filter-project" class="mb-1.5 block text-xs font-medium text-gray-500">Project</label>
				<select
					id="filter-project"
					bind:value={selectedProject}
					on:change={applyFilters}
					class="min-w-[200px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
				>
					<option value="">Alle projecten</option>
					{#each data.projects as project (project.id)}
						<option value={project.id}>{project.name}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	{#if data.entries.length === 0}
		<!-- Empty state -->
		<div class="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
			<svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M18 20V10M12 20V4M6 20v-6" />
			</svg>
			<p class="mt-4 text-sm font-medium text-gray-900">Geen uren gevonden</p>
			<p class="mt-1 text-sm text-gray-500">Er zijn geen urenregistraties in de geselecteerde periode.</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Bar chart: Uren per project -->
			<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
				<h3 class="text-sm font-semibold text-gray-900">Uren per project</h3>
				<div class="mt-4 space-y-3">
					{#each data.byProject as project, i (project.project_id)}
						<div>
							<div class="flex items-center justify-between text-sm">
								<span class="truncate font-medium text-gray-700">{project.project_name}</span>
								<span class="ml-2 shrink-0 text-gray-500">{project.hours}u ({project.percentage}%)</span>
							</div>
							<div class="mt-1 h-3 w-full overflow-hidden rounded-full bg-gray-100">
								<div
									class="h-full rounded-full transition-all duration-500"
									style="width: {(project.hours / maxProjectHours) * 100}%; background-color: {PROJECT_COLORS[i % PROJECT_COLORS.length]}"
								></div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Donut-like: Verdeling per activiteit -->
			<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
				<h3 class="text-sm font-semibold text-gray-900">Verdeling per activiteit</h3>
				<div class="mt-4 space-y-3">
					{#each data.byActivity as activity (activity.activity_type)}
						<div class="flex items-center gap-3">
							<div
								class="h-3 w-3 shrink-0 rounded-full"
								style="background-color: {ACTIVITY_COLORS[activity.activity_type] ?? '#6B7280'}"
							></div>
							<div class="flex-1">
								<div class="flex items-center justify-between text-sm">
									<span class="font-medium text-gray-700">{activity.label}</span>
									<span class="text-gray-500">{activity.hours}u ({activity.percentage}%)</span>
								</div>
								<div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
									<div
										class="h-full rounded-full transition-all duration-500"
										style="width: {activity.percentage}%; background-color: {ACTIVITY_COLORS[activity.activity_type] ?? '#6B7280'}"
									></div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Trend: Uren per week -->
			<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
				<h3 class="text-sm font-semibold text-gray-900">Trend — uren per week</h3>
				{#if data.byWeek.length === 0}
					<p class="mt-4 text-sm text-gray-500">Geen data beschikbaar.</p>
				{:else}
					<div class="mt-4 flex items-end gap-2" style="height: 180px;">
						{#each data.byWeek as week (week.week)}
							<div class="flex flex-1 flex-col items-center gap-1">
								<span class="text-xs font-medium text-gray-500">{week.hours}u</span>
								<div
									class="w-full rounded-t-md bg-primary-500 transition-all duration-500"
									style="height: {(week.hours / maxWeekHours) * 140}px; min-height: 4px;"
								></div>
								<span class="text-xs text-gray-500">{week.label}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Detail table -->
			<div class="rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
				<div class="border-b border-gray-100 px-6 py-4">
					<h3 class="text-sm font-semibold text-gray-900">Detail overzicht</h3>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-left text-sm">
						<thead>
							<tr class="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-500">
								<th class="px-6 py-3">Datum</th>
								<th class="px-6 py-3">Project</th>
								<th class="px-6 py-3">Activiteit</th>
								<th class="px-6 py-3 text-right">Uren</th>
								<th class="px-6 py-3">Notitie</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-50">
							{#each data.entries as entry (entry.id)}
								{@const project = entry.project as { name: string } | null}
								{@const actType = entry.activity_type as TimeEntryActivityType}
								<tr class="hover:bg-gray-50">
									<td class="whitespace-nowrap px-6 py-3 text-gray-900">{entry.date}</td>
									<td class="px-6 py-3 text-gray-700">{project?.name ?? '—'}</td>
									<td class="px-6 py-3">
										<span class="inline-flex items-center gap-1.5">
											<span
												class="h-2 w-2 rounded-full"
												style="background-color: {ACTIVITY_COLORS[actType] ?? '#6B7280'}"
											></span>
											{TIME_ENTRY_ACTIVITY_TYPE_LABELS[actType] ?? actType}
										</span>
									</td>
									<td class="whitespace-nowrap px-6 py-3 text-right font-medium text-gray-900">{entry.hours}u</td>
									<td class="max-w-[200px] truncate px-6 py-3 text-gray-500">{entry.notes || '—'}</td>
								</tr>
							{/each}
						</tbody>
						<tfoot>
							<tr class="border-t border-gray-200 bg-gray-50 font-medium">
								<td class="px-6 py-3 text-gray-900" colspan="3">Totaal</td>
								<td class="px-6 py-3 text-right text-gray-900">{data.totalHours}u</td>
								<td class="px-6 py-3"></td>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>
		</div>
	{/if}
</div>
