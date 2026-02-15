<script lang="ts">
	import type { PageData } from './$types';
	import type { DeadlineItem, ProjectPhase, Milestone, PhaseActivity, ActivityDependency } from '$types';
	import {
		PROJECT_PHASE_LABELS,
		PROJECT_PHASES,
		MILESTONE_TYPES,
		MILESTONE_TYPE_LABELS,
		ACTIVITY_STATUS_LABELS
	} from '$types';
	import MetricCard from '$lib/components/MetricCard.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import DeadlineList from '$lib/components/planning/DeadlineList.svelte';
	import DeadlineCalendar from '$lib/components/planning/DeadlineCalendar.svelte';
	import GanttChart from '$lib/components/planning/GanttChart.svelte';
	import PlanningWizard from '$lib/components/planning/PlanningWizard.svelte';
	import DocumentDetailDrawer from '$lib/components/planning/DocumentDetailDrawer.svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	export let data: PageData;

	interface PlanningDocument {
		id: string;
		name: string;
		slug: string;
		description: string | null;
		status: string;
		phase: string;
		deadline: string | null;
		daysRemaining: number | null;
		total: number;
		approved: number;
		progress: number;
		assignedTo: string | null;
	}

	$: project = data.project;
	$: milestones = (data.milestones ?? []) as Milestone[];
	$: deadlineItems = (data.deadlineItems ?? []) as DeadlineItem[];
	$: activities = (data.activities ?? []) as PhaseActivity[];
	$: dependencies = (data.dependencies ?? []) as ActivityDependency[];
	$: projectProfile = data.projectProfile;
	$: members = data.members ?? [];
	$: metrics = data.planningMetrics;
	$: planningDocuments = (data.planningDocuments ?? []) as PlanningDocument[];

	// Critical path state
	let criticalPathIds: Set<string> = new Set();
	let nodeFloats: Map<string, number> = new Map();
	let criticalPathError: string = '';
	let showCriticalPath: boolean = true;

	async function loadCriticalPath(): Promise<void> {
		criticalPathError = '';
		try {
			const response = await fetch(`/api/projects/${project.id}/planning/critical-path`);
			if (!response.ok) {
				const errorData = await response.json();
				criticalPathError = errorData.message ?? 'Fout bij berekenen kritiek pad.';
				return;
			}
			const result = await response.json();
			criticalPathIds = new Set(result.data.critical_path_ids);
			const floats = new Map<string, number>();
			for (const node of result.data.nodes) {
				floats.set(node.id, node.total_float);
			}
			nodeFloats = floats;
		} catch {
			criticalPathError = 'Netwerkfout bij ophalen kritiek pad.';
		}
	}

	// Load critical path on mount and when dependencies change
	onMount(() => { loadCriticalPath(); });
	$: if (dependencies) { loadCriticalPath(); }

	async function handleDependencyCreate(sourceId: string, targetId: string): Promise<void> {
		ganttUpdateError = '';
		try {
			const response = await fetch(`/api/projects/${project.id}/dependencies`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					source_type: 'activity',
					source_id: sourceId,
					target_type: 'activity',
					target_id: targetId,
					dependency_type: 'finish_to_start',
					lag_days: 0
				})
			});
			if (!response.ok) {
				const errorData = await response.json();
				ganttUpdateError = errorData.message ?? 'Fout bij aanmaken afhankelijkheid.';
				return;
			}
			await invalidateAll();
		} catch {
			ganttUpdateError = 'Netwerkfout bij aanmaken afhankelijkheid.';
		}
	}

	// Tab state — support ?tab= query parameter
	type PlanningTab = 'documents' | 'deadlines' | 'timeline' | 'ai';
	$: tabParam = $page.url.searchParams.get('tab') as PlanningTab | null;
	let activeTab: PlanningTab = 'documents';

	// Initialize from query parameter
	$: if (tabParam && ['documents', 'deadlines', 'timeline', 'ai'].includes(tabParam)) {
		activeTab = tabParam;
	}

	const TABS: { id: PlanningTab; label: string; disabled: boolean }[] = [
		{ id: 'documents', label: 'Documenten', disabled: false },
		{ id: 'deadlines', label: 'Deadlines', disabled: false },
		{ id: 'timeline', label: 'Tijdlijn', disabled: false },
		{ id: 'ai', label: 'AI Suggesties', disabled: false }
	];

	// Document drawer state
	let selectedDocument: PlanningDocument | null = null;

	function handleDocumentClick(doc: PlanningDocument): void {
		selectedDocument = doc;
	}

	function closeDocumentDrawer(): void {
		selectedDocument = null;
	}

	let drawerSaveError: string = '';

	async function handleDocumentSave(docId: string, deadline: string | null, assignedTo: string | null): Promise<void> {
		drawerSaveError = '';
		const doc = planningDocuments.find((d) => d.id === docId);
		if (!doc) return;

		// Find or create a matching activity for this document
		const matchingActivity = activities.find(
			(a) => a.title.toLowerCase().includes(doc.name.toLowerCase())
				|| doc.name.toLowerCase().includes(a.title.toLowerCase())
		);

		if (matchingActivity) {
			// Update existing activity
			try {
				const response = await fetch(`/api/projects/${project.id}/activities/${matchingActivity.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						due_date: deadline,
						assigned_to: assignedTo
					})
				});
				if (!response.ok) {
					const err = await response.json();
					drawerSaveError = err.message ?? 'Fout bij opslaan.';
					return;
				}
			} catch {
				drawerSaveError = 'Netwerkfout bij opslaan.';
				return;
			}
		} else if (deadline || assignedTo) {
			// Create new activity for this document via REST API
			const body: Record<string, string> = {
				title: doc.name,
				phase: doc.phase,
				activity_type: 'custom',
				description: `Planning activiteit voor ${doc.name}`
			};
			if (deadline) body.due_date = deadline;
			if (assignedTo) body.assigned_to = assignedTo;

			try {
				const response = await fetch(`/api/projects/${project.id}/activities`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body)
				});
				if (!response.ok) {
					const err = await response.json();
					drawerSaveError = err.message ?? 'Fout bij aanmaken activiteit.';
					return;
				}
			} catch {
				drawerSaveError = 'Netwerkfout bij aanmaken activiteit.';
				return;
			}
		}

		selectedDocument = null;
		await invalidateAll();
	}

	function getDocActivities(doc: PlanningDocument): { id: string; title: string; status: string }[] {
		return activities
			.filter((a) =>
				a.title.toLowerCase().includes(doc.name.toLowerCase())
				|| doc.name.toLowerCase().includes(a.title.toLowerCase())
			)
			.map((a) => ({ id: a.id, title: a.title, status: a.status }));
	}

	function getAssignedName(profileId: string | null): string {
		if (!profileId) return '';
		const member = members.find(
			(m: { profile_id: string }) => m.profile_id === profileId
		);
		if (!member?.profile) return '';
		const p = member.profile as { first_name?: string; last_name?: string };
		return `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
	}

	function formatDocDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('nl-NL', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	// Gantt chart: activity update handler (drag-and-drop)
	let ganttUpdateError: string = '';

	async function handleActivityUpdate(activityId: string, changes: Partial<PhaseActivity>): Promise<void> {
		ganttUpdateError = '';
		try {
			const response = await fetch(`/api/projects/${project.id}/activities/${activityId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(changes)
			});

			if (!response.ok) {
				const errorData = await response.json();
				ganttUpdateError = errorData.message ?? 'Fout bij opslaan van wijziging.';
				return;
			}

			// Refresh page data
			await invalidateAll();
		} catch {
			ganttUpdateError = 'Netwerkfout bij opslaan van wijziging.';
		}
	}

	function handleMilestoneClick(milestone: Milestone): void {
		showMilestonePanel = true;
	}

	// View toggle (list vs calendar)
	let deadlineView: 'list' | 'calendar' = 'list';

	// Milestone modal state
	let showMilestoneModal: boolean = false;
	let milestoneFormError: string = '';
	let milestoneFormSubmitting: boolean = false;
	let isMilestone: boolean = false;

	// Export dropdown
	let showExportMenu: boolean = false;

	function handleExport(format: 'ical' | 'csv') {
		showExportMenu = false;
		window.location.href = `/api/projects/${project.id}/planning/export/${format}`;
	}

	function closeExportMenu(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.export-menu-wrapper')) {
			showExportMenu = false;
		}
	}

	// Milestone management panel
	let showMilestonePanel: boolean = false;

	function handleDeadlineClick(item: DeadlineItem): void {
		if (item.type === 'milestone') {
			showMilestonePanel = true;
		}
	}

	let dateUpdateError: string = '';

	async function handleDateChange(item: DeadlineItem, newDate: string): Promise<void> {
		dateUpdateError = '';
		const url = item.type === 'milestone'
			? `/api/projects/${project.id}/milestones/${item.id}`
			: `/api/projects/${project.id}/activities/${item.id}`;
		const body = item.type === 'milestone'
			? { target_date: newDate }
			: { due_date: newDate };
		try {
			const response = await fetch(url, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!response.ok) {
				const err = await response.json();
				dateUpdateError = err.message ?? 'Fout bij opslaan datum.';
				return;
			}
			await invalidateAll();
		} catch {
			dateUpdateError = 'Netwerkfout bij opslaan datum.';
		}
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('nl-NL', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function getMilestoneStatusColor(status: string): string {
		if (status === 'completed') return 'bg-green-100 text-green-700';
		if (status === 'in_progress') return 'bg-blue-100 text-blue-700';
		if (status === 'skipped') return 'bg-gray-100 text-gray-500';
		return 'bg-gray-100 text-gray-700';
	}

	function closeMilestoneModal(): void {
		showMilestoneModal = false;
		milestoneFormError = '';
		isMilestone = false;
	}

	// Context menu state
	let contextMenu: { x: number; y: number; activityId: string; title: string } | null = null;

	function handleContextMenu(e: MouseEvent, doc: PlanningDocument): void {
		e.preventDefault();
		const matchingActivity = activities.find(
			(a) => a.title.toLowerCase().includes(doc.name.toLowerCase())
				|| doc.name.toLowerCase().includes(a.title.toLowerCase())
		);
		if (!matchingActivity) return;
		contextMenu = { x: e.clientX, y: e.clientY, activityId: matchingActivity.id, title: doc.name };
	}

	function handleDeadlineContextMenu(e: MouseEvent, item: DeadlineItem): void {
		e.preventDefault();
		if (item.type !== 'activity') return;
		contextMenu = { x: e.clientX, y: e.clientY, activityId: item.id, title: item.title };
	}

	function closeContextMenu(): void {
		contextMenu = null;
	}

	let deleteError: string = '';

	async function handleDeleteActivity(): Promise<void> {
		if (!contextMenu) return;
		deleteError = '';
		const { activityId } = contextMenu;
		contextMenu = null;

		try {
			const response = await fetch(`/api/projects/${project.id}/activities/${activityId}`, {
				method: 'DELETE'
			});
			if (!response.ok) {
				const err = await response.json();
				deleteError = err.message ?? 'Fout bij verwijderen.';
				return;
			}
			await invalidateAll();
		} catch {
			deleteError = 'Netwerkfout bij verwijderen.';
		}
	}
</script>

<svelte:window on:click={(e) => { closeContextMenu(); closeExportMenu(e); }} />

<svelte:head>
	<title>Planning — {project.name} — Tendermanager</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
	<!-- Header -->
	<div class="mt-4 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Planning</h1>
			<p class="mt-1 text-sm text-gray-500">
				Beheer deadlines, milestones en planningsdoelen voor dit project.
			</p>
		</div>
		<div class="flex items-center gap-3">
			<!-- Export dropdown -->
			<div class="export-menu-wrapper relative">
				<button
					type="button"
					on:click|stopPropagation={() => { showExportMenu = !showExportMenu; }}
					class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
				>
					Exporteren
				</button>
				{#if showExportMenu}
					<div class="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
						<button
							type="button"
							on:click={() => handleExport('ical')}
							class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
						>
							iCal (.ics)
						</button>
						<button
							type="button"
							on:click={() => handleExport('csv')}
							class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
						>
							CSV (.csv)
						</button>
					</div>
				{/if}
			</div>
			<button
				type="button"
				on:click={() => { showMilestoneModal = true; }}
				class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
			>
				+ Toevoegen
			</button>
		</div>
	</div>

	<!-- Metrics -->
	<div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
		<MetricCard
			label="Voortgang"
			value="{metrics.progressPercentage}%"
			trend="{metrics.completedActivities}/{metrics.totalActivities} activiteiten"
		/>
		<MetricCard
			label="Milestones"
			value="{metrics.completedMilestones}/{metrics.totalMilestones}"
			trend="afgerond"
		/>
		<MetricCard
			label="Deadlines"
			value="{deadlineItems.length}"
			trend="openstaand"
		/>
		<MetricCard
			label="Verlopen"
			value="{metrics.overdueCount}"
			trend={metrics.overdueCount > 0 ? 'actie vereist' : 'alles op schema'}
			trendDirection={metrics.overdueCount > 0 ? 'down' : 'neutral'}
		/>
		<MetricCard
			label="Deze week"
			value="{metrics.thisWeekCount}"
			trend="komende 7 dagen"
		/>
	</div>

	<!-- Tabs -->
	<div class="mt-8 border-b border-gray-200">
		<nav class="-mb-px flex space-x-6" aria-label="Planning tabs">
			<div role="tablist" class="flex space-x-6">
			{#each TABS as tab (tab.id)}
				<button
					role="tab"
					on:click={() => { if (!tab.disabled) activeTab = tab.id; }}
					class="border-b-2 px-1 py-3 text-sm font-medium transition-colors
						{activeTab === tab.id
							? 'border-primary-500 text-primary-600'
							: tab.disabled
								? 'border-transparent text-gray-300 cursor-not-allowed'
								: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
					disabled={tab.disabled}
					aria-selected={activeTab === tab.id}
				>
					{tab.label}
					{#if tab.disabled}
						<span class="ml-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
							Binnenkort
						</span>
					{/if}
				</button>
			{/each}
			</div>
		</nav>
	</div>

	<!-- Tab content -->
	<div class="mt-6">
		{#if activeTab === 'documents'}
			<!-- Documents table -->
			{#if planningDocuments.length === 0}
				<div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
					<svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
					</svg>
					<h3 class="mt-4 text-sm font-medium text-gray-900">Geen documenten</h3>
					<p class="mt-1 text-sm text-gray-500">
						Er zijn nog geen documenttypes geconfigureerd.
					</p>
				</div>
			{:else}
				<div class="rounded-card bg-white shadow-card overflow-hidden">
					<table class="w-full">
						<thead>
							<tr class="border-b border-gray-200">
								<th class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Titel</th>
								<th class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
								<th class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Toegewezen aan</th>
								<th class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Deadline</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							{#each planningDocuments as doc (doc.id)}
								<tr
									class="group cursor-pointer transition-colors hover:bg-gray-50"
									on:click={() => handleDocumentClick(doc)}
									on:contextmenu={(e) => handleContextMenu(e, doc)}
									role="button"
									tabindex="0"
									on:keydown={(e) => { if (e.key === 'Enter') handleDocumentClick(doc); }}
								>
									<td class="px-6 py-4">
										<span class="text-sm font-medium text-gray-900">{doc.name}</span>
									</td>
									<td class="px-6 py-4">
										<StatusBadge status={doc.status} />
									</td>
									<td class="px-6 py-4">
										{#if doc.assignedTo}
											<span class="text-sm text-gray-700">{getAssignedName(doc.assignedTo)}</span>
										{:else}
											<span class="text-sm text-gray-500">—</span>
										{/if}
									</td>
									<td class="px-6 py-4">
										{#if doc.deadline}
											<span class="text-sm text-gray-700">{formatDocDate(doc.deadline)}</span>
										{:else}
											<span class="text-sm text-gray-500">—</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		{:else if activeTab === 'deadlines'}
			<!-- View toggle -->
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
					<button
						type="button"
						on:click={() => { deadlineView = 'list'; }}
						class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
							{deadlineView === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
						aria-label="Lijstweergave"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
						</svg>
						Lijst
					</button>
					<button
						type="button"
						on:click={() => { deadlineView = 'calendar'; }}
						class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
							{deadlineView === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
						aria-label="Kalenderweergave"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						Kalender
					</button>
				</div>
			</div>

			<!-- Date update error -->
			{#if dateUpdateError}
				<div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{dateUpdateError}
					<button
						type="button"
						on:click={() => { dateUpdateError = ''; }}
						class="ml-2 font-medium text-red-800 underline hover:text-red-900"
					>
						Sluiten
					</button>
				</div>
			{/if}

			<!-- Deadline view -->
			{#if deadlineView === 'list'}
				<DeadlineList
					items={deadlineItems}
					view="detailed"
					showProjectName={false}
					onItemClick={handleDeadlineClick}
					onDateChange={handleDateChange}
					onContextMenu={handleDeadlineContextMenu}
				/>
			{:else}
				<DeadlineCalendar
					items={deadlineItems}
					onItemClick={handleDeadlineClick}
				/>
			{/if}
		{:else if activeTab === 'timeline'}
			<!-- Gantt update error -->
			{#if ganttUpdateError}
				<div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{ganttUpdateError}
					<button
						type="button"
						on:click={() => { ganttUpdateError = ''; }}
						class="ml-2 font-medium text-red-800 underline hover:text-red-900"
					>
						Sluiten
					</button>
				</div>
			{/if}

			<!-- Critical path toggle and info -->
			{#if criticalPathError}
				<div class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
					{criticalPathError}
				</div>
			{/if}

			{#if activities.length === 0 && milestones.length === 0}
				<div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
					<svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					<h3 class="mt-4 text-sm font-medium text-gray-900">Geen planningsdata</h3>
					<p class="mt-1 text-sm text-gray-500">
						Voeg activiteiten of milestones toe om de tijdlijn te zien.
					</p>
					<button
						type="button"
						on:click={() => { showMilestoneModal = true; }}
						class="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
					>
						Eerste item toevoegen
					</button>
				</div>
			{:else}
				<!-- Critical path toggle -->
				{#if dependencies.length > 0}
					<div class="mb-3 flex items-center gap-3">
						<label class="flex items-center gap-2">
							<input
								type="checkbox"
								bind:checked={showCriticalPath}
								class="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
							/>
							<span class="text-sm text-gray-700">Kritiek pad tonen</span>
						</label>
						{#if showCriticalPath && criticalPathIds.size > 0}
							<span class="text-xs text-gray-500">
								{criticalPathIds.size} {criticalPathIds.size === 1 ? 'item' : 'items'} op het kritieke pad
							</span>
						{/if}
					</div>
				{/if}

				<GanttChart
					{activities}
					{milestones}
					{dependencies}
					timelineStart={projectProfile?.timeline_start ?? null}
					timelineEnd={projectProfile?.timeline_end ?? null}
					readonly={false}
					{criticalPathIds}
					{nodeFloats}
					{showCriticalPath}
					onActivityUpdate={handleActivityUpdate}
					onMilestoneClick={handleMilestoneClick}
					onDependencyCreate={handleDependencyCreate}
				/>
			{/if}
		{:else if activeTab === 'ai'}
			<PlanningWizard
				projectId={project.id}
				timelineStart={projectProfile?.timeline_start ?? null}
				timelineEnd={projectProfile?.timeline_end ?? null}
			/>
		{/if}
	</div>

	<!-- Milestone management panel (slide-over) -->
	{#if showMilestonePanel}
		<div class="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label="Milestones beheren">
			<!-- Backdrop -->
			<button
				type="button"
				class="absolute inset-0 bg-gray-900/25 transition-opacity"
				on:click={() => { showMilestonePanel = false; }}
				aria-label="Sluiten"
			></button>

			<!-- Panel -->
			<div class="relative z-10 w-full max-w-md overflow-y-auto bg-white shadow-xl">
				<div class="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
					<h2 class="text-lg font-semibold text-gray-900">Milestones</h2>
					<button
						type="button"
						on:click={() => { showMilestonePanel = false; }}
						class="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-600"
						aria-label="Sluiten"
					>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div class="p-6">
					{#if milestones.length === 0}
						<div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
							<p class="text-sm text-gray-500">Nog geen milestones aangemaakt.</p>
							<button
								type="button"
								on:click={() => { showMilestoneModal = true; showMilestonePanel = false; }}
								class="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
							>
								Eerste item toevoegen
							</button>
						</div>
					{:else}
						<div class="space-y-3">
							{#each milestones as milestone (milestone.id)}
								<div class="rounded-lg border border-gray-200 bg-white p-4">
									<div class="flex items-start justify-between">
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-2">
												{#if milestone.is_critical}
													<svg class="h-4 w-4 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-label="Kritiek">
														<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
													</svg>
												{/if}
												<p class="truncate text-sm font-medium text-gray-900">{milestone.title}</p>
											</div>
											<p class="mt-1 text-xs text-gray-500">
												{MILESTONE_TYPE_LABELS[milestone.milestone_type]}
												{#if milestone.phase}
													· {PROJECT_PHASE_LABELS[milestone.phase]}
												{/if}
											</p>
											<p class="mt-1 text-xs text-gray-500">
												Datum: {formatDate(milestone.target_date)}
												{#if milestone.actual_date}
													(werkelijk: {formatDate(milestone.actual_date)})
												{/if}
											</p>
										</div>
										<span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {getMilestoneStatusColor(milestone.status)}">
											{ACTIVITY_STATUS_LABELS[milestone.status]}
										</span>
									</div>

									<!-- Actions -->
									<div class="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
										{#if milestone.status !== 'completed'}
											<form method="POST" action="?/updateMilestoneStatus" use:enhance>
												<input type="hidden" name="milestone_id" value={milestone.id} />
												<input type="hidden" name="status" value="completed" />
												<button
													type="submit"
													class="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-green-50 hover:text-green-700"
												>
													Afronden
												</button>
											</form>
										{/if}
										<form method="POST" action="?/deleteMilestone" use:enhance>
											<input type="hidden" name="milestone_id" value={milestone.id} />
											<button
												type="submit"
												class="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-700"
											>
												Verwijderen
											</button>
										</form>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Document detail drawer -->
	<DocumentDetailDrawer
		document={selectedDocument}
		projectId={project.id}
		{members}
		activities={selectedDocument ? getDocActivities(selectedDocument) : []}
		onClose={closeDocumentDrawer}
		onSave={handleDocumentSave}
	/>

	{#if drawerSaveError}
		<div class="fixed bottom-4 right-4 z-50 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
			{drawerSaveError}
			<button
				type="button"
				on:click={() => { drawerSaveError = ''; }}
				class="ml-2 font-medium text-red-800 underline hover:text-red-900"
			>
				Sluiten
			</button>
		</div>
	{/if}

	{#if deleteError}
		<div class="fixed bottom-4 right-4 z-50 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
			{deleteError}
			<button
				type="button"
				on:click={() => { deleteError = ''; }}
				class="ml-2 font-medium text-red-800 underline hover:text-red-900"
			>
				Sluiten
			</button>
		</div>
	{/if}

	<!-- Context menu -->
	{#if contextMenu}
		<div
			class="fixed z-50 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
			style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
			role="menu"
			tabindex="-1"
			aria-label="Activiteitopties"
			on:contextmenu|preventDefault
			on:keydown={(e) => { if (e.key === 'Escape') contextMenu = null; }}
		>
			<div class="px-3 py-1.5 text-xs font-medium text-gray-500 truncate max-w-[200px]">
				{contextMenu.title}
			</div>
			<hr class="my-1 border-gray-100" />
			<button
				type="button"
				on:click={handleDeleteActivity}
				class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
				</svg>
				Verwijderen
			</button>
		</div>
	{/if}

	<!-- Create item modal (milestone or activity) -->
	{#if showMilestoneModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-label="Item toevoegen">
			<!-- Backdrop -->
			<button
				type="button"
				class="absolute inset-0 bg-gray-900/50 transition-opacity"
				on:click={closeMilestoneModal}
				aria-label="Sluiten"
			></button>

			<!-- Modal -->
			<div class="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-2xl">
				<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
					<h2 class="text-lg font-semibold text-gray-900">
						{isMilestone ? 'Milestone toevoegen' : 'Activiteit toevoegen'}
					</h2>
					<button
						type="button"
						on:click={closeMilestoneModal}
						class="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-600"
						aria-label="Sluiten"
					>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<form
					method="POST"
					action={isMilestone ? '?/createMilestone' : '?/createActivity'}
					use:enhance={() => {
						milestoneFormSubmitting = true;
						milestoneFormError = '';
						return async ({ result }) => {
							milestoneFormSubmitting = false;
							if (result.type === 'success') {
								closeMilestoneModal();
							} else if (result.type === 'error') {
								milestoneFormError = 'Er is een fout opgetreden bij het aanmaken.';
							}
						};
					}}
					class="p-6"
				>
					{#if milestoneFormError}
						<div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
							{milestoneFormError}
						</div>
					{/if}

					<!-- Milestone toggle -->
					<div class="mb-4">
						<label class="flex items-center gap-2">
							<input
								type="checkbox"
								bind:checked={isMilestone}
								class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
							/>
							<span class="text-sm font-medium text-gray-700">Dit is een milestone</span>
						</label>
					</div>

					<!-- Title -->
					<div>
						<label for="item-title" class="block text-sm font-medium text-gray-700">
							Titel <span class="text-red-500">*</span>
						</label>
						<input
							id="item-title"
							name="title"
							type="text"
							required
							maxlength="300"
							placeholder={isMilestone ? 'bijv. Publicatie op TenderNed' : 'bijv. Programma van Eisen opstellen'}
							class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
						/>
					</div>

					{#if isMilestone}
						<!-- Milestone type -->
						<div class="mt-4">
							<label for="milestone-type" class="block text-sm font-medium text-gray-700">
								Type <span class="text-red-500">*</span>
							</label>
							<select
								id="milestone-type"
								name="milestone_type"
								required
								class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
							>
								{#each MILESTONE_TYPES as mt (mt)}
									<option value={mt}>{MILESTONE_TYPE_LABELS[mt]}</option>
								{/each}
							</select>
						</div>
					{/if}

					<!-- Date -->
					<div class="mt-4">
						<label for="item-date" class="block text-sm font-medium text-gray-700">
							{isMilestone ? 'Doeldatum' : 'Deadline'} <span class="text-red-500">*</span>
						</label>
						<input
							id="item-date"
							name={isMilestone ? 'target_date' : 'due_date'}
							type="date"
							required
							class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
						/>
					</div>

					<!-- Phase -->
					<div class="mt-4">
						<label for="item-phase" class="block text-sm font-medium text-gray-700">
							Fase {#if !isMilestone}<span class="text-red-500">*</span>{:else}(optioneel){/if}
						</label>
						<select
							id="item-phase"
							name="phase"
							required={!isMilestone}
							class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
						>
							{#if isMilestone}
								<option value="">Geen fase</option>
							{/if}
							{#each PROJECT_PHASES as phase (phase)}
								<option value={phase}>{PROJECT_PHASE_LABELS[phase]}</option>
							{/each}
						</select>
					</div>

					{#if !isMilestone}
						<!-- Assigned to (activities only) -->
						<div class="mt-4">
							<label for="item-assigned" class="block text-sm font-medium text-gray-700">
								Toegewezen aan (optioneel)
							</label>
							<select
								id="item-assigned"
								name="assigned_to"
								class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
							>
								<option value="">Niemand</option>
								{#each members as member (member.profile_id)}
									<option value={member.profile_id}>
										{member.profile?.first_name ?? ''} {member.profile?.last_name ?? ''}
									</option>
								{/each}
							</select>
						</div>
					{/if}

					<!-- Description -->
					<div class="mt-4">
						<label for="item-desc" class="block text-sm font-medium text-gray-700">
							Beschrijving (optioneel)
						</label>
						<textarea
							id="item-desc"
							name="description"
							rows="2"
							maxlength="2000"
							placeholder="Korte toelichting..."
							class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
						></textarea>
					</div>

					{#if isMilestone}
						<!-- Critical (milestones only) -->
						<div class="mt-4">
							<label class="flex items-center gap-2">
								<input
									type="checkbox"
									name="is_critical"
									value="true"
									class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
								/>
								<span class="text-sm text-gray-700">Kritieke milestone (blokkeert andere milestones)</span>
							</label>
						</div>
					{/if}

					<!-- Actions -->
					<div class="mt-6 flex items-center justify-end gap-3">
						<button
							type="button"
							on:click={closeMilestoneModal}
							class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
						>
							Annuleren
						</button>
						<button
							type="submit"
							disabled={milestoneFormSubmitting}
							class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
						>
							{#if milestoneFormSubmitting}
								Opslaan...
							{:else}
								Toevoegen
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>
