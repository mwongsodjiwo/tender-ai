<!-- GanttChart — Main container with toolbar, left panel and timeline -->
<script lang="ts">
	import type { PhaseActivity, Milestone, ActivityDependency } from '$types';
	import GanttRow from './GanttRow.svelte';
	import GanttTimeline from './GanttTimeline.svelte';
	import type { ViewMode, PhaseGroup } from './gantt-types';
	import { GANTT_CONSTANTS, PHASE_COLORS } from './gantt-types';
	import { createTimeScale, groupByPhase, calculateTimelineBounds, calculateOverallProgress, isOnTrack } from './gantt-calculations';
	import { generateTimeMarkers, calculateTotalHeight, dateToX } from './gantt-layout';

	export let activities: PhaseActivity[];
	export let milestones: Milestone[];
	export let dependencies: ActivityDependency[] = [];
	export let timelineStart: string | null = null;
	export let timelineEnd: string | null = null;
	export let readonly: boolean = false;
	export let criticalPathIds: Set<string> = new Set();
	export let nodeFloats: Map<string, number> = new Map();
	export let showCriticalPath: boolean = true;
	export let onActivityUpdate: ((id: string, changes: Partial<PhaseActivity>) => void) | undefined = undefined;
	export let onMilestoneClick: ((milestone: Milestone) => void) | undefined = undefined;
	export let onDependencyCreate: ((sourceId: string, targetId: string) => void) | undefined = undefined;

	const { ROW_HEIGHT, PHASE_ROW_HEIGHT, LEFT_PANEL_WIDTH, HEADER_HEIGHT } = GANTT_CONSTANTS;

	let viewMode: ViewMode = 'week';
	const VIEW_MODE_OPTIONS: { mode: ViewMode; label: string }[] = [
		{ mode: 'day', label: 'Dag' }, { mode: 'week', label: 'Week' }, { mode: 'month', label: 'Maand' }
	];
	let expandedPhases: Set<string> = new Set();
	let depDragSourceId: string | null = null;

	$: phaseGroups = groupByPhase(activities, milestones).map((g) => ({
		...g,
		collapsed: !expandedPhases.has(g.phase)
	}));
	$: bounds = calculateTimelineBounds(activities, milestones, timelineStart, timelineEnd);
	$: timeScale = createTimeScale(bounds.start, bounds.end, viewMode);
	$: markers = generateTimeMarkers(timeScale, viewMode);
	$: todayX = dateToX(timeScale.scale, new Date());
	$: totalHeight = calculateTotalHeight(phaseGroups);
	$: overallProgress = calculateOverallProgress(activities, milestones);
	$: onTrack = isOnTrack(activities, milestones);
	$: rowPositions = calculateRowPositions(phaseGroups);

	function calculateRowPositions(groups: PhaseGroup[]): Map<string, number> {
		const positions = new Map<string, number>();
		let currentY = 0;
		for (const group of groups) {
			positions.set(`phase:${group.phase}`, currentY);
			currentY += PHASE_ROW_HEIGHT;
			if (!group.collapsed) {
				for (const activity of group.activities) {
					positions.set(`activity:${activity.id}`, currentY);
					currentY += ROW_HEIGHT;
				}
				for (const milestone of group.milestones) {
					positions.set(`milestone:${milestone.id}`, currentY);
					currentY += ROW_HEIGHT;
				}
			}
		}
		return positions;
	}

	function togglePhase(phase: string): void {
		const newSet = new Set(expandedPhases);
		if (newSet.has(phase)) newSet.delete(phase);
		else newSet.add(phase);
		expandedPhases = newSet;
	}

	function scrollToToday(): void {
		const container = document.getElementById('gantt-scroll-container');
		if (!container) return;
		container.scrollTo({ left: Math.max(0, todayX - container.clientWidth / 2), behavior: 'smooth' });
	}

	function handleDependencyDragStart(activityId: string): void {
		depDragSourceId = activityId;
	}

	function handleDependencyDragEnd(activityId: string): void {
		if (depDragSourceId && depDragSourceId !== activityId && onDependencyCreate) {
			onDependencyCreate(depDragSourceId, activityId);
		}
		depDragSourceId = null;
	}
</script>

<div class="rounded-xl border border-gray-200 bg-white shadow-sm">
	<!-- Toolbar -->
	<div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
		<div class="flex items-center gap-3">
			<h3 class="text-sm font-semibold text-gray-900">Projecttijdlijn</h3>
			<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {onTrack ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}">
				{overallProgress}% gereed
				{#if !onTrack}· Achter op schema{/if}
			</span>
			{#if showCriticalPath && criticalPathIds.size > 0}
				<span class="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
					{criticalPathIds.size} kritiek
				</span>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			<div class="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
				{#each VIEW_MODE_OPTIONS as item (item.mode)}
					<button
						type="button"
						on:click={() => { viewMode = item.mode; }}
						class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors
							{viewMode === item.mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
					>
						{item.label}
					</button>
				{/each}
			</div>
			<button type="button" on:click={scrollToToday}
				class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
				Vandaag
			</button>
		</div>
	</div>

	<!-- Chart container -->
	<div class="flex">
		<div class="shrink-0 border-r border-gray-200 bg-gray-50" style="width: {LEFT_PANEL_WIDTH}px;">
			<div class="border-b border-gray-300 bg-gray-50" style="height: {HEADER_HEIGHT}px;">
				<div class="flex h-full items-center px-3">
					<span class="text-xs font-medium text-gray-500">Fasen & activiteiten</span>
				</div>
			</div>
			<GanttRow {phaseGroups} {criticalPathIds} {showCriticalPath} onTogglePhase={togglePhase} />
		</div>

		<GanttTimeline
			{phaseGroups} {markers} {viewMode} scale={timeScale.scale}
			totalWidth={timeScale.totalWidth} {totalHeight} {todayX} {rowPositions}
			{activities} {milestones} {dependencies} {readonly}
			{criticalPathIds} {nodeFloats} {showCriticalPath}
			{onActivityUpdate} {onMilestoneClick}
			onDependencyDragStart={handleDependencyDragStart} onDependencyDragEnd={handleDependencyDragEnd}
		/>
	</div>

	<!-- Footer legend -->
	<div class="flex items-center gap-4 border-t border-gray-200 px-4 py-2">
		<span class="text-[10px] text-gray-500">Legenda:</span>
		{#each phaseGroups as group (group.phase)}
			<span class="flex items-center gap-1">
				<span class="h-2 w-4 rounded-sm" style="background-color: {PHASE_COLORS[group.phase]}; opacity: 0.6;"></span>
				<span class="text-[10px] text-gray-500">{group.label}</span>
			</span>
		{/each}
		<span class="flex items-center gap-1">
			<svg class="h-3 w-3 text-gray-500" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="8,1 15,8 8,15 1,8" /></svg>
			<span class="text-[10px] text-gray-500">Milestone</span>
		</span>
		<span class="flex items-center gap-1">
			<span class="h-2 w-[2px] bg-red-500"></span>
			<span class="text-[10px] text-gray-500">Vandaag</span>
		</span>
		{#if showCriticalPath && criticalPathIds.size > 0}
			<span class="flex items-center gap-1">
				<span class="h-2 w-4 rounded-sm border-2 border-red-500 bg-red-50"></span>
				<span class="text-[10px] text-red-600">Kritiek pad</span>
			</span>
		{/if}
	</div>
</div>
