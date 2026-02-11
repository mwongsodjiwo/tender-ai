<!-- GanttPhaseRow — Collapsible phase group row for the Gantt chart -->
<script lang="ts">
	import type { PhaseGroup } from './gantt-utils';
	import {
		GANTT_CONSTANTS,
		PHASE_COLORS,
		PHASE_BG_COLORS,
		calculateBarPosition,
		dateToX
	} from './gantt-utils';
	import type { ScaleTime } from 'd3-scale';

	export let group: PhaseGroup;
	export let y: number;
	export let scale: ScaleTime<number, number>;
	export let totalWidth: number;
	export let onToggle: (phase: string) => void;

	const { PHASE_ROW_HEIGHT } = GANTT_CONSTANTS;

	$: color = PHASE_COLORS[group.phase];
	$: bgColor = PHASE_BG_COLORS[group.phase];

	// Calculate phase span bar
	$: phaseBarX = group.startDate ? dateToX(scale, group.startDate) : 0;
	$: phaseBarEndX = group.endDate ? dateToX(scale, group.endDate) : 0;
	$: phaseBarWidth = group.startDate && group.endDate
		? Math.max(phaseBarEndX - phaseBarX, 4)
		: 0;
	$: progressWidth = phaseBarWidth * (group.progress / 100);

	function handleClick(): void {
		onToggle(group.phase);
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClick();
		}
	}
</script>

<!-- Phase row background -->
<rect
	x="0"
	y={y}
	width={totalWidth}
	height={PHASE_ROW_HEIGHT}
	fill={bgColor}
	opacity="0.3"
/>

<!-- Phase summary bar (full span of all activities/milestones) -->
{#if phaseBarWidth > 0}
	<!-- Background bar -->
	<rect
		x={phaseBarX}
		y={y + 8}
		width={phaseBarWidth}
		height={PHASE_ROW_HEIGHT - 16}
		rx="4"
		fill="{color}30"
		stroke={color}
		stroke-width="1"
	/>

	<!-- Progress fill -->
	{#if group.progress > 0}
		<rect
			x={phaseBarX}
			y={y + 8}
			width={Math.min(progressWidth, phaseBarWidth)}
			height={PHASE_ROW_HEIGHT - 16}
			rx="4"
			fill={color}
			opacity="0.5"
		/>
	{/if}

	<!-- Progress text -->
	{#if phaseBarWidth > 40}
		<text
			x={phaseBarX + 8}
			y={y + PHASE_ROW_HEIGHT / 2 + 4}
			class="pointer-events-none fill-current text-[11px] font-medium"
			style="fill: {color};"
		>
			{group.progress}%
		</text>
	{/if}
{/if}
