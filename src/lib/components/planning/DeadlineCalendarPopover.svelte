<!-- DeadlineCalendarPopover — Day detail popover with deadline items -->
<script lang="ts">
	import type { DeadlineItem } from '$types';
	import { PROJECT_PHASE_LABELS } from '$types';
	import { getDotColor, formatPopoverDate, formatDaysLabel } from './deadline-calendar-helpers';

	export let popoverDate: string;
	export let items: DeadlineItem[];
	export let popoverX: number;
	export let popoverY: number;
	export let onClose: () => void;
	export let onItemClick: ((item: DeadlineItem) => void) | undefined = undefined;
</script>

<svelte:window on:keydown={(e) => { if (e.key === 'Escape') onClose(); }} />

<!-- Backdrop -->
<button
	type="button"
	class="fixed inset-0 z-40"
	on:click={onClose}
	aria-label="Sluiten"
></button>

<div
	class="fixed z-50 w-80 rounded-lg border border-gray-200 bg-white shadow-lg"
	style="left: {Math.min(popoverX, window.innerWidth - 340)}px; top: {Math.min(popoverY, window.innerHeight - 300)}px"
	role="dialog"
	aria-label="Deadlines op {formatPopoverDate(popoverDate)}"
>
	<div class="border-b border-gray-100 px-4 py-2.5">
		<p class="text-sm font-semibold capitalize text-gray-900">
			{formatPopoverDate(popoverDate)}
		</p>
	</div>
	<div class="max-h-60 overflow-y-auto p-2">
		{#each items as item (item.id)}
			<button
				type="button"
				on:click={() => onItemClick?.(item)}
				class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-gray-50"
			>
				<span class="inline-block h-2 w-2 shrink-0 rounded-full {getDotColor(item)}"></span>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-medium text-gray-900">{item.title}</p>
					<p class="text-xs text-gray-500">
						{item.type === 'milestone' ? 'Milestone' : 'Activiteit'}
						· {PROJECT_PHASE_LABELS[item.phase]}
						{#if item.project_name}· {item.project_name}{/if}
					</p>
				</div>
				<span class="shrink-0 text-xs font-medium {item.days_remaining < 0 ? 'text-red-600' : item.days_remaining <= 7 ? 'text-orange-600' : 'text-gray-500'}">
					{formatDaysLabel(item.days_remaining)}
				</span>
			</button>
		{/each}
	</div>
</div>
