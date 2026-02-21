<!-- GanttTimeline — Right panel: SVG timeline with bars, milestones, dependencies -->
<script lang="ts">
	import type { PhaseActivity, Milestone, ActivityDependency } from '$types';
	import type { PhaseGroup } from './gantt-types';
	import { GANTT_CONSTANTS } from './gantt-types';
	import { dateToX, calculateMilestoneX } from './gantt-layout';
	import GanttHeader from './GanttHeader.svelte';
	import GanttPhaseRow from './GanttPhaseRow.svelte';
	import GanttActivityBar from './GanttActivityBar.svelte';
	import GanttMilestoneMarker from './GanttMilestoneMarker.svelte';
	import GanttDependencyLine from './GanttDependencyLine.svelte';
	import GanttTodayLine from './GanttTodayLine.svelte';
	import type { ScaleTime } from 'd3-scale';
	import type { TimeMarker, ViewMode } from './gantt-types';

	export let phaseGroups: (PhaseGroup & { collapsed: boolean })[];
	export let markers: TimeMarker[];
	export let viewMode: ViewMode;
	export let scale: ScaleTime<number, number>;
	export let totalWidth: number;
	export let totalHeight: number;
	export let todayX: number;
	export let rowPositions: Map<string, number>;
	export let activities: PhaseActivity[];
	export let milestones: Milestone[];
	export let dependencies: ActivityDependency[];
	export let readonly: boolean;
	export let criticalPathIds: Set<string>;
	export let nodeFloats: Map<string, number>;
	export let showCriticalPath: boolean;
	export let onActivityUpdate: ((id: string, changes: Partial<PhaseActivity>) => void) | undefined = undefined;
	export let onMilestoneClick: ((milestone: Milestone) => void) | undefined = undefined;
	export let onDependencyDragStart: (activityId: string) => void;
	export let onDependencyDragEnd: (activityId: string) => void;

	const { ROW_HEIGHT } = GANTT_CONSTANTS;

	function isActivityCritical(activityId: string): boolean {
		return showCriticalPath && criticalPathIds.has(activityId);
	}

	function getActivityFloat(activityId: string): number | null {
		if (!showCriticalPath) return null;
		return nodeFloats.get(activityId) ?? null;
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
			if (act?.planned_end) sourceX = dateToX(scale, new Date(act.planned_end));
		} else {
			const ms = milestones.find((m) => m.id === dep.source_id);
			if (ms) sourceX = calculateMilestoneX(scale, ms.target_date);
		}

		let targetX = 0;
		if (dep.target_type === 'activity') {
			const act = activities.find((a) => a.id === dep.target_id);
			if (act?.planned_start) targetX = dateToX(scale, new Date(act.planned_start));
		} else {
			const ms = milestones.find((m) => m.id === dep.target_id);
			if (ms) targetX = calculateMilestoneX(scale, ms.target_date);
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
</script>

<div id="gantt-scroll-container" class="flex-1 overflow-x-auto overflow-y-hidden" role="img" aria-label="Gantt-tijdlijn voor het project">
	<GanttHeader {markers} {totalWidth} {viewMode} />
	<div class="relative" style="width: {totalWidth}px; height: {totalHeight}px;">
		<svg width={totalWidth} height={totalHeight} class="overflow-visible">
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
				<GanttPhaseRow {group} y={phaseY} {scale} {totalWidth} onToggle={() => {}} />

				{#if !group.collapsed}
					{#each group.activities as activity (activity.id)}
						{@const actY = rowPositions.get(`activity:${activity.id}`) ?? 0}
						<rect x="0" y={actY} width={totalWidth} height={ROW_HEIGHT} fill={actY % (ROW_HEIGHT * 2) === 0 ? '#ffffff' : '#fafafa'} />
						<GanttActivityBar
							{activity}
							{scale}
							y={actY}
							{readonly}
							isCritical={isActivityCritical(activity.id)}
							totalFloat={getActivityFloat(activity.id)}
							{onActivityUpdate}
							{onDependencyDragStart}
							{onDependencyDragEnd}
						/>
					{/each}
					{#each group.milestones as milestone (milestone.id)}
						{@const msY = rowPositions.get(`milestone:${milestone.id}`) ?? 0}
						<rect x="0" y={msY} width={totalWidth} height={ROW_HEIGHT} fill={msY % (ROW_HEIGHT * 2) === 0 ? '#ffffff' : '#fafafa'} />
						<GanttMilestoneMarker {milestone} x={calculateMilestoneX(scale, milestone.target_date)} y={msY + ROW_HEIGHT / 2} {onMilestoneClick} />
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
