<!--
  DeadlineCalendar — monthly calendar view with deadline markers.
  Props:
    - items: DeadlineItem[]
    - onDateClick: optional callback when a day is clicked
    - onItemClick: optional callback when a deadline item is clicked
-->
<script lang="ts">
	import type { DeadlineItem } from '$types';
	import DeadlineCalendarPopover from './DeadlineCalendarPopover.svelte';
	import { buildCalendarGrid, getDotColor, groupItemsByDate } from './deadline-calendar-helpers';

	export let items: DeadlineItem[] = [];
	export let onDateClick: ((date: Date) => void) | undefined = undefined;
	export let onItemClick: ((item: DeadlineItem) => void) | undefined = undefined;

	let currentYear: number = new Date().getFullYear();
	let currentMonth: number = new Date().getMonth();

	let popoverDate: string | null = null;
	let popoverX: number = 0;
	let popoverY: number = 0;

	const WEEKDAY_LABELS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

	$: monthLabel = new Date(currentYear, currentMonth).toLocaleDateString('nl-NL', {
		month: 'long',
		year: 'numeric'
	});

	$: itemsByDate = groupItemsByDate(items);
	$: calendarDays = buildCalendarGrid(currentYear, currentMonth);

	function navigateMonth(delta: number): void {
		const d = new Date(currentYear, currentMonth + delta, 1);
		currentYear = d.getFullYear();
		currentMonth = d.getMonth();
		popoverDate = null;
	}

	function goToToday(): void {
		const now = new Date();
		currentYear = now.getFullYear();
		currentMonth = now.getMonth();
		popoverDate = null;
	}

	function handleDayClick(event: MouseEvent, dateStr: string, date: Date): void {
		if (popoverDate === dateStr) {
			popoverDate = null;
			return;
		}
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		popoverX = rect.left;
		popoverY = rect.bottom + 4;
		popoverDate = dateStr;
		if (onDateClick) onDateClick(date);
	}
</script>

<div class="rounded-lg border border-gray-200 bg-white">
	<!-- Calendar header -->
	<div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
		<div class="flex items-center gap-2">
			<button type="button" on:click={() => navigateMonth(-1)}
				class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
				aria-label="Vorige maand">
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</button>
			<h3 class="text-sm font-semibold capitalize text-gray-900">{monthLabel}</h3>
			<button type="button" on:click={() => navigateMonth(1)}
				class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
				aria-label="Volgende maand">
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>
		<button type="button" on:click={goToToday}
			class="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50">
			Vandaag
		</button>
	</div>

	<!-- Weekday headers -->
	<div class="grid grid-cols-7 border-b border-gray-100">
		{#each WEEKDAY_LABELS as day (day)}
			<div class="px-2 py-2 text-center text-xs font-medium text-gray-500">{day}</div>
		{/each}
	</div>

	<!-- Calendar grid -->
	<div class="grid grid-cols-7">
		{#each calendarDays as day, i (day.dateStr + i)}
			{@const dayItems = itemsByDate[day.dateStr] ?? []}
			{@const hasItems = dayItems.length > 0}
			{@const hasCritical = dayItems.some((di) => di.is_critical)}
			<button
				type="button"
				on:click={(e) => handleDayClick(e, day.dateStr, day.date)}
				class="relative min-h-[4.5rem] border-b border-r border-gray-100 p-1 text-left transition-colors
					{day.isCurrentMonth ? '' : 'bg-gray-50'}
					{day.isToday ? 'bg-primary-50' : ''}
					{hasItems ? 'cursor-pointer hover:bg-gray-50' : ''}
					{popoverDate === day.dateStr ? 'ring-2 ring-inset ring-primary-500' : ''}"
				aria-label="{day.date.getDate()} {hasItems ? `— ${dayItems.length} deadlines` : ''}"
			>
				<span class="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs
					{day.isToday ? 'bg-primary-600 font-semibold text-white' : day.isCurrentMonth ? 'font-medium text-gray-900' : 'text-gray-500'}">
					{day.date.getDate()}
				</span>

				{#if hasItems}
					<div class="mt-0.5 flex flex-wrap gap-0.5">
						{#each dayItems.slice(0, 3) as item (item.id)}
							<span class="inline-block h-1.5 w-1.5 rounded-full {getDotColor(item)}" title="{item.title}"></span>
						{/each}
						{#if dayItems.length > 3}
							<span class="text-[10px] leading-none text-gray-500">+{dayItems.length - 3}</span>
						{/if}
					</div>
					{#if hasCritical}
						<svg class="absolute right-1 top-1 h-3 w-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-label="Kritiek">
							<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
						</svg>
					{/if}
				{/if}
			</button>
		{/each}
	</div>
</div>

<!-- Popover for day details -->
{#if popoverDate && (itemsByDate[popoverDate] ?? []).length > 0}
	<DeadlineCalendarPopover
		{popoverDate}
		items={itemsByDate[popoverDate]}
		{popoverX}
		{popoverY}
		onClose={() => { popoverDate = null; }}
		{onItemClick}
	/>
{/if}
