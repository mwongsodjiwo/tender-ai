<!--
  DeadlineList — displays deadlines grouped by urgency with color coding.
  Props:
    - items: DeadlineItem[]
    - view: 'compact' | 'detailed'
    - onItemClick: optional callback
    - showProjectName: whether to display project name (for org-wide view)
-->
<script lang="ts">
	import type { DeadlineItem } from '$types';
	import { PROJECT_PHASE_LABELS, ACTIVITY_STATUS_LABELS, MILESTONE_TYPE_LABELS } from '$types';
	import type { ProjectPhase } from '$types';

	export let items: DeadlineItem[] = [];
	export let view: 'compact' | 'detailed' = 'detailed';
	export let onItemClick: ((item: DeadlineItem) => void) | undefined = undefined;
	export let showProjectName: boolean = true;

	// Filters
	let filterPhase: string = 'all';
	let filterType: string = 'all';

	$: filteredItems = items.filter((item) => {
		if (filterPhase !== 'all' && item.phase !== filterPhase) return false;
		if (filterType !== 'all' && item.type !== filterType) return false;
		return true;
	});

	// Group by urgency
	$: overdueItems = filteredItems.filter((i) => i.days_remaining < 0);
	$: thisWeekItems = filteredItems.filter((i) => i.days_remaining >= 0 && i.days_remaining <= 7);
	$: upcomingItems = filteredItems.filter((i) => i.days_remaining > 7);

	// Color helpers
	function getDotColor(days: number): string {
		if (days < 0) return 'bg-red-500';
		if (days <= 7) return 'bg-orange-500';
		if (days <= 14) return 'bg-yellow-500';
		return 'bg-green-500';
	}

	function getBadgeColor(days: number): string {
		if (days < 0) return 'text-red-700 bg-red-100';
		if (days <= 7) return 'text-orange-700 bg-orange-100';
		if (days <= 14) return 'text-yellow-700 bg-yellow-100';
		return 'text-green-700 bg-green-100';
	}

	function getBadgeLabel(days: number): string {
		if (days < 0) return 'Verlopen';
		if (days <= 7) return 'Urgent';
		if (days <= 14) return 'Binnenkort';
		return 'Op schema';
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
		return `${days} dagen`;
	}

	function handleClick(item: DeadlineItem): void {
		if (onItemClick) {
			onItemClick(item);
		}
	}

	// Unique phases from current items for filter dropdown
	$: availablePhases = [...new Set(items.map((i) => i.phase))].filter(Boolean) as ProjectPhase[];
</script>

<div class="space-y-4">
	<!-- Filters -->
	<div class="flex flex-wrap items-center gap-3">
		<select
			bind:value={filterPhase}
			class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
			aria-label="Filter op fase"
		>
			<option value="all">Alle fasen</option>
			{#each availablePhases as phase (phase)}
				<option value={phase}>{PROJECT_PHASE_LABELS[phase]}</option>
			{/each}
		</select>

		<select
			bind:value={filterType}
			class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
			aria-label="Filter op type"
		>
			<option value="all">Alles</option>
			<option value="milestone">Milestones</option>
			<option value="activity">Activiteiten</option>
		</select>

		<span class="text-xs text-gray-500">{filteredItems.length} resultaten</span>
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
		<!-- Overdue group -->
		{#if overdueItems.length > 0}
			<div>
				<h3 class="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700">
					<span class="inline-block h-2 w-2 rounded-full bg-red-500"></span>
					Verlopen ({overdueItems.length})
				</h3>
				<div class="space-y-2">
					{#each overdueItems as item (item.id)}
						<button
							type="button"
							class="flex w-full items-center gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left transition-colors hover:bg-red-100"
							on:click={() => handleClick(item)}
						>
							<span class="inline-block h-2.5 w-2.5 shrink-0 rounded-full {getDotColor(item.days_remaining)}"></span>

							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									{#if item.is_critical}
										<svg class="h-4 w-4 shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20" aria-label="Kritiek">
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
										</svg>
									{/if}
									<p class="truncate text-sm font-medium text-gray-900">{item.title}</p>
									<span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {item.type === 'milestone' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}">
										{item.type === 'milestone' ? 'Milestone' : 'Activiteit'}
									</span>
								</div>
								{#if view === 'detailed'}
									<p class="mt-0.5 text-xs text-gray-500">
										{PROJECT_PHASE_LABELS[item.phase]} · {ACTIVITY_STATUS_LABELS[item.status]}
										{#if showProjectName && item.project_name}
											· {item.project_name}
										{/if}
										{#if item.assigned_to_name}
											· {item.assigned_to_name}
										{/if}
									</p>
								{/if}
							</div>

							<div class="shrink-0 text-right">
								<p class="text-sm text-gray-700">{formatDate(item.date)}</p>
								<p class="text-xs font-medium text-red-600">{formatDaysLabel(item.days_remaining)}</p>
							</div>

							<span class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium {getBadgeColor(item.days_remaining)}">
								{getBadgeLabel(item.days_remaining)}
							</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- This week group -->
		{#if thisWeekItems.length > 0}
			<div>
				<h3 class="mb-2 flex items-center gap-2 text-sm font-semibold text-orange-700">
					<span class="inline-block h-2 w-2 rounded-full bg-orange-500"></span>
					Deze week ({thisWeekItems.length})
				</h3>
				<div class="space-y-2">
					{#each thisWeekItems as item (item.id)}
						<button
							type="button"
							class="flex w-full items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:bg-gray-50"
							on:click={() => handleClick(item)}
						>
							<span class="inline-block h-2.5 w-2.5 shrink-0 rounded-full {getDotColor(item.days_remaining)}"></span>

							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									{#if item.is_critical}
										<svg class="h-4 w-4 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-label="Kritiek">
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
										</svg>
									{/if}
									<p class="truncate text-sm font-medium text-gray-900">{item.title}</p>
									<span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {item.type === 'milestone' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}">
										{item.type === 'milestone' ? 'Milestone' : 'Activiteit'}
									</span>
								</div>
								{#if view === 'detailed'}
									<p class="mt-0.5 text-xs text-gray-500">
										{PROJECT_PHASE_LABELS[item.phase]} · {ACTIVITY_STATUS_LABELS[item.status]}
										{#if showProjectName && item.project_name}
											· {item.project_name}
										{/if}
										{#if item.assigned_to_name}
											· {item.assigned_to_name}
										{/if}
									</p>
								{/if}
							</div>

							<div class="shrink-0 text-right">
								<p class="text-sm text-gray-700">{formatDate(item.date)}</p>
								<p class="text-xs font-medium text-orange-600">{formatDaysLabel(item.days_remaining)}</p>
							</div>

							<span class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium {getBadgeColor(item.days_remaining)}">
								{getBadgeLabel(item.days_remaining)}
							</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Upcoming group -->
		{#if upcomingItems.length > 0}
			<div>
				<h3 class="mb-2 flex items-center gap-2 text-sm font-semibold text-green-700">
					<span class="inline-block h-2 w-2 rounded-full bg-green-500"></span>
					Komende ({upcomingItems.length})
				</h3>
				<div class="space-y-2">
					{#each upcomingItems as item (item.id)}
						<button
							type="button"
							class="flex w-full items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:bg-gray-50"
							on:click={() => handleClick(item)}
						>
							<span class="inline-block h-2.5 w-2.5 shrink-0 rounded-full {getDotColor(item.days_remaining)}"></span>

							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									{#if item.is_critical}
										<svg class="h-4 w-4 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-label="Kritiek">
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
										</svg>
									{/if}
									<p class="truncate text-sm font-medium text-gray-900">{item.title}</p>
									<span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {item.type === 'milestone' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}">
										{item.type === 'milestone' ? 'Milestone' : 'Activiteit'}
									</span>
								</div>
								{#if view === 'detailed'}
									<p class="mt-0.5 text-xs text-gray-500">
										{PROJECT_PHASE_LABELS[item.phase]} · {ACTIVITY_STATUS_LABELS[item.status]}
										{#if showProjectName && item.project_name}
											· {item.project_name}
										{/if}
										{#if item.assigned_to_name}
											· {item.assigned_to_name}
										{/if}
									</p>
								{/if}
							</div>

							<div class="shrink-0 text-right">
								<p class="text-sm text-gray-700">{formatDate(item.date)}</p>
								<p class="text-xs font-medium {item.days_remaining <= 14 ? 'text-yellow-600' : 'text-gray-500'}">{formatDaysLabel(item.days_remaining)}</p>
							</div>

							<span class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium {getBadgeColor(item.days_remaining)}">
								{getBadgeLabel(item.days_remaining)}
							</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
