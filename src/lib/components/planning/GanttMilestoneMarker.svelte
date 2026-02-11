<!-- GanttMilestoneMarker — Diamond marker for milestones on the Gantt chart -->
<script lang="ts">
	import type { Milestone } from '$types';
	import { MILESTONE_TYPE_LABELS, ACTIVITY_STATUS_LABELS } from '$types';
	import { PHASE_COLORS, formatDateFull, getDaysRemaining } from './gantt-utils';
	import type { ProjectPhase } from '$types';

	export let milestone: Milestone;
	export let x: number;
	export let y: number;
	export let onMilestoneClick: ((milestone: Milestone) => void) | undefined = undefined;

	$: color = milestone.phase ? PHASE_COLORS[milestone.phase] : '#6b7280';
	$: isCompleted = milestone.status === 'completed';
	$: daysRemaining = getDaysRemaining(milestone.target_date);
	$: isOverdue = daysRemaining < 0 && !isCompleted;

	let showTooltip = false;

	function handleClick(): void {
		if (onMilestoneClick) {
			onMilestoneClick(milestone);
		}
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClick();
		}
	}
</script>

<g
	class="cursor-pointer"
	transform="translate({x}, {y})"
	role="button"
	tabindex="0"
	aria-label="{milestone.title} — {formatDateFull(new Date(milestone.target_date))}"
	on:click={handleClick}
	on:keydown={handleKeyDown}
	on:mouseenter={() => { showTooltip = true; }}
	on:mouseleave={() => { showTooltip = false; }}
>
	<!-- Diamond shape -->
	<polygon
		points="0,-8 8,0 0,8 -8,0"
		fill={isCompleted ? '#10b981' : isOverdue ? '#ef4444' : color}
		stroke={isCompleted ? '#059669' : isOverdue ? '#dc2626' : '#374151'}
		stroke-width="1.5"
		class="transition-colors"
	/>

	<!-- Critical star indicator -->
	{#if milestone.is_critical}
		<circle
			cx="0"
			cy="-14"
			r="3"
			fill="#f59e0b"
		/>
	{/if}

	<!-- Completed checkmark -->
	{#if isCompleted}
		<path
			d="M-3,0 L-1,2 L3,-2"
			fill="none"
			stroke="white"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	{/if}

	<!-- Tooltip -->
	{#if showTooltip}
		<foreignObject x="12" y="-40" width="220" height="80" class="pointer-events-none overflow-visible">
			<div class="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
				<p class="text-xs font-semibold text-gray-900">{milestone.title}</p>
				<p class="mt-0.5 text-[10px] text-gray-500">
					{MILESTONE_TYPE_LABELS[milestone.milestone_type]} · {formatDateFull(new Date(milestone.target_date))}
				</p>
				<p class="mt-0.5 text-[10px] {isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}">
					{ACTIVITY_STATUS_LABELS[milestone.status]}
					{#if !isCompleted}
						· {isOverdue ? `${Math.abs(daysRemaining)} dagen verlopen` : `nog ${daysRemaining} dagen`}
					{/if}
				</p>
			</div>
		</foreignObject>
	{/if}
</g>
