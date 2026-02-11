<!-- GanttTodayLine — Vertical red "today" line on the Gantt chart -->
<script lang="ts">
	export let x: number;
	export let height: number;
</script>

{#if x >= 0}
	<div
		class="pointer-events-none absolute top-0 z-20"
		style="left: {x}px; height: {height}px;"
	>
		<!-- Triangle marker at top -->
		<div class="absolute -top-1 -translate-x-1/2">
			<svg width="10" height="8" viewBox="0 0 10 8" aria-hidden="true">
				<polygon points="0,0 10,0 5,8" fill="#ef4444" />
			</svg>
		</div>

		<!-- Vertical line -->
		<div
			class="absolute left-1/2 top-0 w-[2px] -translate-x-1/2 bg-red-500"
			style="height: {height}px;"
		></div>
	</div>
{/if}
