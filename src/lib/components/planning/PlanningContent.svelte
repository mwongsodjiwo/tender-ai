<script lang="ts">
	import type { DeadlineItem, PhaseActivity, Milestone, ActivityDependency } from '$types';
	import DeadlineList from '$lib/components/planning/DeadlineList.svelte';
	import DeadlineCalendar from '$lib/components/planning/DeadlineCalendar.svelte';
	import GanttChart from '$lib/components/planning/GanttChart.svelte';
	import PlanningWizard from '$lib/components/planning/PlanningWizard.svelte';

	type PlanningTab = 'deadlines' | 'timeline' | 'ai';

	export let activeTab: PlanningTab;
	export let deadlineView: 'list' | 'calendar';
	export let deadlineItems: DeadlineItem[];
	export let activities: PhaseActivity[];
	export let milestones: Milestone[];
	export let dependencies: ActivityDependency[];
	export let projectId: string;
	export let timelineStart: string | null;
	export let timelineEnd: string | null;
	export let criticalPathIds: Set<string>;
	export let nodeFloats: Map<string, number>;
	export let showCriticalPath: boolean;
	export let criticalPathError: string;
	export let ganttUpdateError: string;
	export let dateUpdateError: string;

	export let onDeadlineClick: (item: DeadlineItem) => void;
	export let onDateChange: (item: DeadlineItem, newDate: string) => void;
	export let onContextMenu: (e: MouseEvent, item: DeadlineItem) => void;
	export let onActivityUpdate: (activityId: string, changes: Partial<PhaseActivity>) => void;
	export let onMilestoneClick: (milestone: Milestone) => void;
	export let onDependencyCreate: (sourceId: string, targetId: string) => void;
	export let onCriticalPathToggle: (value: boolean) => void;
	export let onDismissGanttError: () => void;
	export let onDismissDateError: () => void;
	export let onAddFirst: () => void;
</script>

{#if activeTab === 'deadlines'}
	<!-- Date update error -->
	{#if dateUpdateError}
		<div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
			{dateUpdateError}
			<button
				type="button"
				on:click={onDismissDateError}
				class="ml-2 font-medium text-red-800 underline hover:text-red-900"
			>
				Sluiten
			</button>
		</div>
	{/if}

	{#if deadlineView === 'list'}
		<DeadlineList
			items={deadlineItems}
			view="detailed"
			showProjectName={false}
			onItemClick={onDeadlineClick}
			onDateChange={onDateChange}
			onContextMenu={onContextMenu}
		/>
	{:else}
		<DeadlineCalendar
			items={deadlineItems}
			onItemClick={onDeadlineClick}
		/>
	{/if}
{:else if activeTab === 'timeline'}
	<!-- Gantt update error -->
	{#if ganttUpdateError}
		<div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
			{ganttUpdateError}
			<button
				type="button"
				on:click={onDismissGanttError}
				class="ml-2 font-medium text-red-800 underline hover:text-red-900"
			>
				Sluiten
			</button>
		</div>
	{/if}

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
				on:click={onAddFirst}
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
						checked={showCriticalPath}
						on:change={(e) => onCriticalPathToggle(e.currentTarget.checked)}
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
			{timelineStart}
			{timelineEnd}
			readonly={false}
			{criticalPathIds}
			{nodeFloats}
			{showCriticalPath}
			onActivityUpdate={onActivityUpdate}
			onMilestoneClick={onMilestoneClick}
			onDependencyCreate={onDependencyCreate}
		/>
	{/if}
{:else if activeTab === 'ai'}
	<PlanningWizard
		{projectId}
		{timelineStart}
		{timelineEnd}
	/>
{/if}
