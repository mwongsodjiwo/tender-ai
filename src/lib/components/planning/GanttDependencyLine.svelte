<!-- GanttDependencyLine — SVG arrow between dependent items in the Gantt chart -->
<script lang="ts">
	import type { DependencyType } from '$types';
	import { calculateDependencyPath } from './gantt-layout';

	export let sourceX: number;
	export let sourceY: number;
	export let targetX: number;
	export let targetY: number;
	export let isCritical: boolean = false;
	export let dependencyType: DependencyType = 'finish_to_start';

	$: path = calculateDependencyPath(sourceX, sourceY, targetX, targetY);
	$: strokeColor = isCritical ? '#ef4444' : '#94a3b8';
	$: strokeWidth = isCritical ? 2 : 1;
	// Dash style for non-standard dependency types
	$: strokeDash = dependencyType === 'finish_to_start' ? 'none' : '4 2';
</script>

<g class="dependency-line" class:opacity-60={!isCritical}>
	<!-- Arrow path -->
	<path
		d={path}
		fill="none"
		stroke={strokeColor}
		stroke-width={strokeWidth}
		stroke-dasharray={strokeDash}
		marker-end="url(#gantt-arrowhead{isCritical ? '-critical' : ''})"
	/>
</g>
