<script lang="ts">
	export let value: string | number;
	export let label: string;
	export let trend: string = '';
	export let trendDirection: 'up' | 'down' | 'neutral' = 'neutral';
	export let loading: boolean = false;

	const TREND_COLORS = {
		up: 'text-success-600',
		down: 'text-error-600',
		neutral: 'text-gray-500'
	} as const;
</script>

<div class="rounded-card bg-white p-6 shadow-card">
	{#if loading}
		<div class="animate-pulse">
			<div class="h-4 w-20 rounded bg-gray-200"></div>
			<div class="mt-3 h-8 w-16 rounded bg-gray-200"></div>
		</div>
	{:else}
		<p class="text-sm font-medium text-gray-500">{label}</p>
		<p class="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{value}</p>
		{#if trend}
			<div class="mt-2 flex items-center gap-1 text-sm {TREND_COLORS[trendDirection]}">
				{#if trendDirection === 'up'}
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
					</svg>
				{:else if trendDirection === 'down'}
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
					</svg>
				{/if}
				<span>{trend}</span>
			</div>
		{/if}
	{/if}
</div>
