<!-- GanttRow — Left panel: phase toggle buttons + activity/milestone label rows -->
<script lang="ts">
	import type { PhaseGroup } from './gantt-types';
	import { GANTT_CONSTANTS, PHASE_COLORS } from './gantt-types';

	export let phaseGroups: (PhaseGroup & { collapsed: boolean })[];
	export let criticalPathIds: Set<string> = new Set();
	export let showCriticalPath: boolean = true;
	export let onTogglePhase: (phase: string) => void;

	const { ROW_HEIGHT, PHASE_ROW_HEIGHT } = GANTT_CONSTANTS;

	function isActivityCritical(activityId: string): boolean {
		return showCriticalPath && criticalPathIds.has(activityId);
	}
</script>

<div>
	{#each phaseGroups as group (group.phase)}
		<button
			type="button"
			on:click={() => onTogglePhase(group.phase)}
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
