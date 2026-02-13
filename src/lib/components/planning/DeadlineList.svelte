<!--
  DeadlineList — displays deadlines in a table matching correspondence design.
  Props:
    - items: DeadlineItem[]
    - view: 'compact' | 'detailed'
    - onItemClick: optional callback
    - showProjectName: whether to display project name (for org-wide view)
-->
<script lang="ts">
	import type { DeadlineItem } from '$types';
	import { PROJECT_PHASES, PROJECT_PHASE_LABELS, ACTIVITY_STATUS_LABELS } from '$types';
	import type { ProjectPhase } from '$types';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	export let items: DeadlineItem[] = [];
	export let view: 'compact' | 'detailed' = 'detailed';
	export let onItemClick: ((item: DeadlineItem) => void) | undefined = undefined;
	export let onDateChange: ((item: DeadlineItem, newDate: string) => void) | undefined = undefined;
	export let onContextMenu: ((e: MouseEvent, item: DeadlineItem) => void) | undefined = undefined;
	export let showProjectName: boolean = true;

	let filterPhase: string = 'all';
	let editingDateId: string | null = null;

	$: filteredItems = items.filter((item) => {
		if (filterPhase !== 'all' && item.phase !== filterPhase) return false;
		return true;
	});

	$: sortedItems = [...filteredItems].sort((a, b) => a.days_remaining - b.days_remaining);

	function getUrgencyBadge(days: number): { label: string; classes: string } {
		if (days < 0) return { label: 'Verlopen', classes: 'text-red-700 bg-red-100' };
		if (days <= 7) return { label: 'Urgent', classes: 'text-orange-700 bg-orange-100' };
		if (days <= 14) return { label: 'Binnenkort', classes: 'text-yellow-700 bg-yellow-100' };
		return { label: 'Op schema', classes: 'text-green-700 bg-green-100' };
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('nl-NL', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function formatDaysLabel(days: number): string {
		if (days === 0) return 'Vandaag';
		if (days === 1) return 'Morgen';
		if (days === -1) return 'Gisteren';
		if (days < 0) return `${Math.abs(days)} dagen verlopen`;
		return `Over ${days} dagen`;
	}

	function handleClick(item: DeadlineItem): void {
		if (onItemClick) onItemClick(item);
	}
</script>

<div class="space-y-4">
	<!-- Phase filter buttons -->
	<div class="flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5" role="radiogroup" aria-label="Filter op fase">
		<button
			type="button"
			on:click={() => { filterPhase = 'all'; }}
			class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors
				{filterPhase === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
			role="radio"
			aria-checked={filterPhase === 'all'}
		>
			Totaal
		</button>
		{#each PROJECT_PHASES as phase (phase)}
			<button
				type="button"
				on:click={() => { filterPhase = phase; }}
				class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors
					{filterPhase === phase ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
				role="radio"
				aria-checked={filterPhase === phase}
			>
				{PROJECT_PHASE_LABELS[phase]}
			</button>
		{/each}
	</div>

	<!-- No results -->
	{#if filteredItems.length === 0}
		<div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
			<svg class="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
			</svg>
			<h3 class="mt-3 text-sm font-medium text-gray-900">Geen deadlines</h3>
			<p class="mt-1 text-sm text-gray-500">
				Er zijn geen deadlines die voldoen aan de huidige filters.
			</p>
		</div>
	{:else}
		<!-- Table -->
		<div class="rounded-card bg-white shadow-card overflow-hidden">
			<table class="w-full">
				<thead>
					<tr class="border-b border-gray-200">
						<th class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Urgentie</th>
						<th class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Titel</th>
						<th class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Fase</th>
						<th class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Status</th>
						<th class="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">Datum</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each sortedItems as item (item.id)}
						{@const urgency = getUrgencyBadge(item.days_remaining)}
						<tr
							class="group transition-colors hover:bg-gray-50 {onItemClick ? 'cursor-pointer' : ''}"
							on:click={() => handleClick(item)}
							on:contextmenu={(e) => { if (onContextMenu) onContextMenu(e, item); }}
							role={onItemClick ? 'button' : undefined}
							tabindex={onItemClick ? 0 : undefined}
							on:keydown={(e) => { if (e.key === 'Enter') handleClick(item); }}
						>
							<td class="px-6 py-4">
								<span class="inline-flex items-center rounded-badge px-2.5 py-0.5 text-xs font-medium {urgency.classes}">
									{urgency.label}
								</span>
							</td>
							<td class="px-6 py-4 min-w-0">
								<div class="flex items-center gap-2">
									{#if item.is_critical}
										<svg class="h-4 w-4 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-label="Kritiek">
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
										</svg>
									{/if}
									<span class="text-sm font-medium text-gray-900">{item.title}</span>
								</div>
								{#if view === 'detailed' && ((showProjectName && item.project_name) || item.assigned_to_name)}
									<p class="mt-0.5 text-xs text-gray-500">
										{#if showProjectName && item.project_name}
											{item.project_name}
										{/if}
										{#if item.assigned_to_name}
											{#if showProjectName && item.project_name}&middot; {/if}{item.assigned_to_name}
										{/if}
									</p>
								{/if}
							</td>
							<td class="px-6 py-4">
								<StatusBadge status={item.phase} />
							</td>
							<td class="px-6 py-4">
								<span class="text-xs text-gray-700">{ACTIVITY_STATUS_LABELS[item.status]}</span>
							</td>
							<td class="px-6 py-4 text-right" on:click|stopPropagation>
								{#if onDateChange && editingDateId === item.id}
									<input
										type="date"
										value={item.date}
										on:change={(e) => {
											const val = e.currentTarget.value;
											if (val && val !== item.date) onDateChange(item, val);
											editingDateId = null;
										}}
										on:blur={() => { editingDateId = null; }}
										on:keydown={(e) => { if (e.key === 'Escape') editingDateId = null; }}
										class="w-36 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
									/>
								{:else}
									<button
										type="button"
										on:click={() => { if (onDateChange) editingDateId = item.id; }}
										class="inline-flex flex-col items-end {onDateChange ? 'cursor-pointer rounded-md px-2 py-1 transition-colors hover:bg-gray-100' : ''}"
										disabled={!onDateChange}
									>
										<span class="text-sm text-gray-700">{formatDate(item.date)}</span>
										<span class="text-xs text-gray-500">{formatDaysLabel(item.days_remaining)}</span>
									</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
