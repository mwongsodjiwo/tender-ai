<script lang="ts">
	export let activities: {
		label: string;
		status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
		href: string | null;
		dueDate?: string | null;
		assignedToName?: string | null;
	}[];

	function formatDueDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('nl-NL', {
			day: 'numeric',
			month: 'short'
		});
	}

	const STATUS_ICONS: Record<string, { class: string; symbol: 'check' | 'progress' | 'skip' | 'empty' }> = {
		completed: { class: 'bg-success-100 text-success-600', symbol: 'check' },
		in_progress: { class: 'bg-primary-100 text-primary-600', symbol: 'progress' },
		skipped: { class: 'bg-gray-100 text-gray-400', symbol: 'skip' },
		not_started: { class: 'bg-gray-50 text-gray-300', symbol: 'empty' }
	};

	const STATUS_LABELS: Record<string, string> = {
		completed: 'Afgerond',
		in_progress: 'Bezig',
		skipped: 'Overgeslagen',
		not_started: 'Niet gestart'
	};
</script>

<ul class="space-y-2" role="list">
	{#each activities as activity}
		{@const icon = STATUS_ICONS[activity.status] ?? STATUS_ICONS.not_started}
		<li>
			{#if activity.href}
				<a
					href={activity.href}
					class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50"
				>
					<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full {icon.class}" aria-hidden="true">
						{#if icon.symbol === 'check'}
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						{:else if icon.symbol === 'progress'}
							<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" d="M12 2a10 10 0 019.95 9" />
							</svg>
						{:else if icon.symbol === 'skip'}
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4-4 4M3 12h18" />
							</svg>
						{:else}
							<div class="h-2.5 w-2.5 rounded-full bg-gray-200"></div>
						{/if}
					</div>
					<div class="min-w-0 flex-1">
						<span class="text-sm {activity.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-700'}">
							{activity.label}
						</span>
						{#if activity.dueDate || activity.assignedToName}
							<p class="mt-0.5 text-xs text-gray-400">
								{#if activity.assignedToName}{activity.assignedToName}{/if}
								{#if activity.dueDate && activity.assignedToName} &middot; {/if}
								{#if activity.dueDate}{formatDueDate(activity.dueDate)}{/if}
							</p>
						{/if}
					</div>
					<span class="shrink-0 text-xs text-gray-400">{STATUS_LABELS[activity.status]}</span>
					<svg class="h-4 w-4 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
					</svg>
				</a>
			{:else}
				<div class="flex items-center gap-3 px-3 py-2.5">
					<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full {icon.class}" aria-hidden="true">
						{#if icon.symbol === 'check'}
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						{:else if icon.symbol === 'progress'}
							<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" d="M12 2a10 10 0 019.95 9" />
							</svg>
						{:else}
							<div class="h-2.5 w-2.5 rounded-full bg-gray-200"></div>
						{/if}
					</div>
					<div class="min-w-0 flex-1">
						<span class="text-sm {activity.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-700'}">
							{activity.label}
						</span>
						{#if activity.dueDate || activity.assignedToName}
							<p class="mt-0.5 text-xs text-gray-400">
								{#if activity.assignedToName}{activity.assignedToName}{/if}
								{#if activity.dueDate && activity.assignedToName} &middot; {/if}
								{#if activity.dueDate}{formatDueDate(activity.dueDate)}{/if}
							</p>
						{/if}
					</div>
					<span class="shrink-0 text-xs text-gray-400">{STATUS_LABELS[activity.status]}</span>
				</div>
			{/if}
		</li>
	{/each}
</ul>
