<!-- GanttChart — Main container with critical path and dependency creation -->
<script lang="ts">
	import type { PhaseActivity, Milestone, ActivityDependency } from '$types';
	import GanttHeader from './GanttHeader.svelte';
	import GanttPhaseRow from './GanttPhaseRow.svelte';
	import GanttActivityBar from './GanttActivityBar.svelte';
	import GanttMilestoneMarker from './GanttMilestoneMarker.svelte';
	import GanttDependencyLine from './GanttDependencyLine.svelte';
	import GanttTodayLine from './GanttTodayLine.svelte';
	import {
		type ViewMode,
		type PhaseGroup,
		createTimeScale,
		generateTimeMarkers,
		groupByPhase,
		calculateTimelineBounds,
		calculateTotalHeight,
		dateToX,
		calculateMilestoneX,
		calculateOverallProgress,
		isOnTrack,
		GANTT_CONSTANTS,
		PHASE_COLORS
	} from './gantt-utils';

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

	const { ROW_HEIGHT, PHASE_ROW_HEIGHT, HEADER_HEIGHT, LEFT_PANEL_WIDTH } = GANTT_CONSTANTS;

	let viewMode: ViewMode = 'week';
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

	function getDependencyCoords(dep: ActivityDependency): {
		sourceX: number; sourceY: number; targetX: number; targetY: number; isCritical: boolean;
	} | null {
		const sourceY = rowPositions.get(`${dep.source_type}:${dep.source_id}`);
		const targetY = rowPositions.get(`${dep.target_type}:${dep.target_id}`);
		if (sourceY === undefined || targetY === undefined) return null;

		let sourceX = 0;
		if (dep.source_type === 'activity') {
			const act = activities.find((a) => a.id === dep.source_id);
			if (act?.planned_end) sourceX = dateToX(timeScale.scale, new Date(act.planned_end));
		} else {
			const ms = milestones.find((m) => m.id === dep.source_id);
			if (ms) sourceX = calculateMilestoneX(timeScale.scale, ms.target_date);
		}

		let targetX = 0;
		if (dep.target_type === 'activity') {
			const act = activities.find((a) => a.id === dep.target_id);
			if (act?.planned_start) targetX = dateToX(timeScale.scale, new Date(act.planned_start));
		} else {
			const ms = milestones.find((m) => m.id === dep.target_id);
			if (ms) targetX = calculateMilestoneX(timeScale.scale, ms.target_date);
		}

		if (sourceX === 0 && targetX === 0) return null;

		const bothCritical = showCriticalPath
			&& criticalPathIds.has(dep.source_id)
			&& criticalPathIds.has(dep.target_id);

		return {
			sourceX,
			sourceY: sourceY + ROW_HEIGHT / 2,
			targetX,
			targetY: targetY + ROW_HEIGHT / 2,
			isCritical: bothCritical
		};
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

	function isActivityCritical(activityId: string): boolean {
		return showCriticalPath && criticalPathIds.has(activityId);
	}

	function getActivityFloat(activityId: string): number | null {
		if (!showCriticalPath) return null;
		return nodeFloats.get(activityId) ?? null;
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
				{#each ([{ mode: 'day' as ViewMode, label: 'Dag' }, { mode: 'week' as ViewMode, label: 'Week' }, { mode: 'month' as ViewMode, label: 'Maand' }]) as item (item.mode)}
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
			<button
				type="button"
				on:click={scrollToToday}
				class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
			>
				Vandaag
			</button>
		</div>
	</div>

	<!-- Chart container -->
	<div class="flex">
		<!-- Left panel -->
		<div class="shrink-0 border-r border-gray-200 bg-gray-50" style="width: {LEFT_PANEL_WIDTH}px;">
			<div class="border-b border-gray-300 bg-gray-50" style="height: {HEADER_HEIGHT}px;">
				<div class="flex h-full items-center px-3">
					<span class="text-xs font-medium text-gray-500">Fasen & activiteiten</span>
				</div>
			</div>
			<div>
				{#each phaseGroups as group (group.phase)}
					<button
						type="button"
						on:click={() => togglePhase(group.phase)}
						class="flex w-full items-center gap-2 border-b border-gray-100 px-3 text-left transition-colors hover:bg-gray-100"
						style="height: {PHASE_ROW_HEIGHT}px;"
						aria-expanded={!group.collapsed}
						aria-label="{group.collapsed ? 'Uitklappen' : 'Inklappen'}: {group.label}"
					>
						<svg class="h-3.5 w-3.5 shrink-0 text-gray-500 transition-transform {group.collapsed ? '' : 'rotate-90'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
						<span class="h-2.5 w-2.5 shrink-0 rounded-full" style="background-color: {PHASE_COLORS[group.phase]};"></span>
						<span class="truncate text-xs font-semibold text-gray-700">{group.label}</span>
						<span class="ml-auto text-[10px] text-gray-500">{group.activities.length + group.milestones.length}</span>
					</button>
					{#if !group.collapsed}
						{#each group.activities as activity (activity.id)}
							<div class="flex items-center border-b border-gray-50 px-3 pl-9" style="height: {ROW_HEIGHT}px;">
								{#if isActivityCritical(activity.id)}
									<span class="mr-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" title="Kritiek pad"></span>
								{/if}
								<span class="truncate text-[11px] text-gray-600" title={activity.title}>{activity.title}</span>
							</div>
						{/each}
						{#each group.milestones as milestone (milestone.id)}
							<div class="flex items-center gap-1.5 border-b border-gray-50 px-3 pl-9" style="height: {ROW_HEIGHT}px;">
								<svg class="h-3 w-3 shrink-0 text-gray-500" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
									<polygon points="8,1 15,8 8,15 1,8" />
								</svg>
								<span class="truncate text-[11px] text-gray-600" title={milestone.title}>{milestone.title}</span>
							</div>
						{/each}
					{/if}
				{/each}
			</div>
		</div>

		<!-- Right panel -->
		<div id="gantt-scroll-container" class="flex-1 overflow-x-auto overflow-y-hidden" role="img" aria-label="Gantt-tijdlijn voor het project">
			<GanttHeader {markers} totalWidth={timeScale.totalWidth} {viewMode} />
			<div class="relative" style="width: {timeScale.totalWidth}px; height: {totalHeight}px;">
				<svg width={timeScale.totalWidth} height={totalHeight} class="overflow-visible">
					<defs>
						<marker id="gantt-arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
							<polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
						</marker>
						<marker id="gantt-arrowhead-critical" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
							<polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
						</marker>
					</defs>

					{#each phaseGroups as group (group.phase)}
						{@const phaseY = rowPositions.get(`phase:${group.phase}`) ?? 0}
						<GanttPhaseRow {group} y={phaseY} scale={timeScale.scale} totalWidth={timeScale.totalWidth} onToggle={togglePhase} />

						{#if !group.collapsed}
							{#each group.activities as activity (activity.id)}
								{@const actY = rowPositions.get(`activity:${activity.id}`) ?? 0}
								<rect x="0" y={actY} width={timeScale.totalWidth} height={ROW_HEIGHT} fill={actY % (ROW_HEIGHT * 2) === 0 ? '#ffffff' : '#fafafa'} />
								<GanttActivityBar
									{activity}
									scale={timeScale.scale}
									y={actY}
									{readonly}
									isCritical={isActivityCritical(activity.id)}
									totalFloat={getActivityFloat(activity.id)}
									{onActivityUpdate}
									onDependencyDragStart={handleDependencyDragStart}
									onDependencyDragEnd={handleDependencyDragEnd}
								/>
							{/each}
							{#each group.milestones as milestone (milestone.id)}
								{@const msY = rowPositions.get(`milestone:${milestone.id}`) ?? 0}
								<rect x="0" y={msY} width={timeScale.totalWidth} height={ROW_HEIGHT} fill={msY % (ROW_HEIGHT * 2) === 0 ? '#ffffff' : '#fafafa'} />
								<GanttMilestoneMarker {milestone} x={calculateMilestoneX(timeScale.scale, milestone.target_date)} y={msY + ROW_HEIGHT / 2} {onMilestoneClick} />
							{/each}
						{/if}
					{/each}

					{#each dependencies as dep (dep.id)}
						{@const coords = getDependencyCoords(dep)}
						{#if coords}
							<GanttDependencyLine sourceX={coords.sourceX} sourceY={coords.sourceY} targetX={coords.targetX} targetY={coords.targetY} isCritical={coords.isCritical} dependencyType={dep.dependency_type} />
						{/if}
					{/each}
				</svg>
				<GanttTodayLine x={todayX} height={totalHeight} />
			</div>
		</div>
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
