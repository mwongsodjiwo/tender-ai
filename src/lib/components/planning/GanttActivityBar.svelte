<!-- GanttActivityBar — Draggable activity bar with critical path highlighting -->
<script lang="ts">
	import type { PhaseActivity } from '$types';
	import { ACTIVITY_STATUS_LABELS } from '$types';
	import {
		PHASE_COLORS,
		GANTT_CONSTANTS,
		formatDateShort,
		getActivityDuration,
		dateToX,
		xToDate,
		snapToDay,
		daysBetween
	} from './gantt-utils';
	import type { ScaleTime } from 'd3-scale';

	export let activity: PhaseActivity;
	export let scale: ScaleTime<number, number>;
	export let y: number;
	export let readonly: boolean = false;
	export let isCritical: boolean = false;
	export let totalFloat: number | null = null;
	export let onActivityUpdate: ((id: string, changes: Partial<PhaseActivity>) => void) | undefined = undefined;
	export let onDependencyDragStart: ((activityId: string) => void) | undefined = undefined;
	export let onDependencyDragEnd: ((activityId: string) => void) | undefined = undefined;

	const { ROW_HEIGHT, MIN_BAR_WIDTH } = GANTT_CONSTANTS;
	const BAR_HEIGHT = 24;
	const BAR_OFFSET_Y = (ROW_HEIGHT - BAR_HEIGHT) / 2;
	const CONNECTOR_SIZE = 8;

	$: color = PHASE_COLORS[activity.phase];
	$: strokeColor = isCritical ? '#ef4444' : (isCompleted ? '#10b981' : color);
	$: strokeWidth = isCritical ? 2 : 1;
	$: hasPlannedDates = Boolean(activity.planned_start && activity.planned_end);
	$: barX = hasPlannedDates ? dateToX(scale, new Date(activity.planned_start!)) : 0;
	$: barEndX = hasPlannedDates ? dateToX(scale, new Date(activity.planned_end!)) : 0;
	$: barWidth = hasPlannedDates ? Math.max(barEndX - barX, MIN_BAR_WIDTH) : 0;
	$: progressWidth = barWidth * (activity.progress_percentage / 100);
	$: isCompleted = activity.status === 'completed';
	$: duration = getActivityDuration(activity);
	$: displayX = hasPlannedDates ? barX + (isDragging ? dragPixelOffset : 0) : 0;
	$: floatLabel = totalFloat !== null ? `${totalFloat} ${totalFloat === 1 ? 'dag' : 'dagen'} speling` : null;

	let isDragging = false;
	let dragStartX = 0;
	let dragOffsetDays = 0;
	let dragPixelOffset = 0;
	let showTooltip = false;
	let showConnectors = false;

	function handlePointerDown(event: PointerEvent): void {
		if (readonly || !hasPlannedDates) return;
		isDragging = true;
		dragStartX = event.clientX;
		dragOffsetDays = 0;
		dragPixelOffset = 0;
		(event.target as SVGElement).setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent): void {
		if (!isDragging) return;
		const deltaX = event.clientX - dragStartX;
		dragPixelOffset = deltaX;
		const originalDate = new Date(activity.planned_start!);
		const newDate = xToDate(scale, barX + deltaX);
		dragOffsetDays = daysBetween(originalDate, snapToDay(newDate));
	}

	function handlePointerUp(): void {
		if (!isDragging) return;
		isDragging = false;
		dragPixelOffset = 0;
		if (dragOffsetDays === 0 || !onActivityUpdate) return;
		const newStart = new Date(activity.planned_start!);
		newStart.setDate(newStart.getDate() + dragOffsetDays);
		const newEnd = new Date(activity.planned_end!);
		newEnd.setDate(newEnd.getDate() + dragOffsetDays);
		onActivityUpdate(activity.id, {
			planned_start: newStart.toISOString().split('T')[0],
			planned_end: newEnd.toISOString().split('T')[0]
		});
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Enter' || event.key === ' ') showTooltip = !showTooltip;
	}

	function handleConnectorPointerDown(event: PointerEvent): void {
		event.stopPropagation();
		if (onDependencyDragStart) onDependencyDragStart(activity.id);
	}

	function handleConnectorPointerUp(event: PointerEvent): void {
		event.stopPropagation();
		if (onDependencyDragEnd) onDependencyDragEnd(activity.id);
	}
</script>

{#if hasPlannedDates}
	<g
		class="activity-bar {readonly ? '' : 'cursor-grab'} {isDragging ? 'cursor-grabbing' : ''}"
		role="button"
		tabindex="0"
		aria-label="{activity.title}{isCritical ? ' (kritiek pad)' : ''} — {formatDateShort(new Date(activity.planned_start!))} t/m {formatDateShort(new Date(activity.planned_end!))}"
		on:mouseenter={() => { showTooltip = true; showConnectors = true; }}
		on:mouseleave={() => { if (!isDragging) { showTooltip = false; showConnectors = false; } }}
		on:keydown={handleKeyDown}
	>
		<!-- Background bar -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<rect
			x={displayX}
			y={y + BAR_OFFSET_Y}
			width={barWidth}
			height={BAR_HEIGHT}
			rx="4"
			fill={isCompleted ? '#d1fae5' : `${color}20`}
			stroke={strokeColor}
			stroke-width={strokeWidth}
			class="transition-colors"
			on:pointerdown={handlePointerDown}
			on:pointermove={handlePointerMove}
			on:pointerup={handlePointerUp}
		/>

		<!-- Progress fill -->
		{#if activity.progress_percentage > 0}
			<rect
				x={displayX}
				y={y + BAR_OFFSET_Y}
				width={Math.min(progressWidth, barWidth)}
				height={BAR_HEIGHT}
				rx="4"
				fill={isCompleted ? '#10b981' : color}
				opacity={isCompleted ? 0.8 : 0.6}
				class="pointer-events-none"
			/>
		{/if}

		<!-- Activity title (inside bar if wide enough) -->
		{#if barWidth > 60}
			<text
				x={displayX + 6}
				y={y + BAR_OFFSET_Y + 16}
				class="pointer-events-none fill-current text-[11px] {activity.progress_percentage > 50 ? 'text-white' : 'text-gray-700'}"
			>
				{activity.title.length > Math.floor(barWidth / 7) ? activity.title.slice(0, Math.floor(barWidth / 7)) + '...' : activity.title}
			</text>
		{/if}

		<!-- Critical path badge -->
		{#if isCritical}
			<text
				x={displayX + barWidth + 6}
				y={y + BAR_OFFSET_Y + 10}
				class="pointer-events-none fill-red-500 text-[9px] font-semibold"
			>
				Kritiek pad
			</text>
		{:else if activity.progress_percentage > 0 && activity.progress_percentage < 100}
			<text
				x={displayX + barWidth + 6}
				y={y + BAR_OFFSET_Y + 16}
				class="pointer-events-none fill-gray-400 text-[10px]"
			>
				{activity.progress_percentage}%
			</text>
		{/if}

		<!-- Dependency connectors (shown on hover) -->
		{#if showConnectors && !readonly && !isDragging}
			<!-- Right connector (source: drag from here) -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<circle
				cx={displayX + barWidth}
				cy={y + BAR_OFFSET_Y + BAR_HEIGHT / 2}
				r={CONNECTOR_SIZE / 2}
				fill="#3b82f6"
				stroke="white"
				stroke-width="1.5"
				class="cursor-crosshair"
				on:pointerdown={handleConnectorPointerDown}
			/>
			<!-- Left connector (target: drop here) -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<circle
				cx={displayX}
				cy={y + BAR_OFFSET_Y + BAR_HEIGHT / 2}
				r={CONNECTOR_SIZE / 2}
				fill="#94a3b8"
				stroke="white"
				stroke-width="1.5"
				class="cursor-crosshair"
				on:pointerup={handleConnectorPointerUp}
			/>
		{/if}

		<!-- Tooltip -->
		{#if showTooltip}
			<foreignObject
				x={displayX + barWidth + 8}
				y={y - 10}
				width="260"
				height={isCritical || floatLabel ? 110 : 90}
				class="pointer-events-none overflow-visible"
			>
				<div class="rounded-lg border {isCritical ? 'border-red-300' : 'border-gray-200'} bg-white px-3 py-2 shadow-lg">
					<p class="text-xs font-semibold text-gray-900">{activity.title}</p>
					<p class="mt-0.5 text-[10px] text-gray-500">
						{formatDateShort(new Date(activity.planned_start!))} — {formatDateShort(new Date(activity.planned_end!))}
						({duration} {duration === 1 ? 'dag' : 'dagen'})
					</p>
					<p class="mt-0.5 text-[10px] text-gray-500">
						{ACTIVITY_STATUS_LABELS[activity.status]}
						{#if activity.progress_percentage > 0}
							&middot; {activity.progress_percentage}% gereed
						{/if}
					</p>
					{#if activity.estimated_hours}
						<p class="mt-0.5 text-[10px] text-gray-400">~{activity.estimated_hours} uur geschat</p>
					{/if}
					{#if isCritical}
						<p class="mt-0.5 text-[10px] font-medium text-red-600">Kritiek pad &mdash; geen speling</p>
					{:else if floatLabel}
						<p class="mt-0.5 text-[10px] text-blue-600">{floatLabel}</p>
					{/if}
					{#if isDragging && dragOffsetDays !== 0}
						<p class="mt-0.5 text-[10px] font-medium text-primary-600">
							{dragOffsetDays > 0 ? '+' : ''}{dragOffsetDays} {Math.abs(dragOffsetDays) === 1 ? 'dag' : 'dagen'}
						</p>
					{/if}
				</div>
			</foreignObject>
		{/if}
	</g>
{:else}
	<g class="opacity-40">
		<text x="4" y={y + ROW_HEIGHT / 2 + 4} class="fill-gray-400 text-[10px] italic">
			{activity.title} (geen planning)
		</text>
	</g>
{/if}
