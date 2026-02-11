<!-- GanttHeader — Time axis for the Gantt chart (days/weeks/months) -->
<script lang="ts">
	import type { TimeMarker } from './gantt-utils';
	import { GANTT_CONSTANTS } from './gantt-utils';

	export let markers: TimeMarker[];
	export let totalWidth: number;
	export let viewMode: 'day' | 'week' | 'month';

	const { HEADER_HEIGHT } = GANTT_CONSTANTS;

	function getColumnWidth(): number {
		switch (viewMode) {
			case 'day':
				return 32;
			case 'week':
				return 56;
			case 'month':
				return 75;
		}
	}
</script>

<div
	class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50"
	style="height: {HEADER_HEIGHT}px; width: {totalWidth}px;"
>
	<svg
		width={totalWidth}
		height={HEADER_HEIGHT}
		class="overflow-visible"
		aria-hidden="true"
	>
		<!-- Month labels (top row) -->
		{#each markers.filter((m) => m.isMonth) as marker (marker.date.toISOString())}
			<text
				x={marker.x + 4}
				y={16}
				class="fill-gray-700 text-[11px] font-semibold"
			>
				{marker.label}
			</text>
			<line
				x1={marker.x}
				y1={0}
				x2={marker.x}
				y2={HEADER_HEIGHT}
				stroke="#d1d5db"
				stroke-width="1"
			/>
		{/each}

		<!-- Day/week labels (bottom row) -->
		{#each markers.filter((m) => !m.isMonth) as marker (marker.date.toISOString())}
			{@const isWeekend = marker.date.getDay() === 0 || marker.date.getDay() === 6}
			<text
				x={marker.x + 4}
				y={38}
				class="text-[10px] {isWeekend && viewMode === 'day' ? 'fill-gray-300' : 'fill-gray-500'}"
			>
				{marker.label}
			</text>
			{#if viewMode === 'day'}
				<line
					x1={marker.x}
					y1={24}
					x2={marker.x}
					y2={HEADER_HEIGHT}
					stroke="#e5e7eb"
					stroke-width="0.5"
				/>
			{/if}
		{/each}
	</svg>
</div>
