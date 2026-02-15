<!--
  DeadlineCalendar — monthly calendar view with deadline markers.
  Props:
    - items: DeadlineItem[]
    - onDateClick: optional callback when a day is clicked
    - onItemClick: optional callback when a deadline item is clicked
-->
<script lang="ts">
	import type { DeadlineItem } from '$types';
	import { PROJECT_PHASE_LABELS, ACTIVITY_STATUS_LABELS } from '$types';

	export let items: DeadlineItem[] = [];
	export let onDateClick: ((date: Date) => void) | undefined = undefined;
	export let onItemClick: ((item: DeadlineItem) => void) | undefined = undefined;

	// Current displayed month
	let currentYear: number = new Date().getFullYear();
	let currentMonth: number = new Date().getMonth();

	// Popover state
	let popoverDate: string | null = null;
	let popoverX: number = 0;
	let popoverY: number = 0;

	const WEEKDAY_LABELS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

	$: monthLabel = new Date(currentYear, currentMonth).toLocaleDateString('nl-NL', {
		month: 'long',
		year: 'numeric'
	});

	// Group items by date string (YYYY-MM-DD)
	$: itemsByDate = items.reduce(
		(acc, item) => {
			const dateKey = item.date.split('T')[0];
			if (!acc[dateKey]) {
				acc[dateKey] = [];
			}
			acc[dateKey].push(item);
			return acc;
		},
		{} as Record<string, DeadlineItem[]>
	);

	// Build calendar grid
	$: calendarDays = buildCalendarGrid(currentYear, currentMonth);

	function buildCalendarGrid(
		year: number,
		month: number
	): { date: Date; dateStr: string; isCurrentMonth: boolean; isToday: boolean }[] {
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);

		// Monday = 0, Sunday = 6
		let startOffset = firstDay.getDay() - 1;
		if (startOffset < 0) startOffset = 6;

		const days: { date: Date; dateStr: string; isCurrentMonth: boolean; isToday: boolean }[] = [];
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Previous month fill
		for (let i = startOffset - 1; i >= 0; i--) {
			const d = new Date(year, month, -i);
			days.push({
				date: d,
				dateStr: formatDateKey(d),
				isCurrentMonth: false,
				isToday: d.getTime() === today.getTime()
			});
		}

		// Current month days
		for (let i = 1; i <= lastDay.getDate(); i++) {
			const d = new Date(year, month, i);
			days.push({
				date: d,
				dateStr: formatDateKey(d),
				isCurrentMonth: true,
				isToday: d.getTime() === today.getTime()
			});
		}

		// Next month fill to complete 6 rows (42 days)
		const remaining = 42 - days.length;
		for (let i = 1; i <= remaining; i++) {
			const d = new Date(year, month + 1, i);
			days.push({
				date: d,
				dateStr: formatDateKey(d),
				isCurrentMonth: false,
				isToday: d.getTime() === today.getTime()
			});
		}

		return days;
	}

	function formatDateKey(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}

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

	function getDotColor(item: DeadlineItem): string {
		if (item.days_remaining < 0) return 'bg-red-500';
		if (item.days_remaining <= 7) return 'bg-orange-500';
		if (item.days_remaining <= 14) return 'bg-yellow-500';
		return 'bg-green-500';
	}

	function getMostUrgentColor(dateItems: DeadlineItem[]): string {
		const minDays = Math.min(...dateItems.map((i) => i.days_remaining));
		if (minDays < 0) return 'ring-red-400';
		if (minDays <= 7) return 'ring-orange-400';
		if (minDays <= 14) return 'ring-yellow-400';
		return 'ring-green-400';
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

		if (onDateClick) {
			onDateClick(date);
		}
	}

	function handleItemClick(item: DeadlineItem): void {
		if (onItemClick) {
			onItemClick(item);
		}
	}

	function closePopover(): void {
		popoverDate = null;
	}

	function formatPopoverDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('nl-NL', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function formatDaysLabel(days: number): string {
		if (days === 0) return 'Vandaag';
		if (days === 1) return 'Morgen';
		if (days === -1) return 'Gisteren';
		if (days < 0) return `${Math.abs(days)}d verlopen`;
		return `${days}d`;
	}
</script>

<svelte:window on:keydown={(e) => { if (e.key === 'Escape') closePopover(); }} />

<div class="rounded-lg border border-gray-200 bg-white">
	<!-- Calendar header -->
	<div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
		<div class="flex items-center gap-2">
			<button
				type="button"
				on:click={() => navigateMonth(-1)}
				class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
				aria-label="Vorige maand"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</button>
			<h3 class="text-sm font-semibold capitalize text-gray-900">{monthLabel}</h3>
			<button
				type="button"
				on:click={() => navigateMonth(1)}
				class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
				aria-label="Volgende maand"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>
		<button
			type="button"
			on:click={goToToday}
			class="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
		>
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
				<!-- Day number -->
				<span
					class="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs
						{day.isToday ? 'bg-primary-600 font-bold text-white' : day.isCurrentMonth ? 'font-medium text-gray-900' : 'text-gray-500'}"
				>
					{day.date.getDate()}
				</span>

				<!-- Deadline dots -->
				{#if hasItems}
					<div class="mt-0.5 flex flex-wrap gap-0.5">
						{#each dayItems.slice(0, 3) as item (item.id)}
							<span
								class="inline-block h-1.5 w-1.5 rounded-full {getDotColor(item)}"
								title="{item.title}"
							></span>
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
	<!-- Backdrop to close popover -->
	<button
		type="button"
		class="fixed inset-0 z-40"
		on:click={closePopover}
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
			{#each itemsByDate[popoverDate] ?? [] as item (item.id)}
				<button
					type="button"
					on:click={() => handleItemClick(item)}
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
{/if}
