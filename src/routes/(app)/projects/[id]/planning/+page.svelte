<script lang="ts">
	import type { PageData } from './$types';
	import type { DeadlineItem, ProjectPhase, Milestone } from '$types';
	import {
		PROJECT_PHASE_LABELS,
		PROJECT_PHASES,
		MILESTONE_TYPES,
		MILESTONE_TYPE_LABELS,
		ACTIVITY_STATUS_LABELS
	} from '$types';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import MetricCard from '$lib/components/MetricCard.svelte';
	import DeadlineList from '$lib/components/planning/DeadlineList.svelte';
	import DeadlineCalendar from '$lib/components/planning/DeadlineCalendar.svelte';
	import { enhance } from '$app/forms';

	export let data: PageData;

	$: project = data.project;
	$: milestones = (data.milestones ?? []) as Milestone[];
	$: deadlineItems = (data.deadlineItems ?? []) as DeadlineItem[];
	$: activities = data.activities ?? [];
	$: projectProfile = data.projectProfile;
	$: metrics = data.planningMetrics;

	// Tab state
	type PlanningTab = 'deadlines' | 'timeline' | 'ai';
	let activeTab: PlanningTab = 'deadlines';

	const TABS: { id: PlanningTab; label: string; disabled: boolean }[] = [
		{ id: 'deadlines', label: 'Deadlines', disabled: false },
		{ id: 'timeline', label: 'Tijdlijn', disabled: true },
		{ id: 'ai', label: 'AI Suggesties', disabled: true }
	];

	// View toggle (list vs calendar)
	let deadlineView: 'list' | 'calendar' = 'list';

	// Milestone modal state
	let showMilestoneModal: boolean = false;
	let milestoneFormError: string = '';
	let milestoneFormSubmitting: boolean = false;

	// Milestone management panel
	let showMilestonePanel: boolean = false;

	// Phase groups for overview
	$: phaseGroups = activities.reduce(
		(acc: Record<string, typeof activities>, activity: { phase: string }) => {
			if (!acc[activity.phase]) {
				acc[activity.phase] = [];
			}
			acc[activity.phase].push(activity);
			return acc;
		},
		{} as Record<string, typeof activities>
	);

	function handleDeadlineClick(item: DeadlineItem): void {
		if (item.type === 'milestone') {
			showMilestonePanel = true;
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
	}
</script>

<svelte:head>
	<title>Planning — {project.name} — Tendermanager</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
	<!-- Breadcrumbs -->
	<Breadcrumbs
		items={[
			{ label: 'Projecten', href: '/projects' },
			{ label: project.name, href: `/projects/${project.id}` },
			{ label: 'Planning' }
		]}
	/>

	<!-- Header -->
	<div class="mt-4 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Planning</h1>
			<p class="mt-1 text-sm text-gray-500">
				Beheer deadlines, milestones en planningsdoelen voor dit project.
			</p>
		</div>
		<div class="flex items-center gap-3">
			<button
				type="button"
				on:click={() => { showMilestonePanel = !showMilestonePanel; }}
				class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
			>
				Milestones ({milestones.length})
			</button>
			<button
				type="button"
				on:click={() => { showMilestoneModal = true; }}
				class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
			>
				+ Milestone toevoegen
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
			{#each TABS as tab (tab.id)}
				<button
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
						<span class="ml-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
							Binnenkort
						</span>
					{/if}
				</button>
			{/each}
		</nav>
	</div>

	<!-- Tab content -->
	<div class="mt-6">
		{#if activeTab === 'deadlines'}
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

			<!-- Deadline view -->
			{#if deadlineView === 'list'}
				<DeadlineList
					items={deadlineItems}
					view="detailed"
					showProjectName={false}
					onItemClick={handleDeadlineClick}
				/>
			{:else}
				<DeadlineCalendar
					items={deadlineItems}
					onItemClick={handleDeadlineClick}
				/>
			{/if}

			<!-- Phase overview (mini-tijdlijn preview) -->
			{#if Object.keys(phaseGroups).length > 0}
				<div class="mt-8">
					<h2 class="text-sm font-semibold text-gray-700">Fase-overzicht</h2>
					<div class="mt-3 space-y-3">
						{#each Object.entries(phaseGroups) as [phase, phaseActivities] (phase)}
							{@const completed = phaseActivities.filter((a) => a.status === 'completed').length}
							{@const total = phaseActivities.length}
							{@const pct = total > 0 ? Math.round((completed / total) * 100) : 0}
							<div>
								<div class="flex items-center justify-between text-sm">
									<span class="font-medium text-gray-700">{PROJECT_PHASE_LABELS[phase]}</span>
									<span class="text-gray-500">{completed}/{total} ({pct}%)</span>
								</div>
								<div class="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
									<div
										class="h-full rounded-full bg-primary-500 transition-all duration-300"
										style="width: {pct}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Timeline info -->
			{#if projectProfile?.timeline_start || projectProfile?.timeline_end}
				<div class="mt-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
					<p class="text-sm text-gray-600">
						<span class="font-medium">Projectperiode:</span>
						{#if projectProfile.timeline_start}
							{formatDate(projectProfile.timeline_start)}
						{:else}
							<span class="italic text-gray-400">niet ingesteld</span>
						{/if}
						—
						{#if projectProfile.timeline_end}
							{formatDate(projectProfile.timeline_end)}
						{:else}
							<span class="italic text-gray-400">niet ingesteld</span>
						{/if}
					</p>
				</div>
			{/if}
		{:else if activeTab === 'timeline'}
			<div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
				<h3 class="text-sm font-medium text-gray-900">Tijdlijn — Binnenkort beschikbaar</h3>
				<p class="mt-1 text-sm text-gray-500">
					Een interactieve Gantt-chart met drag-and-drop planning wordt hier toegevoegd.
				</p>
			</div>
		{:else if activeTab === 'ai'}
			<div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
				<h3 class="text-sm font-medium text-gray-900">AI Suggesties — Binnenkort beschikbaar</h3>
				<p class="mt-1 text-sm text-gray-500">
					Laat de AI een realistische planning voorstellen op basis van procedure-type en scope.
				</p>
			</div>
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
						class="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
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
								Eerste milestone toevoegen
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

	<!-- Create milestone modal -->
	{#if showMilestoneModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-label="Milestone toevoegen">
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
					<h2 class="text-lg font-semibold text-gray-900">Milestone toevoegen</h2>
					<button
						type="button"
						on:click={closeMilestoneModal}
						class="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
						aria-label="Sluiten"
					>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<form
					method="POST"
					action="?/createMilestone"
					use:enhance={() => {
						milestoneFormSubmitting = true;
						milestoneFormError = '';
						return async ({ result }) => {
							milestoneFormSubmitting = false;
							if (result.type === 'success') {
								closeMilestoneModal();
								// Page will reload via SvelteKit invalidation
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

					<!-- Title -->
					<div>
						<label for="milestone-title" class="block text-sm font-medium text-gray-700">
							Titel <span class="text-red-500">*</span>
						</label>
						<input
							id="milestone-title"
							name="title"
							type="text"
							required
							maxlength="300"
							placeholder="bijv. Publicatie op TenderNed"
							class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
						/>
					</div>

					<!-- Type -->
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

					<!-- Target date -->
					<div class="mt-4">
						<label for="milestone-date" class="block text-sm font-medium text-gray-700">
							Doeldatum <span class="text-red-500">*</span>
						</label>
						<input
							id="milestone-date"
							name="target_date"
							type="date"
							required
							class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
						/>
					</div>

					<!-- Phase -->
					<div class="mt-4">
						<label for="milestone-phase" class="block text-sm font-medium text-gray-700">
							Fase (optioneel)
						</label>
						<select
							id="milestone-phase"
							name="phase"
							class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
						>
							<option value="">Geen fase</option>
							{#each PROJECT_PHASES as phase (phase)}
								<option value={phase}>{PROJECT_PHASE_LABELS[phase]}</option>
							{/each}
						</select>
					</div>

					<!-- Description -->
					<div class="mt-4">
						<label for="milestone-desc" class="block text-sm font-medium text-gray-700">
							Beschrijving (optioneel)
						</label>
						<textarea
							id="milestone-desc"
							name="description"
							rows="2"
							maxlength="2000"
							placeholder="Korte toelichting..."
							class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
						></textarea>
					</div>

					<!-- Critical -->
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
								Milestone toevoegen
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>
