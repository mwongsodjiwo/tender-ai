<script lang="ts">
	import { goto } from '$app/navigation';
	import MultiProjectTimeline from '$components/planning/MultiProjectTimeline.svelte';
	import CapacityHeatmap from '$components/planning/CapacityHeatmap.svelte';
	import DeadlineList from '$components/planning/DeadlineList.svelte';
	import WorkloadView from '$components/planning/WorkloadView.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	type Tab = 'overview' | 'capacity' | 'deadlines' | 'workload';
	let activeTab: Tab = 'overview';

	$: overview = data.overview;
	$: summary = overview.summary;
	$: warnings = overview.warnings;
	$: deadlineItems = data.deadlineItems;
	$: workload = data.workload;

	function handleProjectClick(projectId: string) {
		goto(`/projects/${projectId}/planning`);
	}

	function handleDeadlineClick(item: { project_id: string }) {
		goto(`/projects/${item.project_id}/planning`);
	}

	function handleMemberClick(profileId: string) {
		// Future: navigate to member detail view
	}

	const TABS: { value: Tab; label: string }[] = [
		{ value: 'overview', label: 'Overzicht' },
		{ value: 'capacity', label: 'Capaciteit' },
		{ value: 'deadlines', label: 'Deadlines' },
		{ value: 'workload', label: 'Werkbelasting' }
	];
</script>

<svelte:head>
	<title>Planning — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page header -->
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Planning</h1>
		<p class="mt-1 text-sm text-gray-500">
			Organisatie-breed overzicht van alle projectplanningen
		</p>
	</div>

	<!-- Summary cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-5">
			<p class="text-sm font-medium text-gray-500">Actieve projecten</p>
			<p class="mt-1 text-3xl font-bold text-gray-900">{summary.total_active}</p>
		</div>
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-5">
			<p class="text-sm font-medium text-gray-500">Op schema</p>
			<p class="mt-1 text-3xl font-bold {summary.on_track === summary.total_active ? 'text-green-600' : 'text-orange-600'}">
				{summary.on_track}
				<span class="text-base font-normal text-gray-500">/ {summary.total_active}</span>
			</p>
		</div>
		<div class="rounded-lg border border-gray-200 bg-white px-4 py-5">
			<p class="text-sm font-medium text-gray-500">Kritieke deadlines</p>
			<p class="mt-1 text-3xl font-bold {summary.critical_deadlines > 0 ? 'text-red-600' : 'text-gray-900'}">
				{summary.critical_deadlines}
			</p>
			<p class="text-xs text-gray-500">komende 14 dagen</p>
		</div>
	</div>

	<!-- Warnings -->
	{#if warnings.length > 0}
		<div class="rounded-lg border border-orange-200 bg-orange-50 p-4">
			<h3 class="text-sm font-semibold text-orange-800">Aandachtspunten</h3>
			<ul class="mt-2 space-y-1">
				{#each warnings as warning}
					<li class="flex items-start gap-2 text-sm text-orange-700">
						<svg class="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
						</svg>
						{warning}
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Tabs -->
	<div class="border-b border-gray-200">
		<nav class="-mb-px flex gap-6" aria-label="Planning tabbladen">
			{#each TABS as tab (tab.value)}
				<button
					on:click={() => (activeTab = tab.value)}
					class="whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors
						{activeTab === tab.value
							? 'border-primary-500 text-primary-600'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
					aria-current={activeTab === tab.value ? 'page' : undefined}
				>
					{tab.label}
					{#if tab.value === 'deadlines' && deadlineItems.length > 0}
						<span class="ml-1.5 inline-flex items-center justify-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
							{deadlineItems.length}
						</span>
					{/if}
					{#if tab.value === 'workload' && workload.warnings.length > 0}
						<span class="ml-1.5 inline-flex items-center justify-center rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
							{workload.warnings.length}
						</span>
					{/if}
				</button>
			{/each}
		</nav>
	</div>

	<!-- Tab content -->
	{#if activeTab === 'overview'}
		<div class="space-y-6">
			<MultiProjectTimeline
				projects={overview.projects}
				year={data.year}
				onProjectClick={handleProjectClick}
			/>
			<CapacityHeatmap
				capacity={overview.capacity}
				teamSize={data.teamSize}
			/>
		</div>
	{:else if activeTab === 'capacity'}
		<CapacityHeatmap
			capacity={overview.capacity}
			teamSize={data.teamSize}
		/>
	{:else if activeTab === 'deadlines'}
		{#if deadlineItems.length === 0}
			<div class="rounded-lg border border-gray-200 bg-white px-4 py-12 text-center">
				<p class="text-sm text-gray-500">Geen deadlines in de komende 30 dagen.</p>
			</div>
		{:else}
			<DeadlineList
				items={deadlineItems}
				view="detailed"
				onItemClick={handleDeadlineClick}
			/>
		{/if}
	{:else if activeTab === 'workload'}
		<WorkloadView
			members={workload.members}
			warnings={workload.warnings}
			from={data.workloadFrom}
			to={data.workloadTo}
			onMemberClick={handleMemberClick}
		/>
	{/if}
</div>
